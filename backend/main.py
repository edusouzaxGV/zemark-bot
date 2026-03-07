import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass

from database import engine, SessionLocal, Base
import models
import crud
import schemas
from routers import agents, crews, tasks, runs, tools, dashboard


# ---- Startup seed data ----

DEFAULT_TOOLS = [
    ("SerperDevTool", "Search the web using Serper.dev API"),
    ("FileReadTool", "Read files from the local filesystem"),
    ("FileWriterTool", "Write content to files on the local filesystem"),
    ("WebsiteSearchTool", "Search and extract content from websites"),
    ("YoutubeVideoSearchTool", "Search YouTube videos and retrieve transcripts"),
    ("GithubSearchTool", "Search GitHub repositories and code"),
    ("JSONSearchTool", "Search and query JSON files"),
    ("CSVSearchTool", "Search and query CSV files"),
    ("TXTSearchTool", "Search text files with semantic similarity"),
    ("PDFSearchTool", "Search and extract content from PDF files"),
    ("DirectorySearchTool", "Search and list directory contents"),
    ("CodeDocsSearchTool", "Search code documentation"),
    ("MDXSearchTool", "Search MDX documentation files"),
    ("BrowserbaseLoadTool", "Load web pages via Browserbase cloud browser"),
    ("EXASearchTool", "Semantic search using EXA AI"),
]

