from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("", response_model=List[schemas.ToolResponse])
def list_tools(db: Session = Depends(get_db)):
    return crud.get_tools(db)


@router.get("/{tool_id}", response_model=schemas.ToolResponse)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = crud.get_tool(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("", response_model=schemas.ToolResponse, status_code=201)
def create_tool(tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    existing = crud.get_tool_by_name(db, tool.name)
    if existing:
        raise HTTPException(status_code=409, detail="Tool with this name already exists")
    return crud.create_tool(db, tool)


@router.put("/{tool_id}", response_model=schemas.ToolResponse)
def update_tool(tool_id: int, tool: schemas.ToolUpdate, db: Session = Depends(get_db)):
    updated = crud.update_tool(db, tool_id, tool)
    if not updated:
        raise HTTPException(status_code=404, detail="Tool not found")
    return updated


@router.delete("/{tool_id}", status_code=204)
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    db_tool = crud.get_tool(db, tool_id)
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    if not db_tool.is_custom:
        raise HTTPException(status_code=400, detail="Cannot delete built-in tools")
    crud.delete_tool(db, tool_id)
