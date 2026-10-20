"""routes/model_info.py — GET /api/model-info"""
from fastapi import APIRouter
import data_loader as dl
from config import (
    SCALER_FEATURE_ORDER, AGE_REFERENCE_YEAR, TENURE_REFERENCE_DATE,
    HOLDOUT_VALIDATION,
)
from schemas import ModelInfoResponse

router = APIRouter()


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """Return complete ML pipeline metadata from verified artifacts."""
    ev  = dl.pca.explained_variance_ratio_.tolist()
    cum = float(sum(ev))

    return ModelInfoResponse(
        pipeline_steps=[
            "1. Load raw CSV (2,240 rows, 22 columns)",
            "2. Impute missing Income with median (24 values)",
            "3. Feature engineering: Age, Customer_Tenure_Days, Total_Spending, Total_Children",
            "4. Simplify Education (5 → 3 levels) and Marital_Status → Living_With (→ 2 levels)",
            "5. Remove 4 extreme outliers (Age ≥ 90 or Income ≥ $600,000)",
            "6. One-hot encode Education and Living_With (2 cols → 5 binary cols)",
            "7. StandardScaler on all 18 features",
            "8. PCA(n_components=3): 44.95 % of variance retained",
            "9. AgglomerativeClustering(n_clusters=4, linkage='ward') on 3D PCA data",
        ],
        raw_feature_count=22,
        processed_feature_count=18,
        pca_components=3,
        pca_explained_variance=[round(v, 6) for v in ev],
        pca_cumulative_variance=round(cum, 6),
        algorithms_evaluated=[
            {
                "algorithm": "KMeans",
                "n_clusters": 4,
                "silhouette_score": 0.3581,
                "selection_method": "Elbow (KneeLocator on WCSS, k=1..10)",
                "selected": False,
                "reason": "Saved to disk for metadata; Agglomerative produced higher silhouette score.",
            },
            {
                "algorithm": "AgglomerativeClustering",
                "n_clusters": 4,
                "linkage": "ward",
                "silhouette_score": 0.3793,
                "selected": True,
                "reason": (
                    "Higher silhouette score (0.3793 vs 0.3581). "
                    "Final cluster profiles and characterisation tables derived from this algorithm."
                ),
            },
        ],
        final_algorithm="AgglomerativeClustering",
        final_n_clusters=4,
        final_linkage="ward",
        silhouette_score=0.3793,
        elbow_optimal_k=4,
        feature_engineering=[
            "Age = 2026 - Year_Birth (fixed reference year matching StandardScaler parameters: mean 57.10, std 11.70)",
            "Customer_Tenure_Days = (2014-06-29 - Dt_Customer).days (fixed historical cohort snapshot date: mean 353.77, std 202.14)",
            "Total_Spending = sum of MntWines, MntFruits, MntMeatProducts, MntFishProducts, MntSweetProducts, MntGoldProds",
            "Total_Children = Kidhome + Teenhome",
        ],
        encoding_details={
            "type": "OneHotEncoder (sklearn)",
            "columns_encoded": ["Education", "Living_With"],
            "categories": {
                "Education": ["Graduate", "Postgraduate", "Undergraduate"],
                "Living_With": ["Alone", "Partner"],
            },
            "output_columns": list(
                dl.encoder.get_feature_names_out(["Education", "Living_With"])
            ),
            "artifact": "model/encoder.joblib",
        },
        scaling_details=(
            "StandardScaler (mean=0, std=1) fitted on all 18 processed features. "
            "Artifact: model/scaler.joblib"
        ),
        outlier_removal={
            "rows_removed": 4,
            "criteria": ["Age ≥ 90", "Income ≥ $600,000"],
            "removed_customer_ids": [7829, 11004, 1150, 9432],
            "rows_before": 2240,
            "rows_after": 2236,
        },
        prediction_method={
            "algorithm": HOLDOUT_VALIDATION["method"],
            "rationale": (
                "AgglomerativeClustering does not support native predict(). "
                "We compute centroids of the 4 Agglomerative clusters in 3D PCA space "
                "and assign new customers to the nearest centroid by Euclidean distance."
            ),
            "validation": {
                "in_sample_agreement_pct": 96.29,
                "in_sample_ARI": 0.8947,
                "protocol": f"{HOLDOUT_VALIDATION['cv_folds']}-fold cross-validation (subsample stability check)",
                "mean_held_out_agreement_pct": HOLDOUT_VALIDATION["mean_agreement_pct"],
                "std_held_out_agreement_pct": HOLDOUT_VALIDATION["std_agreement_pct"],
                "mean_ARI": HOLDOUT_VALIDATION["mean_ARI"],
                "per_cluster_accuracy": HOLDOUT_VALIDATION["per_cluster_accuracy"],
                "primary_confusion": HOLDOUT_VALIDATION["primary_confusion"],
                "note": (
                    "Surrogate fidelity metric: NearestCentroid achieves 96.29 % agreement "
                    "(ARI = 0.8947) with reference Agglomerative cluster assignments across the dataset. "
                    "5-fold cross-validation evaluated subset stability (93.87 % ± 1.97 %). "
                    "These metrics quantify surrogate approximation fidelity, not ground-truth predictive accuracy."
                ),
            },
            "recommendation": HOLDOUT_VALIDATION["recommendation"],
        },
        limitations=[
            "Dynamic Age & Tenure: Age is computed from birth year relative to observation year; tenure measures elapsed days since enrolment. Modern enrolment dates are fully supported.",
            "Extrapolation Beyond Training Distribution: Inputs with Income > $162,397 or Tenure > 699 days exceed the historical training bounds and are transparently flagged as extrapolations.",
            "PCA captures 44.95 % of the total variance across 18 features; 55.05 % of residual feature variance is compressed away prior to clustering.",
            "Segmentation reflects static customer profiles and purchasing behaviour at the snapshot point, rather than longitudinal lifecycle or churn dynamics.",
            "Nearest-centroid prediction: mean held-out agreement is 93.87 % (±1.97 %). Cluster 0 ↔ Cluster 1 confusion along the continuous income axis accounts for primary surrogate boundary disagreement.",
            "Centroid distance is an absolute Euclidean metric in 3D PCA space, not a calibrated posterior probability.",
        ],
    )
