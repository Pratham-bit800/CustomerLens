"""routes/customers.py — GET /api/customers and GET /api/customers/{customer_id}"""
import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import pandas as pd

import data_loader as dl
from config import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SCALER_FEATURE_ORDER
from schemas import CustomerRecord, CustomersResponse, CustomerDetailResponse

router = APIRouter()

# Columns available for sorting
_SORTABLE_COLUMNS = {
    "customer_id", "age", "income", "total_spending",
    "recency", "cluster_id", "num_web_visits_month",
    "total_children", "customer_tenure_days",
}


def _row_to_record(row: pd.Series) -> CustomerRecord:
    return CustomerRecord(
        customer_id=int(row["ID"]),
        age=int(row["Age"]),
        year_birth=int(row["Year_Birth"]),
        education=str(row["Education"]),
        marital_status=str(row["Marital_Status"]),
        living_with=str(row["Living_With"]),
        income=round(float(row["Income"]), 2),
        total_children=int(row["Total_Children"]),
        recency=int(row["Recency"]),
        total_spending=round(float(row["Total_Spending"]), 2),
        num_deals_purchases=int(row["NumDealsPurchases"]),
        num_web_purchases=int(row["NumWebPurchases"]),
        num_catalog_purchases=int(row["NumCatalogPurchases"]),
        num_store_purchases=int(row["NumStorePurchases"]),
        num_web_visits_month=int(row["NumWebVisitsMonth"]),
        complain=int(row["Complain"]),
        response=int(row["Response"]),
        customer_tenure_days=int(row["Customer_Tenure_Days"]),
        cluster_id=int(row["cluster_id"]),
        cluster_name=str(row["cluster_name"]),
        pc1=round(float(row["PC1"]), 6),
        pc2=round(float(row["PC2"]), 6),
    )


@router.get("/customers", response_model=CustomersResponse)
def get_customers(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    cluster_id: Optional[int] = Query(
        default=None, ge=0, le=3,
        description="Filter by cluster ID (0–3).",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Filter customers whose ID contains this string.",
    ),
    sort_by: str = Query(
        default="customer_id",
        description=f"Column to sort by. One of: {sorted(_SORTABLE_COLUMNS)}",
    ),
    sort_order: str = Query(
        default="asc",
        description="'asc' or 'desc'",
    ),
):
    if sort_by not in _SORTABLE_COLUMNS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid sort_by '{sort_by}'. Valid values: {sorted(_SORTABLE_COLUMNS)}",
        )
    if sort_order not in ("asc", "desc"):
        raise HTTPException(
            status_code=422,
            detail="sort_order must be 'asc' or 'desc'.",
        )

    df = dl.master_df.copy()

    # ── Filter ────────────────────────────────────────────────────────────────
    if cluster_id is not None:
        df = df[df["cluster_id"] == cluster_id]
    if search:
        df = df[df["ID"].astype(str).str.contains(search.strip(), case=False)]

    # ── Sort ──────────────────────────────────────────────────────────────────
    col_map = {
        "customer_id": "ID", "age": "Age", "income": "Income",
        "total_spending": "Total_Spending", "recency": "Recency",
        "cluster_id": "cluster_id", "num_web_visits_month": "NumWebVisitsMonth",
        "total_children": "Total_Children", "customer_tenure_days": "Customer_Tenure_Days",
    }
    df = df.sort_values(col_map[sort_by], ascending=(sort_order == "asc"))

    # ── Paginate ──────────────────────────────────────────────────────────────
    total       = len(df)
    total_pages = max(1, math.ceil(total / limit))
    page        = min(page, total_pages)
    start       = (page - 1) * limit
    page_df     = df.iloc[start : start + limit]

    customers = [_row_to_record(row) for _, row in page_df.iterrows()]
    return CustomersResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        customers=customers,
    )


@router.get("/customers/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(customer_id: int):
    """Return all attributes for a single customer plus their cluster benchmark."""
    rows = dl.master_df[dl.master_df["ID"] == customer_id]
    if rows.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Customer with ID {customer_id} not found.",
        )
    row = rows.iloc[0]
    cid = int(row["cluster_id"])

    # Cluster benchmark: key feature means for that cluster
    c_means = dl.cluster_means.loc[cid]
    benchmark = {feat: round(float(c_means[feat]), 2) for feat in SCALER_FEATURE_ORDER}

    return CustomerDetailResponse(
        **_row_to_record(row).model_dump(),
        pc3=round(float(row["PC3"]), 6),
        mnt_wines=int(row["MntWines"]),
        mnt_fruits=int(row["MntFruits"]),
        mnt_meat_products=int(row["MntMeatProducts"]),
        mnt_fish_products=int(row["MntFishProducts"]),
        mnt_sweet_products=int(row["MntSweetProducts"]),
        mnt_gold_prods=int(row["MntGoldProds"]),
        cluster_benchmark=benchmark,
    )
