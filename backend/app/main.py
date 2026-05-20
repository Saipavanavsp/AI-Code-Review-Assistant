import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import webhooks, reviews, manual_upload, ai_chat
from app.ws.manager import ConnectionManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Powered Code Review Assistant",
    description="Backend for asynchronous and real-time code reviews",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Manager
manager = ConnectionManager()

# Include Routers
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(manual_upload.router, prefix="/api/v1/manual", tags=["Manual Upload"])
app.include_router(ai_chat.router, prefix="/api/v1/ai", tags=["AI Chat"])

@app.get("/")
async def root():
    return {"message": "AI-Powered Code Review Assistant API is running"}

@app.websocket("/ws/live-review")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle real-time review logic (Face 2)
            logger.info(f"Received data for live review: {data.get('filename')}")
            
            # Use the review engine
            from app.services.llm_service import review_engine
            response = review_engine.evaluate_live(
                data.get("code", ""), 
                data.get("language", "python")
            )
            
            await manager.send_personal_message(response, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
