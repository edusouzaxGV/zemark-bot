from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas
from database import get_db

router = APIRouter(prefix="/tools", tags=["tools"])

@router.get("/", response_model=List[schemas.ToolOut])
def list_tools(db: Session = Depends(get_db)):
    return crud.get_tools(db)

@router.get("/{tool_id}", response_model=schemas.ToolOut)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = crud.get_tool(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool

@router.post("/", response_model=schemas.ToolOut)
def create_tool(tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    return crud.create_tool(db, tool)

@router.put("/{tool_id}", response_model=schemas.ToolOut)
def update_tool(tool_id: int, tool: schemas.ToolUpdate, db: Session = Depends(get_db)):
    result = crud.update_tool(db, tool_id, tool)
    if not result:
        raise HTTPException(status_code=404, detail="Tool not found")
    return result

@router.delete("/{tool_id}")
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    crud.delete_tool(db, tool_id)
    return {"ok": True}
