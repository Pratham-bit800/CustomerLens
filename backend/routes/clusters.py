"""routes/clusters.py — GET /api/clusters and GET /api/clusters/{cluster_id}"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
import data_loader as dl
from config import (
    SEGMENT_NAMES, SEGMENT_DESCRIPTIONS, SEGMENT_RECOMMENDATIONS,
    N_CLUSTERS,
)
from schemas import (
    ClustersResponse, ClusterProfile, ClusterCentroid, PCAPoint,
    FeatureStat,
)

router = APIRouter()

_SIGNIFICANCE_THRESHOLD = 15.0   # % difference to flag as significant


def _build_profile(cid: int, total: int) -> ClusterProfile:
    c_means  = dl.cluster_means.loc[cid]
    o_means  = dl.overall_means
    count    = int((dl.cluster_labels == cid).sum())

    # Significant feature differences
    sig_diffs = []
    for feat in c_means.index:
        c_val = float(c_means[feat])
        o_val = float(o_means[feat])
        if o_val == 0:
            continue
        diff_pct = (c_val - o_val) / abs(o_val) * 100
        if abs(diff_pct) > _SIGNIFICANCE_THRESHOLD:
            sig_diffs.append(FeatureStat(
                feature=feat,
                cluster_average=round(c_val, 4),
                overall_average=round(o_val, 4),
                difference_pct=round(diff_pct, 2),
                direction="Higher" if diff_pct > 0 else "Lower",
            ))

    centroid_coords = dl.nc_classifier.centroids_[cid]
    return ClusterProfile(
        cluster_id=cid,
        name=SEGMENT_NAMES[cid],
        description=SEGMENT_DESCRIPTIONS[cid],
        count=count,
        percentage=round(count / total * 100, 2),
        centroid=ClusterCentroid(
            pc1=round(float(centroid_coords[0]), 6),
            pc2=round(float(centroid_coords[1]), 6),
            pc3=round(float(centroid_coords[2]), 6),
        ),
        feature_means={k: round(float(v), 4) for k, v in c_means.items()},
        significant_diffs=sig_diffs,
        recommendations=SEGMENT_RECOMMENDATIONS[cid],
    )


@router.get("/clusters", response_model=ClustersResponse)
def get_clusters(
    sample_pca_points: Optional[int] = Query(
        default=None, ge=100, le=2500,
        description="If provided, randomly sample this many PCA points for the scatter plot.",
    )
):
    """Return all cluster profiles and PCA scatter-plot coordinates."""
    total = len(dl.master_df)
    profiles = [_build_profile(cid, total) for cid in range(N_CLUSTERS)]

    # PCA points
    df = dl.master_df[["ID", "PC1", "PC2", "cluster_id", "Income", "Total_Spending",
                         "Education", "Living_With"]].copy()
    if sample_pca_points is not None and sample_pca_points < len(df):
        df = df.sample(n=sample_pca_points, random_state=42).reset_index(drop=True)

    pca_points = [
        PCAPoint(
            customer_id=int(row["ID"]),
            pc1=round(float(row["PC1"]), 6),
            pc2=round(float(row["PC2"]), 6),
            cluster_id=int(row["cluster_id"]),
            income=round(float(row["Income"]), 2),
            total_spending=round(float(row["Total_Spending"]), 2),
            education=str(row["Education"]),
            living_with=str(row["Living_With"]),
        )
        for _, row in df.iterrows()
    ]

    return ClustersResponse(clusters=profiles, pca_points=pca_points)


@router.get("/clusters/{cluster_id}", response_model=ClusterProfile)
def get_cluster(cluster_id: int):
    """Return the profile for a single cluster."""
    if cluster_id not in range(N_CLUSTERS):
        raise HTTPException(
            status_code=404,
            detail=f"Cluster {cluster_id} not found. Valid IDs: 0–{N_CLUSTERS - 1}.",
        )
    total = len(dl.master_df)
    return _build_profile(cluster_id, total)
