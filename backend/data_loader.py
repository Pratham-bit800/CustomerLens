"""
data_loader.py — Single source of truth for all data loaded at startup.

On import (FastAPI lifespan), this module:
  1. Loads and validates all CSVs and model artifacts.
  2. Reconstructs Agglomerative Clustering labels deterministically on the
     same PCA matrix that was used in the notebook.
  3. Validates that the cluster counts match the expected notebook outputs.
  4. Builds a master merged DataFrame that the API routes query directly.

No model is retrained here.  The cluster labels come from re-running
AgglomerativeClustering(n_clusters=4, linkage="ward") on the fixed PCA
matrix — a deterministic, reproducible operation (verified: identical
across runs).
"""
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from sklearn.neighbors import NearestCentroid

from config import (
    RAW_DATASET_PATH, PROCESSED_FEATURES_PATH, PROCESSED_PCA_PATH,
    ENCODER_PATH, SCALER_PATH, PCA_PATH, KMEANS_PATH,
    N_CLUSTERS, AGG_LINKAGE,
    AGE_REFERENCE_YEAR, TENURE_REFERENCE_DATE,
    SCALER_FEATURE_ORDER,
    SEGMENT_NAMES,
)

log = logging.getLogger(__name__)

# ── Expected cluster counts (from notebook 02, Cell 23) ──────────────────────
_EXPECTED_COUNTS = {0: 905, 1: 534, 2: 444, 3: 353}

# ── Module-level singletons (populated by load_all_data) ──────────────────────
raw_df:          Optional[pd.DataFrame] = None   # cleaned raw data (2 236 rows)
features_df:     Optional[pd.DataFrame] = None   # 18 processed features
pca_df:          Optional[pd.DataFrame] = None   # PC1, PC2, PC3
master_df:       Optional[pd.DataFrame] = None   # merged: all cols + cluster_id

cluster_labels:  Optional[np.ndarray]   = None   # 2 236-length array, values 0-3
cluster_means:   Optional[pd.DataFrame] = None   # per-cluster feature means
overall_means:   Optional[pd.Series]    = None   # population-wide feature means
nc_classifier:   Optional[NearestCentroid] = None  # for new-customer assignment

encoder = None   # fitted OneHotEncoder
scaler  = None   # fitted StandardScaler
pca     = None   # fitted PCA(n_components=3)
kmeans  = None   # loaded for metadata only — NOT used for cluster assignment


def _rebuild_raw_clean() -> pd.DataFrame:
    """
    Apply the same cleaning steps as the notebook to the raw CSV,
    preserving customer ID for downstream joins.
    Returns a DataFrame with exactly the rows that survived outlier removal.
    """
    df = pd.read_csv(RAW_DATASET_PATH)

    # 1. Impute Income with median (training step, matches notebook Cell 9)
    df["Income"] = df["Income"].fillna(df["Income"].median())

    # 2. Feature engineering (matches notebook Cells 11–17)
    df["Age"] = AGE_REFERENCE_YEAR - df["Year_Birth"]

    df["Dt_Customer"] = pd.to_datetime(df["Dt_Customer"], dayfirst=True)
    reference_date = pd.Timestamp(TENURE_REFERENCE_DATE)
    df["Customer_Tenure_Days"] = (reference_date - df["Dt_Customer"]).dt.days

    df["Total_Spending"] = (
        df["MntWines"] + df["MntFruits"] + df["MntMeatProducts"]
        + df["MntFishProducts"] + df["MntSweetProducts"] + df["MntGoldProds"]
    )
    df["Total_Children"] = df["Kidhome"] + df["Teenhome"]

    df["Education"] = df["Education"].replace({
        "Basic": "Undergraduate", "2n Cycle": "Undergraduate",
        "Graduation": "Graduate",
        "Master": "Postgraduate", "PhD": "Postgraduate",
    })
    df["Living_With"] = df["Marital_Status"].replace({
        "Married": "Partner", "Together": "Partner",
        "Single": "Alone", "Divorced": "Alone",
        "Widow": "Alone", "Absurd": "Alone", "YOLO": "Alone",
    })

    # 3. Outlier removal (matches notebook Cell 25)
    before = len(df)
    df = df[df["Age"] < 90].copy()
    df = df[df["Income"] < 600_000].copy()
    after = len(df)
    log.info("Outlier removal: %d -> %d rows (dropped %d)", before, after, before - after)

    # 4. Reset index so row positions align with processed CSVs
    df = df.reset_index(drop=True)
    return df


