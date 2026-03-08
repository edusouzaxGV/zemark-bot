import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas
from database import get_db, SessionLocal
from ws_manager import manager
import crew_runner

router = APIRouter(prefix="/runs", tags=["runs"])

@router.get("/", response_model=List[schemas.RunOut])
def list_runs(crew_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_runs(db, crew_id=crew_id)

@router.get("/{run_id}", response_model=schemas.RunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = crud.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.post("/execute", response_model=schemas.RunOut)
async def execute(run_in: schemas.RunCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    crew = crud.get_crew(db, run_in.crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    run = crud.create_run(db, run_in)

    async def run_task():
        task_db = SessionLocal()
        try:
            await crew_runner.execute_crew(run.id, task_db)
        finally:
            task_db.close()

    background_tasks.add_task(asyncio.create_task, run_task())
    return run

@router.websocket("/{run_id}/stream")
async def stream(websocket: WebSocket, run_id: int):
    await manager.connect(websocket, run_id)
    try:
        while True:
            await websocket.receive_text()  # keep-alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, run_id)
