"""
predictor.py — New-customer segment assignment pipeline.

Pipeline (matches the training notebook exactly):
  1. Feature engineering: Age, Customer_Tenure_Days, Total_Spending, Total_Children,
     Education (simplified), Living_With (simplified).
  2. One-hot encode Education and Living_With using the FITTED encoder.
  3. Arrange the 18 features in SCALER_FEATURE_ORDER.
  4. Scale with the FITTED StandardScaler.
  5. Project to 3D PCA with the FITTED PCA transformer.
  6. Assign to the nearest Agglomerative centroid in PCA space.

Nothing is re-fitted here.  The encoder, scaler, and PCA are loaded
once at startup and called in transform-only mode.
"""
import logging
from typing import Tuple, List, Dict, Any

import numpy as np
import pandas as pd

from config import (
    AGE_REFERENCE_YEAR,
    TENURE_REFERENCE_DATE,
    SCALER_FEATURE_ORDER,
    SEGMENT_NAMES,
    SEGMENT_DESCRIPTIONS,
    SEGMENT_RECOMMENDATIONS,
    HOLDOUT_VALIDATION,
    N_CLUSTERS,
)
from schemas import PredictRequest, PredictResponse, BenchmarkComparison, ClusterCentroid

log = logging.getLogger(__name__)

# Features shown in the benchmark comparison (subset of SCALER_FEATURE_ORDER)
_BENCHMARK_FEATURES = [
    "Income", "Total_Spending", "Recency", "NumWebPurchases",
    "NumCatalogPurchases", "NumStorePurchases", "NumWebVisitsMonth",
    "Total_Children",
]


def _engineer_features(req: PredictRequest) -> pd.DataFrame:
    """
    Convert a PredictRequest into a single-row DataFrame of raw features,
    then apply the exact same transformations as the notebook.
    Returns a DataFrame with columns matching SCALER_FEATURE_ORDER.
    """
    # ── Age (matches notebook: AGE_REFERENCE_YEAR - Year_Birth) ──────────────
    age = AGE_REFERENCE_YEAR - req.year_birth

    # ── Customer tenure (matches notebook: reference_date - Dt_Customer) ──────
    # Date parsing: try ISO first, then day-first
    try:
        dt = pd.to_datetime(req.dt_customer, dayfirst=False)
    except Exception:
        dt = pd.to_datetime(req.dt_customer, dayfirst=True)
    reference_date = pd.Timestamp(TENURE_REFERENCE_DATE)
    tenure_days = int((reference_date - dt).days)

    # ── Total Spending ─────────────────────────────────────────────────────────
    total_spending = (
        req.mnt_wines + req.mnt_fruits + req.mnt_meat_products
        + req.mnt_fish_products + req.mnt_sweet_products + req.mnt_gold_prods
    )

    # ── Total Children ─────────────────────────────────────────────────────────
    total_children = req.kidhome + req.teenhome

    # ── Education simplification (matches notebook Cell 16) ───────────────────
    ed_map = {
        "Basic": "Undergraduate", "2n Cycle": "Undergraduate",
        "Graduation": "Graduate",
        "Master": "Postgraduate", "PhD": "Postgraduate",
    }
    education_simple = ed_map[req.education]

    # ── Marital Status → Living_With (matches notebook Cell 17) ───────────────
    lw_map = {
        "Married": "Partner", "Together": "Partner",
        "Single": "Alone", "Divorced": "Alone", "Widow": "Alone",
    }
    living_with = lw_map[req.marital_status]

    # ── Build numeric (non-encoded) row ───────────────────────────────────────
    numeric_row = {
        "Income":               float(req.income),
        "Recency":              req.recency,
        "NumDealsPurchases":    req.num_deals_purchases,
        "NumWebPurchases":      req.num_web_purchases,
        "NumCatalogPurchases":  req.num_catalog_purchases,
        "NumStorePurchases":    req.num_store_purchases,
        "NumWebVisitsMonth":    req.num_web_visits_month,
        "Complain":             req.complain,
        "Response":             req.response,
        "Age":                  age,
        "Customer_Tenure_Days": tenure_days,
        "Total_Spending":       float(total_spending),
        "Total_Children":       total_children,
    }

    return numeric_row, education_simple, living_with


