from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas
from database import get_db

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/", response_model=List[schemas.AgentOut])
def list_agents(workspace: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_agents(db, workspace=workspace)

@router.get("/{agent_id}", response_model=schemas.AgentOut)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.post("/", response_model=schemas.AgentOut)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    return crud.create_agent(db, agent)

@router.put("/{agent_id}", response_model=schemas.AgentOut)
def update_agent(agent_id: int, agent: schemas.AgentUpdate, db: Session = Depends(get_db)):
    result = crud.update_agent(db, agent_id, agent)
    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")
    return result

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    crud.delete_agent(db, agent_id)
    return {"ok": True}
