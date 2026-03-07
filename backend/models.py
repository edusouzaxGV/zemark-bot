from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    goal = Column(Text, nullable=False)
    backstory = Column(Text, nullable=False)
    llm_model = Column(String, default="gpt-4o")
    allow_delegation = Column(Boolean, default=False)
    verbose = Column(Boolean, default=True)
    max_iter = Column(Integer, default=25)
    max_rpm = Column(Integer, nullable=True)
    tools = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crew_assignments = relationship("CrewAgent", back_populates="agent", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="agent")


class Crew(Base):
    __tablename__ = "crews"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    process_type = Column(String, default="sequential")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agents = relationship("CrewAgent", back_populates="crew", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="crew")
    runs = relationship("Run", back_populates="crew")


class CrewAgent(Base):
    __tablename__ = "crew_agents"

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id", ondelete="CASCADE"))
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"))
    order_index = Column(Integer, default=0)

    crew = relationship("Crew", back_populates="agents")
    agent = relationship("Agent", back_populates="crew_assignments")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=True)
    context_task_ids = Column(JSON, default=[])
    output_file = Column(String, nullable=True)
    human_input = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="tasks")
    crew = relationship("Crew", back_populates="tasks")


class Run(Base):
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"))
    status = Column(String, default="pending")
    inputs = Column(JSON, default={})
    result = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    token_usage = Column(JSON, default={})

    crew = relationship("Crew", back_populates="runs")
    steps = relationship("RunStep", back_populates="run", cascade="all, delete-orphan")


class RunStep(Base):
    __tablename__ = "run_steps"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"))
    agent_name = Column(String)
    step_type = Column(String)
    content = Column(Text)
    tool_name = Column(String, nullable=True)
    tool_input = Column(Text, nullable=True)
    tool_output = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer, nullable=True)

    run = relationship("Run", back_populates="steps")


class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    is_custom = Column(Boolean, default=False)
    python_code = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
