from fastapi import FastAPI
from .logging_config import configure_logging
from .routers.live_classes import router as live_classes_router

configure_logging()

app = FastAPI(title="EdTech Python Service")

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(live_classes_router, prefix="/live-classes", tags=["live-classes"])
