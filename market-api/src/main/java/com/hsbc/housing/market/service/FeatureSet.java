package com.hsbc.housing.market.service;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record FeatureSet(
        @DecimalMin("0.01") @DecimalMax("100000") double squareFootage,
        @Min(0) @Max(20) int bedrooms,
        @DecimalMin("0") @DecimalMax("20") double bathrooms,
        @Min(1800) @Max(2100) int yearBuilt,
        @DecimalMin("0.01") @DecimalMax("1000000") double lotSize,
        @DecimalMin("0") @DecimalMax("100") double distanceToCityCenter,
        @DecimalMin("0") @DecimalMax("10") double schoolRating
) {
    public FeatureSet with(String feature, double value) {
        return switch (feature) {
            case "square_footage" -> new FeatureSet(value, bedrooms, bathrooms, yearBuilt, lotSize, distanceToCityCenter, schoolRating);
            case "bedrooms" -> new FeatureSet(squareFootage, (int) Math.round(value), bathrooms, yearBuilt, lotSize, distanceToCityCenter, schoolRating);
            case "bathrooms" -> new FeatureSet(squareFootage, bedrooms, value, yearBuilt, lotSize, distanceToCityCenter, schoolRating);
            case "year_built" -> new FeatureSet(squareFootage, bedrooms, bathrooms, (int) Math.round(value), lotSize, distanceToCityCenter, schoolRating);
            case "lot_size" -> new FeatureSet(squareFootage, bedrooms, bathrooms, yearBuilt, value, distanceToCityCenter, schoolRating);
            case "distance_to_city_center" -> new FeatureSet(squareFootage, bedrooms, bathrooms, yearBuilt, lotSize, value, schoolRating);
            case "school_rating" -> new FeatureSet(squareFootage, bedrooms, bathrooms, yearBuilt, lotSize, distanceToCityCenter, value);
            default -> throw new IllegalArgumentException("Unknown feature: " + feature);
        };
    }
}
