"""
CrewAI execution engine with live step broadcasting via WebSocket.
Falls back to a mock runner if crewai is not installed.
"""
import asyncio
import json
import traceback
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

import crud
import models
from ws_manager import manager

# Try to import crewai; use mock if unavailable
try:
    from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
    from crewai.tools import BaseTool
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False


# ----- LLM model mapping -----
LLM_MODELS = {
    "claude-sonnet-4-6": "claude-sonnet-4-6",
    "claude-opus-4-6": "claude-opus-4-6",
    "claude-haiku-4-5": "claude-haiku-4-5-20251001",
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gemini-pro": "gemini/gemini-pro",
    "llama3": "ollama/llama3",
}


async def _emit(run_id: int, step_type: str, content: str, agent_name: str = None, tool_name: str = None, tool_input: str = None):
    """Broadcast a step event to all WS listeners for this run."""
    await manager.broadcast_to_run(run_id, {
        "type": step_type,
        "agent": agent_name,
        "content": content,
        "tool": tool_name,
        "tool_input": tool_input,
        "timestamp": datetime.utcnow().isoformat(),
    })


def _save_step(db: Session, run_id: int, step_type: str, content: str, agent_name: str = None, tool_name: str = None, tool_input: str = None):
    crud.add_run_step(db, run_id, step_type, content, agent_name, tool_name, tool_input)


async def execute_crew(run_id: int, db: Session):
    """Main entry point — runs a crew execution asynchronously."""
    run = crud.get_run(db, run_id)
    if not run:
        return

    crew_db = crud.get_crew(db, run.crew_id)
    if not crew_db:
        crud.update_run_status(db, run_id, "failed", error="Crew not found")
        return

    crud.update_run_status(db, run_id, "running")
    await _emit(run_id, "status", f"Starting crew: {crew_db.name}")

    try:
        if CREWAI_AVAILABLE:
            await _run_with_crewai(run, crew_db, db)
        else:
            await _run_mock(run, crew_db, db)
    except Exception as e:
        err = traceback.format_exc()
        _save_step(db, run_id, "error", err)
        await _emit(run_id, "error", err)
        crud.update_run_status(db, run_id, "failed", error=str(e))
        await _emit(run_id, "status", "Run failed")


async def _run_with_crewai(run: models.Run, crew_db: models.Crew, db: Session):
    """Build and kick off a real CrewAI crew."""
    run_id = run.id

    # Build agents
    crew_agents_db = sorted(crew_db.crew_agents, key=lambda ca: ca.order)
    crewai_agents = []
    agent_map = {}
    for ca in crew_agents_db:
        ag = ca.agent
        if not ag:
            continue
        llm_model = LLM_MODELS.get(ag.llm_model, ag.llm_model)
        crewai_agent = CrewAgent(
            role=ag.role,
            goal=ag.goal,
            backstory=ag.backstory,
            llm=llm_model,
            allow_delegation=ag.allow_delegation,
            verbose=ag.verbose,
            max_iter=ag.max_iter,
        )
        crewai_agents.append(crewai_agent)
        agent_map[ag.name] = crewai_agent

    # Build tasks
    tasks_db = crud.get_tasks(db, crew_id=crew_db.id)
    crewai_tasks = []
    task_obj_map = {}
    for t in tasks_db:
        assigned_agent = None
        if t.agent:
            assigned_agent = agent_map.get(t.agent.name)
        context_tasks = [task_obj_map[tid] for tid in (t.context_task_ids or []) if tid in task_obj_map]
        crewai_task = CrewTask(
            description=t.description,
            expected_output=t.expected_output,
            agent=assigned_agent,
            context=context_tasks if context_tasks else None,
            output_file=t.output_file,
            human_input=t.human_input,
        )
        crewai_tasks.append(crewai_task)
        task_obj_map[t.id] = crewai_task

    process = Process.sequential if crew_db.process_type == "sequential" else Process.hierarchical

    # Custom step callback
    def step_callback(step_output):
        # step_output is an AgentFinish or similar
        content = str(step_output)
        _save_step(db, run_id, "action", content)
        asyncio.get_event_loop().call_soon_threadsafe(
            asyncio.ensure_future,
            _emit(run_id, "action", content)
        )

    crew = Crew(
        agents=crewai_agents,
        tasks=crewai_tasks,
        process=process,
        verbose=True,
        step_callback=step_callback,
    )

    # Run in thread pool so it doesn't block async loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: crew.kickoff(inputs=run.inputs or {}))

    result_str = str(result)
    _save_step(db, run_id, "final_answer", result_str)
    await _emit(run_id, "final_answer", result_str)
    crud.update_run_status(db, run_id, "completed", result=result_str)
    await _emit(run_id, "status", "completed")


async def _run_mock(run: models.Run, crew_db: models.Crew, db: Session):
    """Mock execution when CrewAI is not installed — useful for UI dev/testing."""
    run_id = run.id
    agents = [ca.agent for ca in sorted(crew_db.crew_agents, key=lambda ca: ca.order) if ca.agent]
    tasks = crud.get_tasks(db, crew_id=crew_db.id)

    steps = [
        ("thought", "Analisando o objetivo e planejando a abordagem..."),
        ("action", "Pesquisando informações relevantes..."),
        ("tool_call", "Executando ferramenta de busca", "SerperDevTool", '{"query": "AI agents platform"}'),
        ("tool_result", "Encontrados 10 resultados relevantes"),
        ("thought", "Processando resultados e sintetizando informações..."),
        ("final_answer", f"# Resultado da Execução da Crew: {crew_db.name}\n\nTarefa concluída com sucesso. O agente processou todas as informações e gerou uma resposta detalhada baseada nos inputs fornecidos.\n\n**Inputs recebidos:** {json.dumps(run.inputs, ensure_ascii=False)}\n\n**Conclusão:** Sistema funcionando corretamente."),
    ]

    for i, agent in enumerate(agents or [{"role": "Agente Padrão", "name": "Agent"}]):
        agent_name = getattr(agent, "role", agent.get("role", "Agent")) if hasattr(agent, "role") else agent.get("role", "Agent")
        await _emit(run_id, "agent_start", f"Agente '{agent_name}' iniciando execução", agent_name=agent_name)
        _save_step(db, run_id, "agent_start", f"Agente iniciando", agent_name=agent_name)

        task = tasks[i] if i < len(tasks) else None
        if task:
            await _emit(run_id, "thought", f"Tarefa: {task.description[:100]}...", agent_name=agent_name)
            await asyncio.sleep(0.5)

        for step in steps[:-1]:
            step_type = step[0]
            content = step[1]
            tool_name = step[2] if len(step) > 2 else None
            tool_input = step[3] if len(step) > 3 else None
            await asyncio.sleep(0.8)
            await _emit(run_id, step_type, content, agent_name=agent_name, tool_name=tool_name, tool_input=tool_input)
            _save_step(db, run_id, step_type, content, agent_name=agent_name, tool_name=tool_name, tool_input=tool_input)

    # Final answer
    final = steps[-1][1]
    await asyncio.sleep(1)
    await _emit(run_id, "final_answer", final)
    _save_step(db, run_id, "final_answer", final)
    crud.update_run_status(db, run_id, "completed", result=final)
    await _emit(run_id, "status", "completed")
