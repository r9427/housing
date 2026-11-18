import csv
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_predict

FEATURES = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]


def dataset_path() -> Path:
    override = os.environ.get("HOUSING_DATA_PATH")
    if override:
        return Path(override)
    here = Path(__file__).resolve()
    candidates = [
        here.parents[2] / "data" / "house_prices.csv",
        here.parents[1] / "data" / "house_prices.csv",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


@dataclass(frozen=True)
class TrainedModel:
    estimator: LinearRegression
    coefficients: dict[str, float]
    intercept: float
    metrics: dict[str, float | int]
    n_samples: int
    trained_at: str
    feature_ranges: dict[str, dict[str, float]]

    def predict(self, rows: list[dict[str, float]]) -> list[float]:
        matrix = np.array([[row[name] for name in FEATURES] for row in rows], dtype=float)
        predictions = self.estimator.predict(matrix)
        return [round(float(value), 2) for value in predictions]


def load_training_frame(path: Path) -> tuple[np.ndarray, np.ndarray]:
    if not path.exists():
        raise FileNotFoundError(f"Training data was not found at {path}")
    features: list[list[float]] = []
    prices: list[float] = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [name for name in FEATURES + ["price"] if reader.fieldnames is None or name not in reader.fieldnames]
        if missing:
            raise ValueError(f"Training data is missing columns: {', '.join(missing)}")
        for row in reader:
            features.append([float(row[name]) for name in FEATURES])
            prices.append(float(row["price"]))
    if len(features) < 5:
        raise ValueError("Training data needs at least 5 rows")
    return np.array(features, dtype=float), np.array(prices, dtype=float)


def train_model(path: Path | None = None) -> TrainedModel:
    source = path or dataset_path()
    features, prices = load_training_frame(source)
    folds = KFold(n_splits=5, shuffle=True, random_state=42)
    cross_validated = cross_val_predict(LinearRegression(), features, prices, cv=folds)
    estimator = LinearRegression()
    estimator.fit(features, prices)
    ranges = {
        name: {
            "min": round(float(features[:, index].min()), 4),
            "max": round(float(features[:, index].max()), 4),
            "mean": round(float(features[:, index].mean()), 4),
        }
        for index, name in enumerate(FEATURES)
    }
    return TrainedModel(
        estimator=estimator,
        coefficients={
            name: round(float(value), 6)
            for name, value in zip(FEATURES, estimator.coef_, strict=True)
        },
        intercept=round(float(estimator.intercept_), 6),
        metrics={
            "r2": round(float(r2_score(prices, cross_validated)), 6),
            "mae": round(float(mean_absolute_error(prices, cross_validated)), 2),
            "rmse": round(float(mean_squared_error(prices, cross_validated) ** 0.5), 2),
            "cv_folds": 5,
        },
        n_samples=int(features.shape[0]),
        trained_at=datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        feature_ranges=ranges,
    )


_model: TrainedModel | None = None


def get_model() -> TrainedModel:
    global _model
    if _model is None:
        _model = train_model()
    return _model
