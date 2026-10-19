"""
config.py — Centralised configuration for the CustomerLens backend.
All file paths and tuneable constants live here so that nothing is
hard-coded elsewhere in the codebase.
"""
from pathlib import Path

# ── Workspace root (one level up from backend/) ───────────────────────────────
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

# ── Dataset paths ─────────────────────────────────────────────────────────────
DATASETS_DIR            = WORKSPACE_ROOT / "datasets"
RAW_DATASET_PATH        = DATASETS_DIR / "customers_dataset.csv"
PROCESSED_FEATURES_PATH = DATASETS_DIR / "processed_features.csv"
PROCESSED_PCA_PATH      = DATASETS_DIR / "processed_pca.csv"

# ── Model artifact paths ───────────────────────────────────────────────────────
MODEL_DIR    = WORKSPACE_ROOT / "model"
ENCODER_PATH = MODEL_DIR / "encoder.joblib"
SCALER_PATH  = MODEL_DIR / "scaler.joblib"
PCA_PATH     = MODEL_DIR / "pca.joblib"
KMEANS_PATH  = MODEL_DIR / "kmeans_model.joblib"   # loaded for metadata ONLY

# ── Clustering constants ───────────────────────────────────────────────────────
N_CLUSTERS  = 4
AGG_LINKAGE = "ward"

# Ordered feature columns that the scaler expects (must match training order)
SCALER_FEATURE_ORDER = [
    "Income", "Recency", "NumDealsPurchases", "NumWebPurchases",
    "NumCatalogPurchases", "NumStorePurchases", "NumWebVisitsMonth",
    "Complain", "Response", "Age", "Customer_Tenure_Days",
    "Total_Spending", "Total_Children",
    "Education_Graduate", "Education_Postgraduate", "Education_Undergraduate",
    "Living_With_Alone", "Living_With_Partner",
]

# Categorical columns for OHE (must match training order)
CATEGORICAL_COLS = ["Education", "Living_With"]

# ── Feature-engineering constants (MUST match notebook logic) ─────────────────
#
# AGE_REFERENCE_YEAR:
#   The notebook computed Age = 2026 - Year_Birth.  Using the same constant
#   ensures the age values land in the same region of the StandardScaler's
#   fitted distribution.  Do NOT change this to the current calendar year.
AGE_REFERENCE_YEAR = 2026

# TENURE_REFERENCE_DATE:
#   Customer tenure was computed as (max_Dt_Customer - Dt_Customer).days,
#   where max_Dt_Customer is the latest enrolment date in the raw dataset
#   (2014-06-29).  This is a FIXED historical anchor.
#   Limitation: a newly entered customer with Dt_Customer > 2014-06-29 would
#   produce a negative tenure, which the backend catches and rejects.
TENURE_REFERENCE_DATE = "2014-06-29"

# Outlier thresholds used during training (documented for reference only)
OUTLIER_MAX_AGE    = 90        # Age < 90  was kept during training
OUTLIER_MAX_INCOME = 600_000   # Income < 600 000 was kept during training

# ── Segment metadata (derived from cluster profiles) ──────────────────────────
SEGMENT_NAMES = {
    0: "Budget Partner Households",
    1: "Affluent Partner Spenders",
    2: "Constrained Solo Parents",
    3: "High-Response Solo Spenders",
}

SEGMENT_DESCRIPTIONS = {
    0: (
        "The largest segment (40.5 % of customers): partner households with "
        "below-average income (~$39 k) and well below-average total spending "
        "(~$222/yr).  High number of children at home.  Frequent website "
        "visitors but low conversion.  Most price-sensitive group."
    ),
    1: (
        "High-income partner households (23.9 %, avg income ~$73 k) and the "
        "top spenders (~$1 237/yr).  Prefer in-store and catalog channels.  "
        "Fewer children at home.  Strong premium product affinity."
    ),
    2: (
        "Single-person households (19.9 %, avg income ~$37 k) with the lowest "
        "total spending (~$166/yr).  Highest web-visit frequency among all "
        "segments.  High number of children at home.  Most financially "
        "constrained group."
    ),
    3: (
        "Affluent singles (15.8 %, avg income ~$71 k) and the most "
        "campaign-responsive segment (32 % response rate — more than double "
        "the population average).  High spenders (~$1 190/yr) who favour "
        "digital and catalog channels."
    ),
}

SEGMENT_RECOMMENDATIONS = {
    0: [
        "Promote family-value bundles and multi-buy discount packs.",
        "Run deal-driven email/SMS campaigns with clear price anchoring.",
        "Highlight website promotions and flash sales to convert high visit frequency.",
        "Introduce a loyalty rewards programme to improve repeat purchase rates.",
    ],
    1: [
        "Offer VIP concierge and early-access programmes for premium lines.",
        "Invest in in-store experiences (tastings, events) — this cluster shows the "
        "highest store purchase rate.",
        "Use premium catalog mailings and curated subscription boxes.",
        "Cross-sell high-margin categories (wine, meat) via personalised recommendations.",
    ],
    2: [
        "Lead with budget-essentials positioning and everyday low prices.",
        "Offer flexible payment options or instalment plans where feasible.",
        "Deploy targeted web-retargeting ads and clearance alerts — high online activity.",
        "Run family-centric promotions (back-to-school, holiday bundles).",
    ],
    3: [
        "Prioritise for new product launch campaigns — highest marketing response rate.",
        "Use digital-first, omnichannel sequences (email → social → retargeting).",
        "Personalise offers around premium individual experiences (gifts, luxury items).",
        "Enrol in a high-tier loyalty programme with exclusive perks and early access.",
    ],
}

# ── Prediction method validation results ─────────────────────────────────────
# Source: scripts/holdout_validation.py  (5-fold CV on 2 236 customers)
HOLDOUT_VALIDATION = {
    "method": "NearestCentroid in 3D PCA space",
    "cv_folds": 5,
    "mean_agreement_pct": 93.87,
    "std_agreement_pct": 1.97,
    "mean_ARI": 0.8333,
    "per_cluster_accuracy": {
        0: 89.61,   # Cluster 0 borders Cluster 1 in high-income space
        1: 97.00,
        2: 96.17,
        3: 97.17,
    },
    "primary_confusion": "Cluster 0 ↔ Cluster 1 (income axis boundary)",
    "recommendation": "SAFE TO USE — surrogate fidelity 96.29 % (5-fold stability 93.87 % ± 1.97 %)",
}

# ── API server settings ────────────────────────────────────────────────────────
API_HOST     = "0.0.0.0"
API_PORT     = 8000
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Pagination defaults
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE     = 100
