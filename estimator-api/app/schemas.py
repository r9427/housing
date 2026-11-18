from pydantic import BaseModel, ConfigDict, Field


class HousingFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0, le=100_000)
    bedrooms: int = Field(ge=0, le=20)
    bathrooms: float = Field(ge=0, le=20)
    year_built: int = Field(ge=1800, le=2100)
    lot_size: float = Field(gt=0, le=1_000_000)
    distance_to_city_center: float = Field(ge=0, le=100)
    school_rating: float = Field(ge=0, le=10)


class EstimateCreate(HousingFeatures):
    label: str | None = Field(default=None, max_length=80)


class Estimate(BaseModel):
    id: int
    created_at: str
    label: str | None
    features: HousingFeatures
    predicted_price: float
    contributions: dict[str, float]
    intercept: float


class CompareRequest(BaseModel):
    ids: list[int] = Field(min_length=2, max_length=4)


class CompareResponse(BaseModel):
    estimates: list[Estimate]
    highest_id: int
    lowest_id: int
    price_spread: float
