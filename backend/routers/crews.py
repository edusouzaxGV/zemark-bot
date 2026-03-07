from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/crews", tags=["crews"])


@router.get("", response_model=List[schemas.CrewResponse])
def list_crews(db: Session = Depends(get_db)):
    crews = crud.get_crews(db)
    result = []
    for crew in crews:
        agent_count = len(crew.agents)
        task_count = len(crew.tasks)
        result.append(schemas.CrewResponse(
            id=crew.id,
            name=crew.name,
            description=crew.description,
            process_type=crew.process_type,
            created_at=crew.created_at,
            updated_at=crew.updated_at,
            agent_count=agent_count,
            task_count=task_count,
        ))
    return result


@router.get("/{crew_id}", response_model=schemas.CrewResponse)
def get_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = crud.get_crew(db, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    return schemas.CrewResponse(
        id=crew.id,
        name=crew.name,
        description=crew.description,
        process_type=crew.process_type,
        created_at=crew.created_at,
        updated_at=crew.updated_at,
        agent_count=len(crew.agents),
        task_count=len(crew.tasks),
    )


@router.post("", response_model=schemas.CrewResponse, status_code=201)
def create_crew(crew: schemas.CrewCreate, db: Session = Depends(get_db)):
    db_crew = crud.create_crew(db, crew)
    return schemas.CrewResponse(
        id=db_crew.id,
        name=db_crew.name,
        description=db_crew.description,
        process_type=db_crew.process_type,
        created_at=db_crew.created_at,
        updated_at=db_crew.updated_at,
        agent_count=0,
        task_count=0,
    )


@router.put("/{crew_id}", response_model=schemas.CrewResponse)
def update_crew(crew_id: int, crew: schemas.CrewUpdate, db: Session = Depends(get_db)):
    updated = crud.update_crew(db, crew_id, crew)
    if not updated:
        raise HTTPException(status_code=404, detail="Crew not found")
    return schemas.CrewResponse(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        process_type=updated.process_type,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        agent_count=len(updated.agents),
        task_count=len(updated.tasks),
    )


@router.delete("/{crew_id}", status_code=204)
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    if not crud.delete_crew(db, crew_id):
        raise HTTPException(status_code=404, detail="Crew not found")


@router.post("/{crew_id}/agents", response_model=schemas.CrewResponse)
def assign_agents(crew_id: int, payload: schemas.CrewAgentAssign, db: Session = Depends(get_db)):
    crew = crud.get_crew(db, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    updated = crud.assign_agents_to_crew(db, crew_id, payload.agent_ids)
    return schemas.CrewResponse(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        process_type=updated.process_type,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        agent_count=len(updated.agents),
        task_count=len(updated.tasks),
    )


@router.get("/{crew_id}/agents", response_model=List[schemas.AgentResponse])
def get_crew_agents(crew_id: int, db: Session = Depends(get_db)):
    crew = crud.get_crew(db, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    return crud.get_crew_agents(db, crew_id)
