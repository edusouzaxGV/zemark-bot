from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import models
import schemas


# ---- Agents ----

def get_agents(db: Session, skip: int = 0, limit: int = 100) -> List[models.Agent]:
    return db.query(models.Agent).offset(skip).limit(limit).all()


def get_agent(db: Session, agent_id: int) -> Optional[models.Agent]:
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()


def create_agent(db: Session, agent: schemas.AgentCreate) -> models.Agent:
    db_agent = models.Agent(**agent.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def update_agent(db: Session, agent_id: int, agent: schemas.AgentUpdate) -> Optional[models.Agent]:
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return None
    update_data = agent.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_agent, key, value)
    db_agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_agent)
    return db_agent


def delete_agent(db: Session, agent_id: int) -> bool:
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return False
    db.delete(db_agent)
    db.commit()
    return True


# ---- Crews ----

def get_crews(db: Session, skip: int = 0, limit: int = 100) -> List[models.Crew]:
    return db.query(models.Crew).offset(skip).limit(limit).all()


def get_crew(db: Session, crew_id: int) -> Optional[models.Crew]:
    return db.query(models.Crew).filter(models.Crew.id == crew_id).first()


def get_crew_by_name(db: Session, name: str) -> Optional[models.Crew]:
    return db.query(models.Crew).filter(models.Crew.name == name).first()


def create_crew(db: Session, crew: schemas.CrewCreate) -> models.Crew:
    db_crew = models.Crew(**crew.model_dump())
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)
    return db_crew


def update_crew(db: Session, crew_id: int, crew: schemas.CrewUpdate) -> Optional[models.Crew]:
    db_crew = get_crew(db, crew_id)
    if not db_crew:
        return None
    update_data = crew.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_crew, key, value)
    db_crew.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_crew)
    return db_crew


def delete_crew(db: Session, crew_id: int) -> bool:
    db_crew = get_crew(db, crew_id)
    if not db_crew:
        return False
    db.delete(db_crew)
    db.commit()
    return True


def assign_agents_to_crew(db: Session, crew_id: int, agent_ids: List[int]) -> models.Crew:
    # Remove existing assignments
    db.query(models.CrewAgent).filter(models.CrewAgent.crew_id == crew_id).delete()
    # Add new assignments
    for idx, agent_id in enumerate(agent_ids):
        ca = models.CrewAgent(crew_id=crew_id, agent_id=agent_id, order_index=idx)
        db.add(ca)
    db.commit()
    return get_crew(db, crew_id)


def get_crew_agents(db: Session, crew_id: int) -> List[models.Agent]:
    assignments = (
        db.query(models.CrewAgent)
        .filter(models.CrewAgent.crew_id == crew_id)
        .order_by(models.CrewAgent.order_index)
        .all()
    )
    return [a.agent for a in assignments]


# ---- Tasks ----

def get_tasks(db: Session, crew_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[models.Task]:
    q = db.query(models.Task)
    if crew_id is not None:
        q = q.filter(models.Task.crew_id == crew_id)
    return q.order_by(models.Task.order_index).offset(skip).limit(limit).all()


def get_task(db: Session, task_id: int) -> Optional[models.Task]:
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def create_task(db: Session, task: schemas.TaskCreate) -> models.Task:
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task: schemas.TaskUpdate) -> Optional[models.Task]:
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    update_data = task.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True


# ---- Runs ----

def get_runs(db: Session, skip: int = 0, limit: int = 50) -> List[models.Run]:
    return db.query(models.Run).order_by(models.Run.created_at.desc()).offset(skip).limit(limit).all()


def get_run(db: Session, run_id: int) -> Optional[models.Run]:
    return db.query(models.Run).filter(models.Run.id == run_id).first()


def create_run(db: Session, crew_id: int, inputs: Dict[str, Any]) -> models.Run:
    db_run = models.Run(crew_id=crew_id, inputs=inputs, status="pending")
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


def update_run_status(db: Session, run_id: int, status: str, result: Optional[str] = None,
                      error: Optional[str] = None, token_usage: Optional[Dict] = None) -> Optional[models.Run]:
    db_run = get_run(db, run_id)
    if not db_run:
        return None
    db_run.status = status
    if result is not None:
        db_run.result = result
    if error is not None:
        db_run.error = error
    if token_usage is not None:
        db_run.token_usage = token_usage
    if status == "running" and db_run.started_at is None:
        db_run.started_at = datetime.utcnow()
    if status in ("completed", "failed"):
        db_run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(db_run)
    return db_run


def add_run_step(db: Session, run_id: int, agent_name: str, step_type: str,
                 content: str, tool_name: Optional[str] = None,
                 tool_input: Optional[str] = None, tool_output: Optional[str] = None,
                 duration_ms: Optional[int] = None) -> models.RunStep:
    step = models.RunStep(
        run_id=run_id,
        agent_name=agent_name,
        step_type=step_type,
        content=content,
        tool_name=tool_name,
        tool_input=tool_input,
        tool_output=tool_output,
        duration_ms=duration_ms,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def get_run_steps(db: Session, run_id: int) -> List[models.RunStep]:
    return (
        db.query(models.RunStep)
        .filter(models.RunStep.run_id == run_id)
        .order_by(models.RunStep.timestamp)
        .all()
    )


def get_active_runs_count(db: Session) -> int:
    return db.query(models.Run).filter(models.Run.status == "running").count()


# ---- Tools ----

def get_tools(db: Session) -> List[models.Tool]:
    return db.query(models.Tool).order_by(models.Tool.name).all()


def get_tool(db: Session, tool_id: int) -> Optional[models.Tool]:
    return db.query(models.Tool).filter(models.Tool.id == tool_id).first()


def get_tool_by_name(db: Session, name: str) -> Optional[models.Tool]:
    return db.query(models.Tool).filter(models.Tool.name == name).first()


def create_tool(db: Session, tool: schemas.ToolCreate) -> models.Tool:
    db_tool = models.Tool(**tool.model_dump())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool


def update_tool(db: Session, tool_id: int, tool: schemas.ToolUpdate) -> Optional[models.Tool]:
    db_tool = get_tool(db, tool_id)
    if not db_tool:
        return None
    update_data = tool.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tool, key, value)
    db.commit()
    db.refresh(db_tool)
    return db_tool


def delete_tool(db: Session, tool_id: int) -> bool:
    db_tool = get_tool(db, tool_id)
    if not db_tool:
        return False
    db.delete(db_tool)
    db.commit()
    return True


# ---- Dashboard ----

def get_dashboard_stats(db: Session) -> dict:
    total_crews = db.query(models.Crew).count()
    total_agents = db.query(models.Agent).count()
    total_tasks = db.query(models.Task).count()
    total_runs = db.query(models.Run).count()
    active_runs = db.query(models.Run).filter(models.Run.status == "running").count()
    completed_runs = db.query(models.Run).filter(models.Run.status == "completed").count()
    failed_runs = db.query(models.Run).filter(models.Run.status == "failed").count()
    success_rate = round(completed_runs / total_runs * 100, 1) if total_runs > 0 else 0.0
    recent_runs = (
        db.query(models.Run)
        .order_by(models.Run.created_at.desc())
        .limit(10)
        .all()
    )
    return {
        "total_crews": total_crews,
        "total_agents": total_agents,
        "total_tasks": total_tasks,
        "total_runs": total_runs,
        "active_runs": active_runs,
        "completed_runs": completed_runs,
        "failed_runs": failed_runs,
        "success_rate": success_rate,
        "recent_runs": recent_runs,
    }
