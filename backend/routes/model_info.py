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
            f"Age = {AGE_REFERENCE_YEAR} − Year_Birth  "
            f"(fixed reference year {AGE_REFERENCE_YEAR}; not updated to current year)",
            f"Customer_Tenure_Days = ({TENURE_REFERENCE_DATE} − Dt_Customer).days  "
            f"(fixed historical anchor: latest enrolment date in dataset)",
            "Total_Spending = sum of MntWines, MntFruits, MntMeatProducts, "
            "MntFishProducts, MntSweetProducts, MntGoldProds",
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
                "protocol": f"{HOLDOUT_VALIDATION['cv_folds']}-fold cross-validation",
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
            f"Age uses a fixed reference year ({AGE_REFERENCE_YEAR}) matching the training notebook. "
            "A customer entering a birth year in a future calendar year will have a "
            "correspondingly higher Age value than if we used the current year.",
            f"Customer_Tenure_Days uses a fixed historical anchor ({TENURE_REFERENCE_DATE}). "
            "Enrolment dates after this date are rejected by the API. "
            "The model has no concept of customers who joined after the dataset was collected.",
            "PCA captures only 44.95 % of the total variance across 18 features. "
            "55.05 % of the feature space is compressed away before clustering.",
            "Segmentation reflects purchasing and demographic patterns at a fixed historical point. "
            "It does not capture churn, evolving preferences, or seasonal behaviour.",
            "Nearest-centroid prediction: mean held-out agreement is 93.87 % (±1.97 %). "
            "Cluster 0 ↔ Cluster 1 confusion (income axis boundary) accounts for ~77 % "
            "of all prediction disagreements.",
            "No confidence scores are available. The distance_to_centroid field is an "
            "absolute Euclidean distance in PCA space, not a probability.",
        ],
    )
