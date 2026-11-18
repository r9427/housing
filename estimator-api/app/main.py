import os
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import CompareRequest, CompareResponse, Estimate, EstimateCreate, HousingFeatures
from app.store import EstimateStore

MODEL_URL = os.environ.get("ML_API_URL", "http://localhost:8000").rstrip("/")
FEATURES = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

app = FastAPI(
    title="Property Value Estimator API",
    version="1.0.0",
    description="Accepts property details, calls the housing model, and stores estimate history.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
store = EstimateStore()
_coefficients: dict[str, float] | None = None
_intercept: float | None = None


def _model_terms() -> tuple[dict[str, float], float]:
    global _coefficients, _intercept
    if _coefficients is None or _intercept is None:
        try:
            response = httpx.get(f"{MODEL_URL}/model-info", timeout=10)
            response.raise_for_status()
        except httpx.HTTPError as error:
            raise HTTPException(status_code=503, detail="The pricing model is unavailable.") from error
        body = response.json()
        _coefficients = {name: float(body["coefficients"][name]) for name in FEATURES}
        _intercept = float(body["intercept"])
    return _coefficients, _intercept


def _contributions(features: HousingFeatures) -> tuple[dict[str, float], float]:
    coefficients, intercept = _model_terms()
    values = features.model_dump()
    contributions = {
        name: round(coefficients[name] * float(values[name]), 2)
        for name in FEATURES
    }
    return contributions, intercept


def _predict(features: HousingFeatures) -> float:
    try:
        response = httpx.post(
            f"{MODEL_URL}/predict",
            json=features.model_dump(),
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="The pricing model is unavailable.") from error
    return float(response.json()["predictions"][0]["predicted_price"])


def _to_estimate(row: object) -> Estimate:
    features = HousingFeatures(
        square_footage=row["square_footage"],
        bedrooms=row["bedrooms"],
        bathrooms=row["bathrooms"],
        year_built=row["year_built"],
        lot_size=row["lot_size"],
        distance_to_city_center=row["distance_to_city_center"],
        school_rating=row["school_rating"],
    )
    contributions, intercept = _contributions(features)
    return Estimate(
        id=row["id"],
        created_at=row["created_at"],
        label=row["label"],
        features=features,
        predicted_price=row["predicted_price"],
        contributions=contributions,
        intercept=intercept,
    )


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/estimates", response_model=Estimate, tags=["estimates"])
def create_estimate(payload: EstimateCreate) -> Estimate:
    label = payload.label.strip() if payload.label else None
    features = HousingFeatures(**payload.model_dump(exclude={"label"}))
    price = _predict(features)
    _model_terms()
    created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    estimate_id = store.insert(created_at, label or None, features, price)
    row = store.get_many([estimate_id])[0]
    return _to_estimate(row)


@app.get("/estimates", response_model=list[Estimate], tags=["estimates"])
def list_estimates() -> list[Estimate]:
    return [_to_estimate(row) for row in store.list_all()]


@app.post("/estimates/compare", response_model=CompareResponse, tags=["estimates"])
def compare_estimates(payload: CompareRequest) -> CompareResponse:
    unique_ids = list(dict.fromkeys(payload.ids))
    rows = store.get_many(unique_ids)
    if len(rows) != len(unique_ids):
        raise HTTPException(status_code=404, detail="One or more estimates were not found.")
    by_id = {row["id"]: row for row in rows}
    estimates = [_to_estimate(by_id[estimate_id]) for estimate_id in unique_ids]
    highest = max(estimates, key=lambda item: item.predicted_price)
    lowest = min(estimates, key=lambda item: item.predicted_price)
    return CompareResponse(
        estimates=estimates,
        highest_id=highest.id,
        lowest_id=lowest.id,
        price_spread=round(highest.predicted_price - lowest.predicted_price, 2),
    )
