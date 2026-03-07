from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ---- Agent Schemas ----

class AgentCreate(BaseModel):
    name: str
    role: str
    goal: str
    backstory: str
    llm_model: str = "gpt-4o"
    allow_delegation: bool = False
    verbose: bool = True
    max_iter: int = 25
    max_rpm: Optional[int] = None
    tools: List[str] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    llm_model: Optional[str] = None
    allow_delegation: Optional[bool] = None
    verbose: Optional[bool] = None
    max_iter: Optional[int] = None
    max_rpm: Optional[int] = None
    tools: Optional[List[str]] = None


class AgentResponse(BaseModel):
    id: int
    name: str
    role: str
    goal: str
    backstory: str
    llm_model: str
    allow_delegation: bool
    verbose: bool
    max_iter: int
    max_rpm: Optional[int]
    tools: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Crew Schemas ----

class CrewCreate(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: str = "sequential"


class CrewUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    process_type: Optional[str] = None


class CrewAgentItem(BaseModel):
    agent_id: int
    order_index: int = 0


class CrewAgentAssign(BaseModel):
    agent_ids: List[int]


class CrewAgentResponse(BaseModel):
    id: int
    crew_id: int
    agent_id: int
    order_index: int

    class Config:
        from_attributes = True


class CrewResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    process_type: str
    created_at: datetime
    updated_at: datetime
    agent_count: int = 0
    task_count: int = 0

    class Config:
        from_attributes = True


# ---- Task Schemas ----

class TaskCreate(BaseModel):
    description: str
    expected_output: str
    agent_id: Optional[int] = None
    crew_id: Optional[int] = None
    context_task_ids: List[int] = []
    output_file: Optional[str] = None
    human_input: bool = False
    order_index: int = 0


class TaskUpdate(BaseModel):
    description: Optional[str] = None
    expected_output: Optional[str] = None
    agent_id: Optional[int] = None
    crew_id: Optional[int] = None
    context_task_ids: Optional[List[int]] = None
    output_file: Optional[str] = None
    human_input: Optional[bool] = None
    order_index: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    description: str
    expected_output: str
    agent_id: Optional[int]
    crew_id: Optional[int]
    context_task_ids: List[int]
    output_file: Optional[str]
    human_input: bool
    order_index: int
    created_at: datetime
    agent_name: Optional[str] = None
    crew_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Run Schemas ----

class RunCreate(BaseModel):
    crew_id: int
    inputs: Dict[str, Any] = {}


class RunResponse(BaseModel):
    id: int
    crew_id: int
    status: str
    inputs: Dict[str, Any]
    result: Optional[str]
    error: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    token_usage: Dict[str, Any]
    crew_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- RunStep Schemas ----

class RunStepResponse(BaseModel):
    id: int
    run_id: int
    agent_name: Optional[str]
    step_type: str
    content: str
    tool_name: Optional[str]
    tool_input: Optional[str]
    tool_output: Optional[str]
    timestamp: datetime
    duration_ms: Optional[int]

    class Config:
        from_attributes = True


# ---- Tool Schemas ----

class ToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_custom: bool = False
    python_code: Optional[str] = None


class ToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    python_code: Optional[str] = None


class ToolResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_custom: bool
    python_code: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Dashboard Schemas ----

class DashboardStats(BaseModel):
    total_crews: int
    total_agents: int
    total_tasks: int
    total_runs: int
    active_runs: int
    completed_runs: int
    failed_runs: int
    success_rate: float
    recent_runs: List[RunResponse] = []
