"""routes/predict.py — POST /api/predict-segment"""
from fastapi import APIRouter, HTTPException
from schemas import PredictRequest, PredictResponse
from predictor import predict_segment

router = APIRouter()


@router.post("/predict-segment", response_model=PredictResponse)
def post_predict_segment(req: PredictRequest):
    """
    Assign a new customer to an existing segment using the
    NearestCentroid method in 3D PCA space.

    The pipeline applied to each request is:
      1. Feature engineering (Age, Tenure, Total_Spending, Total_Children,
         Education simplification, Living_With derivation).
      2. One-hot encoding via the fitted encoder.joblib.
      3. StandardScaler transform via the fitted scaler.joblib.
      4. PCA transform via the fitted pca.joblib (3 components).
      5. Nearest-centroid assignment to Agglomerative cluster centroid.

    See the assignment_caveat field in the response for held-out accuracy.
    """
    try:
        return predict_segment(req)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        )
