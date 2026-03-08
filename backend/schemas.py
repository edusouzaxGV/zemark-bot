from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


# Tool schemas
class ToolBase(BaseModel):
    name: str
    description: str
    tool_type: str = "builtin"
    python_code: Optional[str] = None

class ToolCreate(ToolBase): pass
class ToolUpdate(ToolBase): pass
class ToolOut(ToolBase):
    id: int
    created_at: datetime
    class Config: from_attributes = True


# Agent schemas
class AgentBase(BaseModel):
    name: str
    role: str
    goal: str
    backstory: str
    llm_model: str = "claude-sonnet-4-6"
    allow_delegation: bool = False
    verbose: bool = True
    max_iter: int = 25
    max_rpm: Optional[int] = None
    tools: List[str] = []
    workspace: str = "default"

class AgentCreate(AgentBase): pass
class AgentUpdate(AgentBase): pass
class AgentOut(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True


# Crew schemas
class CrewBase(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: str = "sequential"
    workspace: str = "default"

class CrewCreate(CrewBase):
    agent_ids: List[int] = []

class CrewUpdate(CrewBase):
    agent_ids: List[int] = []

class CrewOut(CrewBase):
    id: int
    created_at: datetime
    updated_at: datetime
    agents: List[AgentOut] = []
    class Config: from_attributes = True


# Task schemas
class TaskBase(BaseModel):
    description: str
    expected_output: str
    agent_id: Optional[int] = None
    crew_id: Optional[int] = None
    context_task_ids: List[int] = []
    output_file: Optional[str] = None
    human_input: bool = False
    order: int = 0

class TaskCreate(TaskBase): pass
class TaskUpdate(TaskBase): pass
class TaskOut(TaskBase):
    id: int
    created_at: datetime
    agent: Optional[AgentOut] = None
    class Config: from_attributes = True


# Run schemas
class RunCreate(BaseModel):
    crew_id: int
    inputs: Dict[str, Any] = {}

class RunStepOut(BaseModel):
    id: int
    agent_name: Optional[str]
    step_type: str
    content: str
    tool_name: Optional[str]
    tool_input: Optional[str]
    timestamp: datetime
    class Config: from_attributes = True

class RunOut(BaseModel):
    id: int
    crew_id: int
    status: str
    inputs: Dict[str, Any]
    result: Optional[str]
    error: Optional[str]
    token_usage: Optional[Dict]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime
    crew: Optional[CrewOut] = None
    steps: List[RunStepOut] = []
    class Config: from_attributes = True


# Dashboard stats
class DashboardStats(BaseModel):
    total_crews: int
    total_agents: int
    total_runs: int
    active_runs: int
    success_rate: float
    recent_runs: List[RunOut] = []
