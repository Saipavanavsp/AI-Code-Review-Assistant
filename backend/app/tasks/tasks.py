import time
import logging
from .celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(name="process_batch_review")
def process_batch_review(repo_url: str, pr_data: dict):
    """
    Processes Face 1 (Batch Review) asynchronously.
    Executes the 10-step evaluation template.
    """
    from app.services.llm_service import review_engine
    from app.db.session import SessionLocal
    from app.db.models import ReviewLog, Repository

    logger.info(f"Starting batch review for {repo_url}")
    
    # 10-step Template Review
    results = review_engine.evaluate_batch(repo_url, [])
    
    # Save to Database
    db = SessionLocal()
    try:
        # Get or create repo
        repo = db.query(Repository).filter(Repository.url == repo_url).first()
        if not repo:
            repo = Repository(name=repo_url.split("/")[-1], url=repo_url)
            db.add(repo)
            db.commit()
            db.refresh(repo)

        # Create log entry
        log = ReviewLog(
            repository_id=repo.id,
            face_type="BATCH",
            file_path="various",
            score=80.0, # Mock score
            findings=results
        )
        db.add(log)
        db.commit()
        logger.info(f"Review results saved to database for {repo_url}")
    except Exception as e:
        logger.error(f"Error saving review to DB: {e}")
        db.rollback()
    finally:
        db.close()
    
    return results
