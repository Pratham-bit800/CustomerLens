"""
main.py — FastAPI application for Customer Lens.

Start with:
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Interactive docs: http://localhost:8000/docs
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import data_loader
from config import API_HOST, API_PORT, CORS_ORIGINS
from routes import overview, clusters, customers, predict, model_info

# ── Logging configuration ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ── Lifespan: load data once at startup, clean up at shutdown ─────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("CustomerLens backend starting - loading data and artifacts ...")
    data_loader.load_all_data()
    log.info("Startup complete.  Customers loaded: %d", len(data_loader.master_df))
    yield
    log.info("CustomerLens backend shutting down.")


# ── Application ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Customer Lens API",
    description=(
        "Backend for the Customer Lens Customer Intelligence Platform.  "
        "Provides cluster profiles, customer exploration, and segment prediction "
        "based on Agglomerative Clustering (k=4, Ward linkage) applied to a "
        "marketing analytics dataset."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Health check ───────────────────────────────────────────────────────────────
from fastapi.responses import JSONResponse
import pandas as pd

@app.get("/api/health", tags=["Health"])
def health_check():
    """Quick sanity check — verifies data and artifacts are loaded."""
    if data_loader.master_df is None:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "detail": "Data not loaded."},
        )
    counts = pd.Series(data_loader.cluster_labels).value_counts().sort_index()
    return {
        "status": "healthy",
        "customers_loaded": len(data_loader.master_df),
        "artifacts_ready": True,
        "cluster_counts": {str(k): int(v) for k, v in counts.items()},
    }


# ── API routes ─────────────────────────────────────────────────────────────────
app.include_router(overview.router,    prefix="/api", tags=["Overview"])
app.include_router(clusters.router,    prefix="/api", tags=["Clusters"])
app.include_router(customers.router,   prefix="/api", tags=["Customers"])
app.include_router(predict.router,     prefix="/api", tags=["Prediction"])
app.include_router(model_info.router,  prefix="/api", tags=["Model Info"])


# ── Development entry point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
