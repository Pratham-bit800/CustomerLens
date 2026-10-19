"""routes/overview.py — GET /api/overview"""
from fastapi import APIRouter
import pandas as pd
import data_loader as dl
from config import SEGMENT_NAMES, SEGMENT_DESCRIPTIONS
from schemas import OverviewResponse, ClusterSummary, OverallAverages

router = APIRouter()


@router.get("/overview", response_model=OverviewResponse)
def get_overview():
    counts = pd.Series(dl.cluster_labels).value_counts().sort_index()
    total  = len(dl.master_df)

    cluster_distribution = [
        ClusterSummary(
            cluster_id=int(cid),
            name=SEGMENT_NAMES[int(cid)],
            description=SEGMENT_DESCRIPTIONS[int(cid)],
            count=int(counts[cid]),
            percentage=round(float(counts[cid]) / total * 100, 2),
        )
        for cid in sorted(counts.index)
    ]

    om = dl.overall_means
    overall_averages = OverallAverages(
        income=round(float(om["Income"]), 2),
        total_spending=round(float(om["Total_Spending"]), 2),
        recency=round(float(om["Recency"]), 2),
        age=round(float(om["Age"]), 2),
        num_web_visits_month=round(float(om["NumWebVisitsMonth"]), 2),
        total_children=round(float(om["Total_Children"]), 2),
    )

    return OverviewResponse(
        total_customers=total,
        total_segments=4,
        raw_feature_count=22,
        processed_feature_count=18,
        cluster_distribution=cluster_distribution,
        overall_averages=overall_averages,
    )
