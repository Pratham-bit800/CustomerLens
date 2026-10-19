"""
schemas.py — Pydantic request and response models for the CustomerLens API.

All input ranges are derived from the training dataset statistics.
The validation comments document WHY each constraint exists.
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator
import pandas as pd


# ─────────────────────────── Shared primitives ────────────────────────────────

class ClusterSummary(BaseModel):
    cluster_id:  int
    name:        str
    description: str
    count:       int
    percentage:  float


class FeatureStat(BaseModel):
    feature:         str
    cluster_average: float
    overall_average: float
    difference_pct:  float
    direction:       str   # "Higher" | "Lower"


# ─────────────────────────── /api/health ──────────────────────────────────────

class HealthResponse(BaseModel):
    status:           str
    customers_loaded: int
    artifacts_ready:  bool
    cluster_counts:   Dict[str, int]


# ─────────────────────────── /api/overview ────────────────────────────────────

class OverallAverages(BaseModel):
    income:                float
    total_spending:        float
    recency:               float
    age:                   float
    num_web_visits_month:  float
    total_children:        float


class OverviewResponse(BaseModel):
    total_customers:      int
    total_segments:       int
    raw_feature_count:    int
    processed_feature_count: int
    cluster_distribution: List[ClusterSummary]
    overall_averages:     OverallAverages


# ─────────────────────────── /api/clusters ────────────────────────────────────

class ClusterCentroid(BaseModel):
    pc1: float
    pc2: float
    pc3: float


class PCAPoint(BaseModel):
    customer_id: int
    pc1:         float
    pc2:         float
    cluster_id:  int
    income:      float
    total_spending: float
    education:   str
    living_with: str


class ClusterProfile(BaseModel):
    cluster_id:       int
    name:             str
    description:      str
    count:            int
    percentage:       float
    centroid:         ClusterCentroid
    feature_means:    Dict[str, float]
    significant_diffs: List[FeatureStat]
    recommendations:  List[str]


class ClustersResponse(BaseModel):
    clusters:    List[ClusterProfile]
    pca_points:  List[PCAPoint]


# ─────────────────────────── /api/customers ───────────────────────────────────

class CustomerRecord(BaseModel):
    customer_id:          int
    age:                  int
    year_birth:           int
    education:            str
    marital_status:       str
    living_with:          str
    income:               float
    total_children:       int
    recency:              int
    total_spending:       float
    num_deals_purchases:  int
    num_web_purchases:    int
    num_catalog_purchases: int
    num_store_purchases:  int
    num_web_visits_month: int
    complain:             int
    response:             int
    customer_tenure_days: int
    cluster_id:           int
    cluster_name:         str
    pc1:                  float
    pc2:                  float


class CustomersResponse(BaseModel):
    total:        int
    page:         int
    limit:        int
    total_pages:  int
    customers:    List[CustomerRecord]


class CustomerDetailResponse(CustomerRecord):
    pc3:               float
    mnt_wines:         int
    mnt_fruits:        int
    mnt_meat_products: int
    mnt_fish_products: int
    mnt_sweet_products: int
    mnt_gold_prods:    int
    cluster_benchmark: Dict[str, float]


# ─────────────────────────── /api/predict-segment ─────────────────────────────

class PredictRequest(BaseModel):
    """
    All fields correspond to columns in the original dataset.
    Validation ranges are derived from the training data (processed_features.csv).
    """

    # ── Demographics ──────────────────────────────────────────────────────────
    year_birth: int = Field(
        ...,
        description="Customer year of birth. Must reflect an adult customer (18–100 years old).",
    )
    education: str = Field(
        ...,
        description="One of: Graduation, PhD, Master, 2n Cycle, Basic",
    )
    marital_status: str = Field(
        ...,
        description="One of: Married, Together, Single, Divorced, Widow",
    )
    income: float = Field(
        ...,
        gt=0, le=10_000_000,
        description="Annual household income in USD. Must be positive (inputs > $162,397 are outside historical training distribution and will be flagged).",
    )
    kidhome: int = Field(
        ...,
        ge=0, le=3,
        description="Number of small children at home.",
    )
    teenhome: int = Field(
        ...,
        ge=0, le=3,
        description="Number of teenagers at home.",
    )

    # ── Enrolment date ────────────────────────────────────────────────────────
    dt_customer: str = Field(
        ...,
        description=(
            "Customer enrolment date in YYYY-MM-DD or DD-MM-YYYY format.  "
            "Must be on or before the current observation date."
        ),
    )

    # ── Recency & purchases ───────────────────────────────────────────────────
    recency: int = Field(
        ...,
        ge=0, le=99,
        description="Days since last purchase. Training range: 0–99.",
    )
    mnt_wines:         int = Field(..., ge=0, le=1500)
    mnt_fruits:        int = Field(..., ge=0, le=200)
    mnt_meat_products: int = Field(..., ge=0, le=1725)
    mnt_fish_products: int = Field(..., ge=0, le=259)
    mnt_sweet_products: int = Field(..., ge=0, le=263)
    mnt_gold_prods:    int = Field(..., ge=0, le=362)

    num_deals_purchases:  int = Field(..., ge=0, le=15)
    num_web_purchases:    int = Field(..., ge=0, le=27)
    num_catalog_purchases: int = Field(..., ge=0, le=28)
    num_store_purchases:  int = Field(..., ge=0, le=13)
    num_web_visits_month: int = Field(..., ge=0, le=20)

    # ── Campaign history ──────────────────────────────────────────────────────
    complain: int = Field(..., ge=0, le=1, description="1 if customer complained in past 2 years.")
    response: int = Field(..., ge=0, le=1, description="1 if customer accepted the last campaign.")

    @field_validator("year_birth")
    @classmethod
    def validate_year_birth(cls, v: int) -> int:
        current_year = pd.Timestamp.now().year
        age = current_year - v
        if age < 18:
            raise ValueError(
                f"Customer must be at least 18 years of age (year_birth {v} implies age {age} in {current_year})."
            )
        if age > 100:
            raise ValueError(
                f"Customer year_birth {v} implies age {age} in {current_year}, exceeding the valid human lifespan range (18–100 years)."
            )
        return v

    @field_validator("education")
    @classmethod
    def validate_education(cls, v: str) -> str:
        allowed = {"Graduation", "PhD", "Master", "2n Cycle", "Basic"}
        if v not in allowed:
            raise ValueError(f"education must be one of {sorted(allowed)}. Got: '{v}'")
        return v

    @field_validator("marital_status")
    @classmethod
    def validate_marital_status(cls, v: str) -> str:
        allowed = {"Married", "Together", "Single", "Divorced", "Widow"}
        if v not in allowed:
            raise ValueError(f"marital_status must be one of {sorted(allowed)}. Got: '{v}'")
        return v

    @model_validator(mode="after")
    def validate_tenure_date(self) -> "PredictRequest":
        try:
            dt = pd.to_datetime(self.dt_customer, dayfirst=False)
        except Exception:
            try:
                dt = pd.to_datetime(self.dt_customer, dayfirst=True)
            except Exception:
                raise ValueError(f"dt_customer '{self.dt_customer}' is not a valid date format.")
        
        now = pd.Timestamp.now().normalize()
        if dt > now:
            raise ValueError(
                f"dt_customer '{self.dt_customer}' cannot be in the future (current observation date: "
                f"{now.strftime('%Y-%m-%d')}). Enrolment date must be on or before today."
            )
        return self


class BenchmarkComparison(BaseModel):
    feature:         str
    customer_value:  float
    cluster_average: float
    overall_average: float
    difference_pct:  float   # customer vs cluster average
    direction:       str


class PredictResponse(BaseModel):
    assigned_cluster:     int
    cluster_name:         str
    cluster_description:  str
    pca_coordinates:      ClusterCentroid   # the new customer's PCA coords
    distance_to_centroid: float
    assignment_method:    str
    assignment_caveat:    str
    benchmark_comparison: List[BenchmarkComparison]
    recommendations:      List[str]
    warnings:             List[str] = Field(
        default_factory=list,
        description="Transparent warnings for any inputs outside the historical training distribution.",
    )


# ─────────────────────────── /api/model-info ──────────────────────────────────

class ModelInfoResponse(BaseModel):
    pipeline_steps:          List[str]
    raw_feature_count:       int
    processed_feature_count: int
    pca_components:          int
    pca_explained_variance:  List[float]
    pca_cumulative_variance: float
    algorithms_evaluated:    List[Dict[str, Any]]
    final_algorithm:         str
    final_n_clusters:        int
    final_linkage:           Optional[str]
    silhouette_score:        float
    elbow_optimal_k:         int
    feature_engineering:     List[str]
    encoding_details:        Dict[str, Any]
    scaling_details:         str
    outlier_removal:         Dict[str, Any]
    prediction_method:       Dict[str, Any]
    limitations:             List[str]
