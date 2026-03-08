from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    tool_type = Column(String, default="builtin")  # builtin | custom
    python_code = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String)
    goal = Column(Text)
    backstory = Column(Text)
    llm_model = Column(String, default="claude-sonnet-4-6")
    allow_delegation = Column(Boolean, default=False)
    verbose = Column(Boolean, default=True)
    max_iter = Column(Integer, default=25)
    max_rpm = Column(Integer, nullable=True)
    tools = Column(JSON, default=list)  # list of tool names
    workspace = Column(String, default="default")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crew_agents = relationship("CrewAgent", back_populates="agent")
    tasks = relationship("Task", back_populates="agent")


class Crew(Base):
    __tablename__ = "crews"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    process_type = Column(String, default="sequential")  # sequential | hierarchical | parallel
    workspace = Column(String, default="default")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crew_agents = relationship("CrewAgent", back_populates="crew", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="crew")
    runs = relationship("Run", back_populates="crew")


class CrewAgent(Base):
    __tablename__ = "crew_agents"
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    order = Column(Integer, default=0)

    crew = relationship("Crew", back_populates="crew_agents")
    agent = relationship("Agent", back_populates="crew_agents")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    expected_output = Column(Text)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=True)
    context_task_ids = Column(JSON, default=list)  # list of task IDs
    output_file = Column(String, nullable=True)
    human_input = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="tasks")
    crew = relationship("Crew", back_populates="tasks")


class Run(Base):
    __tablename__ = "runs"
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"))
    status = Column(String, default="pending")  # pending | running | completed | failed
    inputs = Column(JSON, default=dict)
    result = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    token_usage = Column(JSON, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    crew = relationship("Crew", back_populates="runs")
    steps = relationship("RunStep", back_populates="run", cascade="all, delete-orphan")


class RunStep(Base):
    __tablename__ = "run_steps"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"))
    agent_name = Column(String, nullable=True)
    step_type = Column(String)  # thought | action | tool_call | tool_result | final_answer
    content = Column(Text)
    tool_name = Column(String, nullable=True)
    tool_input = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    run = relationship("Run", back_populates="steps")
