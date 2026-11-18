from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.model_service import FEATURES, get_model
from app.schemas import (
    FeatureRange,
    HealthResponse,
    HousingFeatures,
    Metrics,
    ModelInfo,
    PredictRequest,
    PredictResponse,
    Prediction,
)

app = FastAPI(
    title="Housing Price Model API",
    version="1.0.0",
    description=(
        "Linear regression service that predicts housing prices. "
        "POST /predict accepts either one property object or a batch under instances."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["operations"])
def health() -> HealthResponse:
    get_model()
    return HealthResponse(status="ok", model_loaded=True)


@app.get("/model-info", response_model=ModelInfo, tags=["model"])
def model_info() -> ModelInfo:
    trained = get_model()
    return ModelInfo(
        model_type="LinearRegression",
        features=list(FEATURES),
        coefficients=trained.coefficients,
        intercept=trained.intercept,
        metrics=Metrics(
            r2=float(trained.metrics["r2"]),
            mae=float(trained.metrics["mae"]),
            rmse=float(trained.metrics["rmse"]),
            cv_folds=int(trained.metrics["cv_folds"]),
        ),
        n_samples=trained.n_samples,
        trained_at=trained.trained_at,
        feature_ranges={name: FeatureRange(**values) for name, values in trained.feature_ranges.items()},
    )


@app.post("/predict", response_model=PredictResponse, tags=["prediction"])
def predict(payload: PredictRequest | HousingFeatures) -> PredictResponse:
    rows = payload.instances if isinstance(payload, PredictRequest) else [payload]
    trained = get_model()
    prices = trained.predict([row.model_dump() for row in rows])
    predictions = [
        Prediction(predicted_price=price, features=row)
        for price, row in zip(prices, rows, strict=True)
    ]
    return PredictResponse(count=len(predictions), predictions=predictions)