def load_all_data() -> None:
    """
    Entry point called from FastAPI lifespan.
    Populates all module-level singletons.
    Raises RuntimeError if any artifact is missing or counts mismatch.
    """
    global raw_df, features_df, pca_df, master_df
    global cluster_labels, cluster_means, overall_means, nc_classifier
    global encoder, scaler, pca, kmeans

    # ── 1. Validate artifact files exist ──────────────────────────────────────
    required = {
        "raw dataset":          RAW_DATASET_PATH,
        "processed features":   PROCESSED_FEATURES_PATH,
        "processed PCA":        PROCESSED_PCA_PATH,
        "encoder":              ENCODER_PATH,
        "scaler":               SCALER_PATH,
        "PCA transformer":      PCA_PATH,
        "kmeans (metadata)":    KMEANS_PATH,
    }
    for name, path in required.items():
        if not Path(path).exists():
            raise RuntimeError(f"Required artifact not found: {name} at {path}")

    # ── 2. Load CSVs ──────────────────────────────────────────────────────────
    features_df = pd.read_csv(PROCESSED_FEATURES_PATH)
    pca_df      = pd.read_csv(PROCESSED_PCA_PATH)

    if len(features_df) != len(pca_df):
        raise RuntimeError(
            f"Row count mismatch: features_df={len(features_df)}, "
            f"pca_df={len(pca_df)}.  Datasets are misaligned."
        )
    log.info("Loaded features_df (%d rows) and pca_df (%d rows)", len(features_df), len(pca_df))

    # ── 3. Load model artifacts ────────────────────────────────────────────────
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")   # suppress sklearn version warnings
        encoder = joblib.load(ENCODER_PATH)
        scaler  = joblib.load(SCALER_PATH)
        pca     = joblib.load(PCA_PATH)
        kmeans  = joblib.load(KMEANS_PATH)   # metadata only

    log.info("Loaded encoder, scaler, PCA transformer, and KMeans (metadata).")

    # ── 4. Reconstruct Agglomerative labels deterministically ─────────────────
    X_pca = pca_df.values
    agg = AgglomerativeClustering(n_clusters=N_CLUSTERS, linkage=AGG_LINKAGE)
    cluster_labels = agg.fit_predict(X_pca)
    log.info("Agglomerative clustering complete. Cluster distribution: %s",
             pd.Series(cluster_labels).value_counts().sort_index().to_dict())

    # ── 5. Validate against expected counts ───────────────────────────────────
    counts = pd.Series(cluster_labels).value_counts().sort_index().to_dict()
    mismatches = [
        f"Cluster {cid}: expected {exp}, got {counts.get(cid, 'MISSING')}"
        for cid, exp in _EXPECTED_COUNTS.items()
        if counts.get(cid) != exp
    ]
    if mismatches:
        raise RuntimeError(
            "Cluster count validation FAILED — Agglomerative output does not "
            "match notebook results.  Details: " + "; ".join(mismatches)
        )
    log.info("Cluster count validation PASSED: %s", counts)

    # ── 6. Build NearestCentroid classifier for prediction ────────────────────
    nc_classifier = NearestCentroid()
    nc_classifier.fit(X_pca, cluster_labels)
    log.info("NearestCentroid fitted on full PCA matrix.")

    # ── 7. Compute cluster and overall feature statistics ─────────────────────
    feat_with_labels = features_df.copy()
    feat_with_labels["cluster_id"] = cluster_labels

    cluster_means = (
        feat_with_labels.groupby("cluster_id")[SCALER_FEATURE_ORDER]
        .mean()
        .round(4)
    )
    overall_means = features_df[SCALER_FEATURE_ORDER].mean().round(4)

    # ── 8. Rebuild raw cleaned DF and create master DataFrame ─────────────────
    raw_df = _rebuild_raw_clean()

    # Validate row count consistency
    if len(raw_df) != len(features_df):
        raise RuntimeError(
            f"Reconstructed raw_df has {len(raw_df)} rows but "
            f"features_df has {len(features_df)}.  Row alignment is broken."
        )

    # Verify Income column matches to confirm row ordering is intact
    income_match = (raw_df["Income"].round(2) == features_df["Income"].round(2)).all()
    if not income_match:
        raise RuntimeError(
            "Income column mismatch between raw_df and features_df.  "
            "Row ordering may be incorrect."
        )

    # Attach cluster labels and processed feature columns to raw data
    master_df = raw_df.copy()
    master_df["cluster_id"]   = cluster_labels
    master_df["cluster_name"] = master_df["cluster_id"].map(SEGMENT_NAMES)

    # Add derived columns from processed_features (use processed values for consistency)
    for col in ["Age", "Customer_Tenure_Days", "Total_Spending", "Total_Children"]:
        master_df[col] = features_df[col]

    # Add PCA coordinates for scatter plot
    master_df["PC1"] = pca_df["PC1"]
    master_df["PC2"] = pca_df["PC2"]
    master_df["PC3"] = pca_df["PC3"]

    log.info("master_df built with %d rows and %d columns.", len(master_df), len(master_df.columns))
    log.info("Data loading complete. All validations passed.")


def get_cluster_centroids() -> dict:
    """Return NearestCentroid centroids as a dict keyed by cluster_id."""
    if nc_classifier is None:
        raise RuntimeError("Data not loaded. Call load_all_data() first.")
    return {
        int(i): nc_classifier.centroids_[i].tolist()
        for i in range(N_CLUSTERS)
    }