def predict_segment(req: PredictRequest) -> PredictResponse:
    """
    Run the full pipeline for a single new customer and return the
    assigned cluster with benchmark comparisons.

    Uses module-level singletons from data_loader:
        encoder, scaler, pca, nc_classifier, cluster_means, overall_means
    """
    import data_loader as dl   # import here to avoid circular at module load

    if dl.nc_classifier is None:
        raise RuntimeError("Data not loaded.  Call load_all_data() first.")

    # ── 1. Feature engineering ────────────────────────────────────────────────
    numeric_row, education_simple, living_with = _engineer_features(req)

    # ── 2. One-hot encode categorical features ────────────────────────────────
    cat_df = pd.DataFrame([[education_simple, living_with]],
                           columns=["Education", "Living_With"])
    enc_array = dl.encoder.transform(cat_df).toarray()
    ohe_cols  = dl.encoder.get_feature_names_out(["Education", "Living_With"])
    ohe_dict  = dict(zip(ohe_cols, enc_array[0]))

    # ── 3. Assemble full feature row in SCALER_FEATURE_ORDER ─────────────────
    combined = {**numeric_row, **ohe_dict}
    feature_row = pd.DataFrame([[combined[c] for c in SCALER_FEATURE_ORDER]],
                                columns=SCALER_FEATURE_ORDER)

    # ── 4. Scale ──────────────────────────────────────────────────────────────
    X_scaled = dl.scaler.transform(feature_row)

    # ── 5. PCA projection ─────────────────────────────────────────────────────
    X_pca = dl.pca.transform(X_scaled)     # shape (1, 3)
    pc1, pc2, pc3 = float(X_pca[0, 0]), float(X_pca[0, 1]), float(X_pca[0, 2])

    # ── 6. Nearest-centroid assignment ────────────────────────────────────────
    cluster_id = int(dl.nc_classifier.predict(X_pca)[0])

    # Distance to assigned centroid
    centroid = dl.nc_classifier.centroids_[cluster_id]
    distance = float(np.linalg.norm(X_pca[0] - centroid))

    # ── 7. Build benchmark comparison ─────────────────────────────────────────
    c_means  = dl.cluster_means.loc[cluster_id]
    o_means  = dl.overall_means
    benchmark: List[BenchmarkComparison] = []

    # Map request fields to SCALER_FEATURE_ORDER names
    customer_values = {
        "Income":               numeric_row["Income"],
        "Total_Spending":       numeric_row["Total_Spending"],
        "Recency":              numeric_row["Recency"],
        "NumWebPurchases":      numeric_row["NumWebPurchases"],
        "NumCatalogPurchases":  numeric_row["NumCatalogPurchases"],
        "NumStorePurchases":    numeric_row["NumStorePurchases"],
        "NumWebVisitsMonth":    numeric_row["NumWebVisitsMonth"],
        "Total_Children":       numeric_row["Total_Children"],
    }

    for feat in _BENCHMARK_FEATURES:
        cust_val   = customer_values[feat]
        clust_avg  = float(c_means[feat])
        overall_avg = float(o_means[feat])
        if clust_avg == 0:
            diff_pct = 0.0
        else:
            diff_pct = round(((cust_val - clust_avg) / abs(clust_avg)) * 100, 2)
        direction = "Higher" if diff_pct > 0 else ("Lower" if diff_pct < 0 else "Equal")
        benchmark.append(BenchmarkComparison(
            feature=feat,
            customer_value=round(cust_val, 2),
            cluster_average=round(clust_avg, 2),
            overall_average=round(overall_avg, 2),
            difference_pct=diff_pct,
            direction=direction,
        ))

    caveat = (
        f"Assigned via NearestCentroid surrogate in 3D PCA space.  "
        f"Surrogate agreement with reference Agglomerative cluster labels is 96.29 % on the dataset "
        f"(ARI = 0.8947; 5-fold CV subset stability = {HOLDOUT_VALIDATION['mean_agreement_pct']} % ± {HOLDOUT_VALIDATION['std_agreement_pct']} %).  "
        f"Note: Distance is Euclidean in PCA space, not a calibrated probability.  "
        f"Disagreements concentrate at the Cluster 0 <-> 1 continuous income boundary."
    )

    return PredictResponse(
        assigned_cluster=cluster_id,
        cluster_name=SEGMENT_NAMES[cluster_id],
        cluster_description=SEGMENT_DESCRIPTIONS[cluster_id],
        pca_coordinates=ClusterCentroid(pc1=pc1, pc2=pc2, pc3=pc3),
        distance_to_centroid=round(distance, 4),
        assignment_method="NearestCentroid in 3D PCA space (Agglomerative centroid-based)",
        assignment_caveat=caveat,
        benchmark_comparison=benchmark,
        recommendations=SEGMENT_RECOMMENDATIONS[cluster_id],
    )
