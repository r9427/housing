from pydantic import BaseModel, ConfigDict, Field


class HousingFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0, le=100_000, examples=[1550])
    bedrooms: int = Field(ge=0, le=20, examples=[3])
    bathrooms: float = Field(ge=0, le=20, examples=[2])
    year_built: int = Field(ge=1800, le=2100, examples=[1997])
    lot_size: float = Field(gt=0, le=1_000_000, examples=[6800])
    distance_to_city_center: float = Field(ge=0, le=100, examples=[4.1])
    school_rating: float = Field(ge=0, le=10, examples=[7.6])


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    instances: list[HousingFeatures] = Field(min_length=1, max_length=500)


class Prediction(BaseModel):
    predicted_price: float
    features: HousingFeatures


class PredictResponse(BaseModel):
    count: int
    predictions: list[Prediction]


class FeatureRange(BaseModel):
    min: float
    max: float
    mean: float


class Metrics(BaseModel):
    r2: float
    mae: float
    rmse: float
    cv_folds: int


class ModelInfo(BaseModel):
    model_type: str
    features: list[str]
    coefficients: dict[str, float]
    intercept: float
    metrics: Metrics
    n_samples: int
    trained_at: str
    feature_ranges: dict[str, FeatureRange]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
