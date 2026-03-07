from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _enrich_task(task, db: Session) -> schemas.TaskResponse:
    agent_name = task.agent.name if task.agent else None
    crew_name = task.crew.name if task.crew else None
    return schemas.TaskResponse(
        id=task.id,
        description=task.description,
        expected_output=task.expected_output,
        agent_id=task.agent_id,
        crew_id=task.crew_id,
        context_task_ids=task.context_task_ids or [],
        output_file=task.output_file,
        human_input=task.human_input,
        order_index=task.order_index,
        created_at=task.created_at,
        agent_name=agent_name,
        crew_name=crew_name,
    )


@router.get("", response_model=List[schemas.TaskResponse])
def list_tasks(crew_id: Optional[int] = None, db: Session = Depends(get_db)):
    tasks = crud.get_tasks(db, crew_id=crew_id)
    return [_enrich_task(t, db) for t in tasks]


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _enrich_task(task, db)


@router.post("", response_model=schemas.TaskResponse, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = crud.create_task(db, task)
    return _enrich_task(db_task, db)


@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    updated = crud.update_task(db, task_id, task)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return _enrich_task(updated, db)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    if not crud.delete_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
