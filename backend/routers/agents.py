from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=List[schemas.AgentResponse])
def list_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_agents(db, skip=skip, limit=limit)


@router.get("/{agent_id}", response_model=schemas.AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("", response_model=schemas.AgentResponse, status_code=201)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    return crud.create_agent(db, agent)


@router.put("/{agent_id}", response_model=schemas.AgentResponse)
def update_agent(agent_id: int, agent: schemas.AgentUpdate, db: Session = Depends(get_db)):
    updated = crud.update_agent(db, agent_id, agent)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent not found")
    return updated


@router.delete("/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    if not crud.delete_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
