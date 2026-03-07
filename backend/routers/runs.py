from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from database import get_db, SessionLocal
import crud
import schemas
from crew_runner import execute_crew
from ws_manager import manager

router = APIRouter(tags=["runs"])


def _run_response(run) -> schemas.RunResponse:
    return schemas.RunResponse(
        id=run.id,
        crew_id=run.crew_id,
        status=run.status,
        inputs=run.inputs or {},
        result=run.result,
        error=run.error,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
        token_usage=run.token_usage or {},
        crew_name=run.crew.name if run.crew else None,
    )


@router.post("/api/runs", response_model=schemas.RunResponse, status_code=201)
async def start_run(payload: schemas.RunCreate, background_tasks: BackgroundTasks,
                    db: Session = Depends(get_db)):
    crew = crud.get_crew(db, payload.crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")

    run = crud.create_run(db, payload.crew_id, payload.inputs)

    async def run_in_background(run_id: int, crew_id: int, inputs: dict):
        bg_db = SessionLocal()
        try:
            await execute_crew(run_id, crew_id, inputs, bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(run_in_background, run.id, run.crew_id, run.inputs)
    return _run_response(run)


@router.get("/api/runs", response_model=List[schemas.RunResponse])
def list_runs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    runs = crud.get_runs(db, skip=skip, limit=limit)
    return [_run_response(r) for r in runs]


@router.get("/api/runs/{run_id}", response_model=schemas.RunResponse)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = crud.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_response(run)


@router.get("/api/runs/{run_id}/steps", response_model=List[schemas.RunStepResponse])
def get_run_steps(run_id: int, db: Session = Depends(get_db)):
    run = crud.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return crud.get_run_steps(db, run_id)


@router.get("/api/runs/{run_id}/result")
def get_run_result(run_id: int, db: Session = Depends(get_db)):
    run = crud.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"result": run.result, "status": run.status, "token_usage": run.token_usage}


@router.websocket("/ws/runs/{run_id}")
async def websocket_run_stream(websocket: WebSocket, run_id: int):
    await manager.connect(run_id, websocket)
    try:
        # Send current run state immediately on connect
        db = SessionLocal()
        try:
            run = crud.get_run(db, run_id)
            if run:
                await websocket.send_json({
                    "type": "status",
                    "data": {"status": run.status}
                })
                # Replay existing steps
                steps = crud.get_run_steps(db, run_id)
                for step in steps:
                    await websocket.send_json({
                        "type": "step",
                        "data": {
                            "id": step.id,
                            "agent": step.agent_name,
                            "step_type": step.step_type,
                            "content": step.content,
                            "tool_name": step.tool_name,
                            "tool_input": step.tool_input,
                            "tool_output": step.tool_output,
                            "timestamp": step.timestamp.isoformat(),
                        }
                    })
                if run.status in ("completed", "failed"):
                    await websocket.send_json({
                        "type": "complete" if run.status == "completed" else "error",
                        "data": {"result": run.result, "error": run.error}
                    })
        finally:
            db.close()

        # Keep connection alive until client disconnects
        while True:
            try:
                await websocket.receive_text()
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(run_id, websocket)
