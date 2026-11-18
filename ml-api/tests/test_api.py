import csv
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ROOT = Path(__file__).resolve().parents[2]
SAMPLE = {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
}


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_loaded"] is True


def test_model_info_reports_cross_validated_metrics() -> None:
    response = client.get("/model-info")
    assert response.status_code == 200
    body = response.json()
    assert body["model_type"] == "LinearRegression"
    assert body["n_samples"] == 50
    assert body["metrics"]["cv_folds"] == 5
    assert body["metrics"]["r2"] > 0.9
    assert set(body["coefficients"]) == set(body["features"])
    assert "id" not in body["features"]


def test_single_prediction() -> None:
    response = client.post("/predict", json=SAMPLE)
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["predictions"][0]["predicted_price"] > 0


def test_batch_prediction_uses_the_prediction_file() -> None:
    with (ROOT / "data" / "prediction_samples.csv").open(newline="", encoding="utf-8-sig") as handle:
        instances = [{key: float(value) if key != "bedrooms" else int(float(value)) for key, value in row.items()} for row in csv.DictReader(handle)]
    instances = [
        {
            "square_footage": float(row["square_footage"]),
            "bedrooms": int(float(row["bedrooms"])),
            "bathrooms": float(row["bathrooms"]),
            "year_built": int(float(row["year_built"])),
            "lot_size": float(row["lot_size"]),
            "distance_to_city_center": float(row["distance_to_city_center"]),
            "school_rating": float(row["school_rating"]),
        }
        for row in instances
    ]
    response = client.post("/predict", json={"instances": instances})
    assert response.status_code == 200
    assert response.json()["count"] == 10


def test_invalid_property_is_rejected() -> None:
    response = client.post("/predict", json={**SAMPLE, "school_rating": 12})
    assert response.status_code == 422
