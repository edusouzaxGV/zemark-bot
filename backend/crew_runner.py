"""
CrewAI execution engine with graceful degradation.
If CrewAI or API keys are not available, falls back to simulation mode.
"""
import asyncio
import time
import json
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session

import crud
from ws_manager import manager

# Try to import CrewAI - graceful fallback if not installed
try:
    from crewai import Agent as CrewAIAgent, Task as CrewAITask, Crew as CrewAICrew, Process
    from crewai.agents.agent_builder.utilities.output_converter import ConverterError
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False

# LLM model mapping
LLM_MODELS = {
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "gpt-3.5-turbo": "openai/gpt-3.5-turbo",
    "claude-sonnet-4-5": "anthropic/claude-sonnet-4-5",
    "claude-opus-4": "anthropic/claude-opus-4",
    "claude-haiku-4-5": "anthropic/claude-haiku-4-5-20251001",
    "gemini-pro": "google/gemini-pro",
    "llama3": "ollama/llama3",
}

# Available built-in tool map
def _get_crewai_tools(tool_names: list):
    """Return instantiated CrewAI tool objects for the given names."""
    if not CREWAI_AVAILABLE:
        return []
    tools = []
    try:
        from crewai_tools import (
            SerperDevTool, FileReadTool, FileWriterTool,
            WebsiteSearchTool, YoutubeVideoSearchTool,
        )
        tool_map = {
            "SerperDevTool": SerperDevTool,
            "FileReadTool": FileReadTool,
            "FileWriterTool": FileWriterTool,
            "WebsiteSearchTool": WebsiteSearchTool,
            "YoutubeVideoSearchTool": YoutubeVideoSearchTool,
        }
        for name in tool_names:
            if name in tool_map:
                try:
                    tools.append(tool_map[name]())
                except Exception:
                    pass
    except ImportError:
        pass
    return tools


class StepCapture:
    """Callback handler that captures agent steps and broadcasts them via WebSocket."""

    def __init__(self, run_id: int, db: Session, loop: asyncio.AbstractEventLoop):
        self.run_id = run_id
        self.db = db
        self.loop = loop
        self.current_agent = "Unknown"

    def _broadcast_sync(self, message: dict):
        """Schedule an async broadcast from a sync context."""
        try:
            asyncio.run_coroutine_threadsafe(
                manager.broadcast(self.run_id, message), self.loop
            )
        except Exception:
            pass

    def _save_and_broadcast(self, agent_name: str, step_type: str, content: str,
                             tool_name: Optional[str] = None, tool_input: Optional[str] = None,
                             tool_output: Optional[str] = None):
        try:
            step = crud.add_run_step(
                self.db, self.run_id, agent_name, step_type, content,
                tool_name=tool_name, tool_input=tool_input, tool_output=tool_output
            )
            self._broadcast_sync({
                "type": "step",
                "data": {
                    "id": step.id,
                    "agent": agent_name,
                    "step_type": step_type,
                    "content": content,
                    "tool_name": tool_name,
                    "tool_input": tool_input,
                    "tool_output": tool_output,
                    "timestamp": step.timestamp.isoformat(),
                }
            })
        except Exception as e:
            print(f"[StepCapture] Error saving step: {e}")

    def __call__(self, step):
        """Called by CrewAI for each agent step."""
        try:
            # CrewAI passes AgentAction or AgentFinish objects
            if hasattr(step, "thought"):
                self._save_and_broadcast(
                    self.current_agent, "thought", str(step.thought)
                )
            if hasattr(step, "tool") and step.tool:
                self._save_and_broadcast(
                    self.current_agent, "tool_call",
                    f"Using tool: {step.tool}",
                    tool_name=str(step.tool),
                    tool_input=str(getattr(step, "tool_input", "")),
                )
            if hasattr(step, "result"):
                self._save_and_broadcast(
                    self.current_agent, "result", str(step.result)
                )
            if hasattr(step, "output"):
                self._save_and_broadcast(
                    self.current_agent, "result", str(step.output)
                )
        except Exception as e:
            print(f"[StepCapture] Step parsing error: {e}")


async def _simulate_execution(run_id: int, crew_name: str, agents: list, db: Session):
    """Simulate crew execution when CrewAI is not available or API keys are missing."""
    sim_agents = [a.name for a in agents] if agents else ["Agent-1"]

    async def broadcast_step(agent_name: str, step_type: str, content: str,
                              tool_name: Optional[str] = None):
        step = crud.add_run_step(db, run_id, agent_name, step_type, content, tool_name=tool_name)
        await manager.broadcast(run_id, {
            "type": "step",
            "data": {
                "id": step.id,
                "agent": agent_name,
                "step_type": step_type,
                "content": content,
                "tool_name": tool_name,
                "timestamp": step.timestamp.isoformat(),
            }
        })

    await broadcast_step("SYSTEM", "thought", "[SIMULATION MODE] CrewAI not available or API keys not configured.")
    await asyncio.sleep(0.5)

    for agent_name in sim_agents:
        await broadcast_step(agent_name, "thought",
                              f"[SIMULATION] {agent_name} is analyzing the task...")
        await asyncio.sleep(0.8)
        await broadcast_step(agent_name, "tool_call",
                              f"[SIMULATION] {agent_name} is using SerperDevTool",
                              tool_name="SerperDevTool")
        await asyncio.sleep(0.6)
        await broadcast_step(agent_name, "result",
                              f"[SIMULATION] {agent_name} completed assigned work successfully.")
        await asyncio.sleep(0.4)

    return f"[SIMULATION] Crew '{crew_name}' execution completed. All {len(sim_agents)} agent(s) finished their tasks."


