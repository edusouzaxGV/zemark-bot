from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: ensures models are registered

from routers import agents, crews, tasks, runs, tools, dashboard

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Agents Management Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(crews.router)
app.include_router(tasks.router)
app.include_router(runs.router)
app.include_router(tools.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "AI Agents Management Platform API", "docs": "/docs"}


@app.on_event("startup")
async def startup():
    """Auto-seed if database is empty."""
    from database import SessionLocal
    import crud
    db = SessionLocal()
    try:
        if db.query(models.Agent).count() == 0:
            from seed import seed
            seed()
    finally:
        db.close()
