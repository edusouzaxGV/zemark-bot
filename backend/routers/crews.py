from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas
from database import get_db

router = APIRouter(prefix="/crews", tags=["crews"])

@router.get("/", response_model=List[schemas.CrewOut])
def list_crews(workspace: Optional[str] = None, db: Session = Depends(get_db)):
    crews = crud.get_crews(db, workspace=workspace)
    result = []
    for crew in crews:
        crew_out = schemas.CrewOut.model_validate(crew)
        crew_out.agents = [schemas.AgentOut.model_validate(ca.agent) for ca in crew.crew_agents if ca.agent]
        result.append(crew_out)
    return result

@router.get("/{crew_id}", response_model=schemas.CrewOut)
def get_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = crud.get_crew(db, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    crew_out = schemas.CrewOut.model_validate(crew)
    crew_out.agents = [schemas.AgentOut.model_validate(ca.agent) for ca in crew.crew_agents if ca.agent]
    return crew_out

@router.post("/", response_model=schemas.CrewOut)
def create_crew(crew: schemas.CrewCreate, db: Session = Depends(get_db)):
    db_crew = crud.create_crew(db, crew)
    crew_out = schemas.CrewOut.model_validate(db_crew)
    crew_out.agents = [schemas.AgentOut.model_validate(ca.agent) for ca in db_crew.crew_agents if ca.agent]
    return crew_out

@router.put("/{crew_id}", response_model=schemas.CrewOut)
def update_crew(crew_id: int, crew: schemas.CrewUpdate, db: Session = Depends(get_db)):
    db_crew = crud.update_crew(db, crew_id, crew)
    if not db_crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    crew_out = schemas.CrewOut.model_validate(db_crew)
    crew_out.agents = [schemas.AgentOut.model_validate(ca.agent) for ca in db_crew.crew_agents if ca.agent]
    return crew_out

@router.delete("/{crew_id}")
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    crud.delete_crew(db, crew_id)
    return {"ok": True}
