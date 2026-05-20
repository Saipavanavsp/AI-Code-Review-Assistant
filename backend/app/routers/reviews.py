from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LiveReviewInput(BaseModel):
    code: str
    language: str
    filename: str

@router.post("/trigger-manual")
async def trigger_manual_review(data: LiveReviewInput):
    # This could also trigger a Celery task or return immediate results
    return {"message": "Manual review triggered", "status": "processing"}

@router.get("/stats")
async def get_team_stats():
    # Mock data for engineering dashboard
    return {
        "average_score": 78.5,
        "total_defects": 124,
        "security_hotspots": 12,
        "history": [
            {"date": "2024-05-01", "score": 75},
            {"date": "2024-05-05", "score": 82},
            {"date": "2024-05-10", "score": 79},
        ]
    }
