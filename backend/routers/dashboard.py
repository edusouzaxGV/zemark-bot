from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import crud
import schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    stats = crud.get_dashboard_stats(db)
    recent = []
    for run in stats["recent_runs"]:
        crew_name = run.crew.name if run.crew else None
        recent.append(schemas.RunResponse(
            id=run.id,
            crew_id=run.crew_id,
            status=run.status,
            inputs=run.inputs or {},
            result=run.result,
            error=run.error,
            started_at=run.started_at,
            completed_at=run.completed_at,
            created_at=run.created_at,
            token_usage=run.token_usage or {},
            crew_name=crew_name,
        ))
    return schemas.DashboardStats(
        total_crews=stats["total_crews"],
        total_agents=stats["total_agents"],
        total_tasks=stats["total_tasks"],
        total_runs=stats["total_runs"],
        active_runs=stats["active_runs"],
        completed_runs=stats["completed_runs"],
        failed_runs=stats["failed_runs"],
        success_rate=stats["success_rate"],
        recent_runs=recent,
    )