async def execute_crew(run_id: int, crew_id: int, inputs: Dict[str, Any], db: Session):
    """
    Main entry point: load crew from DB, build CrewAI objects, execute, stream steps.
    Falls back to simulation if CrewAI/API keys are not available.
    """
    loop = asyncio.get_event_loop()

    # Mark as running
    crud.update_run_status(db, run_id, "running")
    await manager.broadcast(run_id, {"type": "status", "data": {"status": "running"}})

    try:
        # Load crew from DB
        db_crew = crud.get_crew(db, crew_id)
        if not db_crew:
            raise ValueError(f"Crew {crew_id} not found")

        db_agents = crud.get_crew_agents(db, crew_id)
        db_tasks = crud.get_tasks(db, crew_id=crew_id)

        if not CREWAI_AVAILABLE:
            result = await _simulate_execution(run_id, db_crew.name, db_agents, db)
        else:
            # Try real execution
            try:
                result = await _run_crewai(run_id, db_crew, db_agents, db_tasks, inputs, loop, db)
            except Exception as e:
                err_msg = str(e)
                if "api_key" in err_msg.lower() or "authentication" in err_msg.lower() or "openai" in err_msg.lower():
                    await manager.broadcast(run_id, {
                        "type": "step",
                        "data": {
                            "agent": "SYSTEM",
                            "step_type": "thought",
                            "content": f"[SIMULATION] API key not configured ({type(e).__name__}). Running simulation.",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    })
                    result = await _simulate_execution(run_id, db_crew.name, db_agents, db)
                else:
                    raise

        # Mark completed
        crud.update_run_status(db, run_id, "completed", result=result, token_usage={})
        await manager.broadcast(run_id, {
            "type": "complete",
            "data": {"result": result, "token_usage": {}}
        })

    except Exception as e:
        error_msg = str(e)
        crud.update_run_status(db, run_id, "failed", error=error_msg)
        await manager.broadcast(run_id, {
            "type": "error",
            "data": {"error": error_msg}
        })


async def _run_crewai(run_id: int, db_crew, db_agents: list, db_tasks: list,
                      inputs: Dict[str, Any], loop, db: Session) -> str:
    """Build and execute a real CrewAI crew in a thread pool."""

    def _build_and_run():
        step_capture = StepCapture(run_id, db, loop)

        # Build CrewAI agents
        crewai_agents = {}
        for db_agent in db_agents:
            llm_model = LLM_MODELS.get(db_agent.llm_model, db_agent.llm_model)
            tools = _get_crewai_tools(db_agent.tools or [])
            try:
                agent = CrewAIAgent(
                    role=db_agent.role,
                    goal=db_agent.goal,
                    backstory=db_agent.backstory,
                    verbose=db_agent.verbose,
                    allow_delegation=db_agent.allow_delegation,
                    max_iter=db_agent.max_iter,
                    tools=tools,
                    step_callback=step_capture,
                )
                crewai_agents[db_agent.id] = (db_agent.name, agent)
                step_capture.current_agent = db_agent.name
            except Exception as e:
                print(f"[CrewRunner] Failed to build agent {db_agent.name}: {e}")

        # Build CrewAI tasks
        crewai_tasks = []
        task_map = {}
        for db_task in db_tasks:
            assigned_agent = None
            if db_task.agent_id and db_task.agent_id in crewai_agents:
                _, assigned_agent = crewai_agents[db_task.agent_id]
            elif crewai_agents:
                _, assigned_agent = list(crewai_agents.values())[0]

            if assigned_agent is None:
                continue

            try:
                task = CrewAITask(
                    description=db_task.description,
                    expected_output=db_task.expected_output,
                    agent=assigned_agent,
                    human_input=db_task.human_input,
                )
                crewai_tasks.append(task)
                task_map[db_task.id] = task
            except Exception as e:
                print(f"[CrewRunner] Failed to build task: {e}")

        if not crewai_tasks:
            # Create a default task if none defined
            if crewai_agents:
                _, first_agent = list(crewai_agents.values())[0]
                default_task = CrewAITask(
                    description="Complete the assigned objective based on the provided inputs.",
                    expected_output="A comprehensive report or output based on the objective.",
                    agent=first_agent,
                )
                crewai_tasks.append(default_task)

        # Set task contexts (dependencies)
        for db_task in db_tasks:
            if db_task.context_task_ids and db_task.id in task_map:
                ctx_tasks = [task_map[tid] for tid in db_task.context_task_ids if tid in task_map]
                if ctx_tasks:
                    task_map[db_task.id].context = ctx_tasks

        # Determine process type
        process = Process.sequential
        if db_crew.process_type == "hierarchical":
            process = Process.hierarchical

        agent_list = [a for _, a in crewai_agents.values()]

        # Build and kick off crew
        crew = CrewAICrew(
            agents=agent_list,
            tasks=crewai_tasks,
            process=process,
            verbose=True,
        )

        result = crew.kickoff(inputs=inputs if inputs else {})
        return str(result)

    # Run blocking CrewAI code in thread pool
    result = await asyncio.get_event_loop().run_in_executor(None, _build_and_run)
    return result
