from fastapi import APIRouter, Request, BackgroundTasks, Header, HTTPException
import logging
from app.tasks.tasks import process_batch_review

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/github")
async def github_webhook(request: Request, x_github_event: str = Header(None)):
    """
    Endpoint to receive GitHub Webhooks (Face 1).
    Parses PR data and triggers async Celery tasks.
    """
    if x_github_event != "pull_request":
        return {"message": "Ignored event type"}

    payload = await request.json()
    action = payload.get("action")
    
    if action not in ["opened", "synchronize"]:
        return {"message": f"Action {action} ignored"}

    repo_url = payload.get("repository", {}).get("clone_url")
    pr_number = payload.get("number")
    
    logger.info(f"Triggering Face 1 review for PR #{pr_number} in {repo_url}")
    
    # Dispatch task to Celery
    task = process_batch_review.delay(repo_url, payload)
    
    return {
        "status": "success",
        "task_id": task.id,
        "message": "Face 1 Review Pipeline Triggered"
    }
