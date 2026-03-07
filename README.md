# CrewAI Platform

A full-stack AI Agents Management Platform inspired by [CrewAI AMP](https://app.crewai.com). Build, manage, and execute AI agent crews with real-time execution monitoring.

## Features

- **Dashboard** — Stats overview, recent runs, activity feed
- **Crews Manager** — Create and configure agent crews with sequential/hierarchical/parallel execution
- **Agents Manager** — Define agents with roles, goals, backstories, LLM models, and tools
- **Tasks Manager** — Define tasks with dependencies, agent assignments, and expected outputs
- **Execution Engine** — Execute crews with live WebSocket streaming logs
- **Traces / Observability** — Detailed execution timeline with per-agent step analysis
- **Tools Registry** — Browse built-in tools and create custom Python tools with Monaco editor
- **Settings** — API key management for all LLM providers

## Pre-loaded Workspaces

The platform seeds three workspaces on startup:

| Workspace | Agents | Focus |
|-----------|--------|-------|
| **ZEMARK** | ZEMARK, GERALD, TINA, POLI, PEDRO_GOMES | Strategy & Intelligence |
| **CASSIO** | SNAKE, GERALT, LINK, SAMUS, RATCHET, KRATOS | Cybersecurity Operations |
| **DUDU** | DUDU | Ecommerce Management |

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| State | Zustand + TanStack Query |
| Tables | TanStack Table (sort/filter/pagination) |
| Forms | react-hook-form + Zod |
| Code Editor | Monaco Editor |
| Backend | FastAPI + Uvicorn |
| Database | SQLite via SQLAlchemy |
| AI Framework | CrewAI |
| Real-time | WebSockets |

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure API keys
cp ../.env.example ../.env
# Edit .env and add your API keys

# Start the server
uvicorn main:app --reload --port 8000
```

The backend starts at http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at http://localhost:5173

## API Keys

Add your keys to `.env` to enable real AI execution:

| Key | Provider | Used For |
|-----|---------|----------|
| `OPENAI_API_KEY` | OpenAI | GPT-4o, GPT-3.5-turbo |
| `ANTHROPIC_API_KEY` | Anthropic | Claude models |
| `GOOGLE_API_KEY` | Google | Gemini Pro |
| `SERPER_API_KEY` | Serper.dev | Web search tool |
| `EXA_API_KEY` | Exa | Semantic search tool |

> **Note:** Without API keys, the platform operates in **Simulation Mode** — it simulates agent execution with mock steps so you can explore the UI.

## WebSocket Protocol

The execution engine streams real-time logs via WebSocket at `/ws/runs/{run_id}`:

```json
// Step event
{"type": "step", "data": {"agent": "ZEMARK", "step_type": "thought", "content": "...", "timestamp": "..."}}

// Tool call
{"type": "step", "data": {"agent": "ZEMARK", "step_type": "tool_call", "tool_name": "SerperDevTool", "content": "..."}}

// Completion
{"type": "complete", "data": {"result": "...", "token_usage": {}}}

// Error
{"type": "error", "data": {"error": "..."}}
```

## Project Structure

```
zemark-bot/
├── backend/
│   ├── main.py              # FastAPI app + startup seeding
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── crew_runner.py       # CrewAI execution engine
│   ├── ws_manager.py        # WebSocket manager
│   ├── requirements.txt
│   └── routers/
│       ├── agents.py
│       ├── crews.py
│       ├── tasks.py
│       ├── runs.py          # + WebSocket endpoint
│       ├── tools.py
│       └── dashboard.py
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Crews, Agents, Tasks, Runs, Traces, Tools, Settings
│   │   ├── components/      # Layout, Sidebar, TopBar, RunTerminal, AgentCard, ui/
│   │   ├── api/client.ts    # Axios API client
│   │   ├── store/index.ts   # Zustand state
│   │   └── types/index.ts   # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── docker-compose.yml
└── README.md
```
