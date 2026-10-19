"""
api/index.py — Vercel Serverless Function entry point for Customer Lens.

Exposes the FastAPI application to Vercel's Python runtime.
Ensures working directory independence and eager model/data loading
during cold-start initialization.
"""
import sys
from pathlib import Path

# Add project root and backend directory to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import main
import data_loader

# Pre-load data and artifacts during cold-start container initialization
if data_loader.master_df is None:
    data_loader.load_all_data()

# Export ASGI app instance for Vercel
app = main.app
