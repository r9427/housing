import logging
import time

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.model_service import FEATURES, ModelTrainingError, get_model
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

logger = logging.getLogger(__name__)
_started_at = time.monotonic()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ModelTrainingError)
def model_training_error(_request: Request, exc: ModelTrainingError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})


def _health(response: Response, *, ok: bool) -> HealthResponse:
    if not ok:
        response.status_code = 503
    return HealthResponse(
        status="ok" if ok else "unavailable",
        model_loaded=ok,
        uptime_seconds=round(time.monotonic() - _started_at, 3),
    )


@app.get("/health", response_model=HealthResponse, tags=["operations"])
def health(response: Response) -> HealthResponse:
    try:
        get_model()
    except ModelTrainingError:
        return _health(response, ok=False)
    except Exception:
        logger.exception("Health check failed")
        return _health(response, ok=False)
    return _health(response, ok=True)


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