SEED_WORKSPACES = [
    {
        "crew": {"name": "ZEMARK Workspace", "description": "Strategic AI orchestration workspace for ZEMARK operations", "process_type": "sequential"},
        "agents": [
            {"name": "ZEMARK", "role": "Strategy Orchestrator", "goal": "Coordinate and synthesize intelligence across all agents to deliver strategic recommendations", "backstory": "ZEMARK is the apex coordinator of the workspace, with deep expertise in synthesizing complex multi-domain information into actionable strategies.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "WebsiteSearchTool"]},
            {"name": "GERALD", "role": "Intelligence Analyst", "goal": "Analyze market trends, competitive intelligence, and strategic data to provide actionable insights", "backstory": "GERALD is a seasoned intelligence analyst with 15 years of experience in market research and competitive analysis.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "WebsiteSearchTool", "PDFSearchTool"]},
            {"name": "TINA", "role": "Communications Specialist", "goal": "Craft compelling narratives, reports, and communications that translate complex analysis into clear messaging", "backstory": "TINA brings expertise in strategic communications and content creation across multiple domains.", "llm_model": "claude-sonnet-4-5", "tools": ["FileWriterTool", "FileReadTool"]},
            {"name": "POLI", "role": "Policy & Compliance Advisor", "goal": "Ensure all recommendations comply with regulatory requirements and identify policy risks", "backstory": "POLI is a policy expert with deep knowledge of regulatory frameworks across multiple industries.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "PDFSearchTool", "JSONSearchTool"]},
            {"name": "PEDRO_GOMES", "role": "Operations Manager", "goal": "Translate strategic decisions into operational plans and track execution milestones", "backstory": "PEDRO_GOMES has a proven track record of turning high-level strategies into measurable operational outcomes.", "llm_model": "gpt-4o-mini", "tools": ["FileReadTool", "FileWriterTool", "CSVSearchTool"]},
        ]
    },
    {
        "crew": {"name": "CASSIO Workspace", "description": "Cybersecurity operations center — monitoring, analysis, and incident response", "process_type": "sequential"},
        "agents": [
            {"name": "SNAKE", "role": "Credentials Security Specialist", "goal": "Monitor, audit, and secure credential stores; detect and respond to credential compromise events", "backstory": "SNAKE is a covert security operative specializing in identity and access management, with deep expertise in credential lifecycle management.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "FileReadTool", "JSONSearchTool"]},
            {"name": "GERALT", "role": "Log Analysis Expert", "goal": "Ingest, parse, and correlate security logs to identify anomalies, threats, and attack patterns", "backstory": "GERALT has hunted threats through billions of log lines, with a sixth sense for suspicious patterns that evade automated systems.", "llm_model": "gpt-4o", "tools": ["FileReadTool", "CSVSearchTool", "TXTSearchTool"]},
            {"name": "LINK", "role": "API Health Monitor", "goal": "Continuously monitor API endpoints for availability, performance, and security issues", "backstory": "LINK is the guardian of all API gateways, ensuring uptime, detecting anomalous traffic, and alerting on security incidents.", "llm_model": "gpt-4o-mini", "tools": ["WebsiteSearchTool", "SerperDevTool"]},
            {"name": "SAMUS", "role": "Disaster Recovery Specialist", "goal": "Design, test, and execute disaster recovery procedures to minimize downtime and data loss", "backstory": "SAMUS has led recovery operations across catastrophic scenarios, bringing calm execution and methodical recovery to the most chaotic situations.", "llm_model": "gpt-4o", "tools": ["FileReadTool", "FileWriterTool", "DirectorySearchTool"]},
            {"name": "RATCHET", "role": "CVE Scanner & Vulnerability Analyst", "goal": "Identify, prioritize, and track CVEs affecting the infrastructure; recommend and validate patches", "backstory": "RATCHET is an obsessive vulnerability researcher who leaves no CVE unexamined, with a knack for finding exploitable chains before attackers do.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "WebsiteSearchTool", "JSONSearchTool"]},
            {"name": "KRATOS", "role": "Performance Engineer", "goal": "Identify performance bottlenecks, optimize resource utilization, and ensure SLA compliance", "backstory": "KRATOS brings brute-force analytical power to performance challenges, systematically identifying and eliminating bottlenecks.", "llm_model": "gpt-4o-mini", "tools": ["FileReadTool", "CSVSearchTool", "JSONSearchTool"]},
        ]
    },
    {
        "crew": {"name": "DUDU Workspace", "description": "Ecommerce management and growth operations", "process_type": "sequential"},
        "agents": [
            {"name": "DUDU", "role": "Ecommerce Manager", "goal": "Drive ecommerce growth through data-driven strategies, catalog optimization, and customer experience improvements", "backstory": "DUDU is an ecommerce veteran who has scaled multiple online stores from startup to seven figures, with expertise across product, marketing, and operations.", "llm_model": "gpt-4o", "tools": ["SerperDevTool", "WebsiteSearchTool", "CSVSearchTool", "FileWriterTool"]},
        ]
    },
]


def seed_database():
    db = SessionLocal()
    try:
        # Seed default tools
        for tool_name, tool_desc in DEFAULT_TOOLS:
            if not crud.get_tool_by_name(db, tool_name):
                crud.create_tool(db, schemas.ToolCreate(
                    name=tool_name,
                    description=tool_desc,
                    is_custom=False,
                ))

        # Seed workspaces
        for workspace in SEED_WORKSPACES:
            crew_data = workspace["crew"]
            existing_crew = crud.get_crew_by_name(db, crew_data["name"])
            if existing_crew:
                continue

            # Create crew
            crew = crud.create_crew(db, schemas.CrewCreate(**crew_data))

            # Create agents and assign to crew
            agent_ids = []
            for agent_data in workspace["agents"]:
                agent = crud.create_agent(db, schemas.AgentCreate(**agent_data))
                agent_ids.append(agent.id)

            crud.assign_agents_to_crew(db, crew.id, agent_ids)

    except Exception as e:
        print(f"[Seed] Error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    seed_database()
    yield


app = FastAPI(
    title="CrewAI Platform API",
    description="AI Agents Management Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(dashboard.router)
app.include_router(agents.router)
app.include_router(crews.router)
app.include_router(tasks.router)
app.include_router(tools.router)
app.include_router(runs.router)

# Serve built frontend (if available)
frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
