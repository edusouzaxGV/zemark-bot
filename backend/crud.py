from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import models, schemas
from datetime import datetime


# --- Tools ---
def get_tools(db: Session):
    return db.query(models.Tool).all()

def get_tool(db: Session, tool_id: int):
    return db.query(models.Tool).filter(models.Tool.id == tool_id).first()

def create_tool(db: Session, tool: schemas.ToolCreate):
    db_tool = models.Tool(**tool.model_dump())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

def update_tool(db: Session, tool_id: int, tool: schemas.ToolUpdate):
    db_tool = get_tool(db, tool_id)
    if db_tool:
        for k, v in tool.model_dump().items():
            setattr(db_tool, k, v)
        db.commit()
        db.refresh(db_tool)
    return db_tool

def delete_tool(db: Session, tool_id: int):
    db_tool = get_tool(db, tool_id)
    if db_tool:
        db.delete(db_tool)
        db.commit()


# --- Agents ---
def get_agents(db: Session, workspace: str = None):
    q = db.query(models.Agent)
    if workspace:
        q = q.filter(models.Agent.workspace == workspace)
    return q.all()

def get_agent(db: Session, agent_id: int):
    return db.query(models.Agent).filter(models.Agent.id == agent_id).first()

def create_agent(db: Session, agent: schemas.AgentCreate):
    db_agent = models.Agent(**agent.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def update_agent(db: Session, agent_id: int, agent: schemas.AgentUpdate):
    db_agent = get_agent(db, agent_id)
    if db_agent:
        for k, v in agent.model_dump().items():
            setattr(db_agent, k, v)
        db_agent.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_agent)
    return db_agent

def delete_agent(db: Session, agent_id: int):
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()


# --- Crews ---
def get_crews(db: Session, workspace: str = None):
    q = db.query(models.Crew).options(
        joinedload(models.Crew.crew_agents).joinedload(models.CrewAgent.agent)
    )
    if workspace:
        q = q.filter(models.Crew.workspace == workspace)
    return q.all()

def get_crew(db: Session, crew_id: int):
    return db.query(models.Crew).options(
        joinedload(models.Crew.crew_agents).joinedload(models.CrewAgent.agent)
    ).filter(models.Crew.id == crew_id).first()

def create_crew(db: Session, crew: schemas.CrewCreate):
    data = crew.model_dump(exclude={"agent_ids"})
    db_crew = models.Crew(**data)
    db.add(db_crew)
    db.commit()
    for i, agent_id in enumerate(crew.agent_ids):
        ca = models.CrewAgent(crew_id=db_crew.id, agent_id=agent_id, order=i)
        db.add(ca)
    db.commit()
    db.refresh(db_crew)
    return db_crew

def update_crew(db: Session, crew_id: int, crew: schemas.CrewUpdate):
    db_crew = get_crew(db, crew_id)
    if db_crew:
        for k, v in crew.model_dump(exclude={"agent_ids"}).items():
            setattr(db_crew, k, v)
        db_crew.updated_at = datetime.utcnow()
        # Update crew_agents
        db.query(models.CrewAgent).filter(models.CrewAgent.crew_id == crew_id).delete()
        for i, agent_id in enumerate(crew.agent_ids):
            ca = models.CrewAgent(crew_id=crew_id, agent_id=agent_id, order=i)
            db.add(ca)
        db.commit()
        db.refresh(db_crew)
    return db_crew

def delete_crew(db: Session, crew_id: int):
    db_crew = get_crew(db, crew_id)
    if db_crew:
        db.delete(db_crew)
        db.commit()


# --- Tasks ---
def get_tasks(db: Session, crew_id: int = None):
    q = db.query(models.Task).options(joinedload(models.Task.agent))
    if crew_id:
        q = q.filter(models.Task.crew_id == crew_id)
    return q.order_by(models.Task.order).all()

def get_task(db: Session, task_id: int):
    return db.query(models.Task).options(joinedload(models.Task.agent)).filter(models.Task.id == task_id).first()

def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
    db_task = get_task(db, task_id)
    if db_task:
        for k, v in task.model_dump().items():
            setattr(db_task, k, v)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()


# --- Runs ---
def get_runs(db: Session, crew_id: int = None, limit: int = 50):
    q = db.query(models.Run).options(
        joinedload(models.Run.crew),
        joinedload(models.Run.steps)
    )
    if crew_id:
        q = q.filter(models.Run.crew_id == crew_id)
    return q.order_by(models.Run.created_at.desc()).limit(limit).all()

def get_run(db: Session, run_id: int):
    return db.query(models.Run).options(
        joinedload(models.Run.crew),
        joinedload(models.Run.steps)
    ).filter(models.Run.id == run_id).first()

def create_run(db: Session, run: schemas.RunCreate):
    db_run = models.Run(**run.model_dump())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

def update_run_status(db: Session, run_id: int, status: str, result: str = None, error: str = None, token_usage: dict = None):
    db_run = get_run(db, run_id)
    if db_run:
        db_run.status = status
        if result is not None:
            db_run.result = result
        if error is not None:
            db_run.error = error
        if token_usage is not None:
            db_run.token_usage = token_usage
        if status == "running":
            db_run.started_at = datetime.utcnow()
        elif status in ("completed", "failed"):
            db_run.finished_at = datetime.utcnow()
        db.commit()
        db.refresh(db_run)
    return db_run

def add_run_step(db: Session, run_id: int, step_type: str, content: str, agent_name: str = None, tool_name: str = None, tool_input: str = None):
    step = models.RunStep(
        run_id=run_id,
        step_type=step_type,
        content=content,
        agent_name=agent_name,
        tool_name=tool_name,
        tool_input=tool_input,
    )
    db.add(step)
    db.commit()
    return step


# --- Dashboard ---
def get_dashboard_stats(db: Session):
    total_crews = db.query(func.count(models.Crew.id)).scalar()
    total_agents = db.query(func.count(models.Agent.id)).scalar()
    total_runs = db.query(func.count(models.Run.id)).scalar()
    active_runs = db.query(func.count(models.Run.id)).filter(models.Run.status == "running").scalar()
    completed = db.query(func.count(models.Run.id)).filter(models.Run.status == "completed").scalar()
    success_rate = (completed / total_runs * 100) if total_runs > 0 else 0.0
    recent_runs = get_runs(db, limit=10)
    return {
        "total_crews": total_crews,
        "total_agents": total_agents,
        "total_runs": total_runs,
        "active_runs": active_runs,
        "success_rate": round(success_rate, 1),
        "recent_runs": recent_runs,
    }
