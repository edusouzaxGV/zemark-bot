# AMP — AI Agents Management Platform

A full-stack platform for managing CrewAI agents, crews, tasks, and runs — inspired by [CrewAI AMP](https://app.crewai.com).

## Stack

- **Backend**: FastAPI + CrewAI + SQLAlchemy + SQLite + WebSockets
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query

## Features

- **Dashboard** — Stats, recent runs, activity
- **Crews** — Create/manage AI crews with multiple agents
- **Agents** — Full agent config (role, goal, backstory, LLM, tools)
- **Tasks** — Define tasks with agent assignments and dependencies
- **Runs** — Execute crews with real-time WebSocket streaming logs
- **Traces** — Step-by-step execution timeline per run
- **Tools Registry** — Builtin + custom tools

## Pre-seeded Workspaces

| Workspace | Agents |
|-----------|--------|
| ZEMARK | ZEMARK, GERALD, TINA, POLI, PEDRO_GOMES |
| CASSIO | SNAKE, GERALT, LINK, SAMUS, RATCHET, KRATOS |
| DUDU | DUDU |

## Quick Start

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# 2. Start everything
chmod +x start.sh
./start.sh
```

## Manual Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

## Project Structure

```
zemark-bot/
├── backend/
│   ├── main.py          # FastAPI app + auto-seed
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # Database operations
│   ├── crew_runner.py   # CrewAI execution engine
│   ├── ws_manager.py    # WebSocket connection manager
│   ├── seed.py          # Database seeder
│   ├── database.py      # DB setup
│   └── routers/         # FastAPI routers (agents, crews, tasks, runs, tools, dashboard)
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, Crews, Agents, Tasks, Runs, Traces, Tools
│       ├── components/  # Sidebar, TopBar, StatusBadge, RunTerminal
│       ├── api/         # Axios client + typed API functions
│       ├── store/       # Zustand global state
│       └── lib/         # Utils
├── main.py              # Original Telegram bot (unchanged)
├── start.sh             # One-command startup script
└── .env.example
```

## Notes

- The database is auto-seeded on first run with ZEMARK, CASSIO, DUDU workspaces
- If `crewai` package is not installed, a mock runner simulates execution for UI development
- The existing Telegram bot (`main.py`) is preserved and independent
