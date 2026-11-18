package com.hsbc.housing.market.service;

import com.hsbc.housing.market.data.DatasetRepository;
import com.hsbc.housing.market.data.Property;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MarketService {
    static final Set<String> FEATURES = Set.of(
            "square_footage",
            "bedrooms",
            "bathrooms",
            "year_built",
            "lot_size",
            "distance_to_city_center",
            "school_rating"
    );

    private final DatasetRepository repository;
    private final ModelGateway modelGateway;

    public MarketService(DatasetRepository repository, ModelGateway modelGateway) {
        this.repository = repository;
        this.modelGateway = modelGateway;
    }

    @Cacheable("summary")
    public Summary summary() {
        List<Property> properties = repository.all();
        return new Summary(
                properties.size(),
                range(properties.stream().map(Property::price).toList()),
                new FeatureSet(
                        median(properties.stream().map(Property::squareFootage).toList()),
                        (int) Math.round(median(properties.stream().map(item -> (double) item.bedrooms()).toList())),
                        median(properties.stream().map(Property::bathrooms).toList()),
                        (int) Math.round(median(properties.stream().map(item -> (double) item.yearBuilt()).toList())),
                        median(properties.stream().map(Property::lotSize).toList()),
                        median(properties.stream().map(Property::distanceToCityCenter).toList()),
                        median(properties.stream().map(Property::schoolRating).toList())
                ),
                Map.of(
                        "square_footage", range(properties.stream().map(Property::squareFootage).toList()),
                        "bedrooms", range(properties.stream().map(item -> (double) item.bedrooms()).toList()),
                        "bathrooms", range(properties.stream().map(Property::bathrooms).toList()),
                        "year_built", range(properties.stream().map(item -> (double) item.yearBuilt()).toList()),
                        "lot_size", range(properties.stream().map(Property::lotSize).toList()),
                        "distance_to_city_center", range(properties.stream().map(Property::distanceToCityCenter).toList()),
                        "school_rating", range(properties.stream().map(Property::schoolRating).toList()),
                        "price", range(properties.stream().map(Property::price).toList())
                )
        );
    }

    @Cacheable(value = "properties", key = "#filter.cacheKey()")
    public List<Property> properties(PropertyFilter filter) {
        Comparator<Property> comparator = comparator(filter.sort());
        if ("desc".equalsIgnoreCase(filter.direction())) {
            comparator = comparator.reversed();
        }
        return repository.all().stream()
                .filter(property -> filter.bedrooms() == null || property.bedrooms() == filter.bedrooms())
                .filter(property -> filter.minYear() == null || property.yearBuilt() >= filter.minYear())
                .filter(property -> filter.maxYear() == null || property.yearBuilt() <= filter.maxYear())
                .filter(property -> filter.minPrice() == null || property.price() >= filter.minPrice())
                .filter(property -> filter.maxPrice() == null || property.price() <= filter.maxPrice())
                .filter(property -> filter.minSchool() == null || property.schoolRating() >= filter.minSchool())
                .filter(property -> filter.maxDistance() == null || property.distanceToCityCenter() <= filter.maxDistance())
                .sorted(comparator)
                .toList();
    }

    @Cacheable(value = "stats", key = "#groupBy")
    public StatsResponse stats(String groupBy) {
        Map<String, List<Property>> groups = new LinkedHashMap<>();
        if ("school_band".equals(groupBy)) {
            for (String band : List.of("Under 7", "7 to 8", "8 to 9", "9 and above")) {
                groups.put(band, new ArrayList<>());
            }
        }
        for (Property property : repository.all()) {
            groups.computeIfAbsent(label(groupBy, property), key -> new ArrayList<>()).add(property);
        }
        List<Segment> segments = new ArrayList<>();
        groups.forEach((label, members) -> {
            List<Double> prices = members.stream().map(Property::price).toList();
            if (members.isEmpty()) {
                return;
            }
            segments.add(new Segment(
                    label,
                    members.size(),
                    round(prices.stream().mapToDouble(Double::doubleValue).average().orElse(0)),
                    round(median(prices))
            ));
        });
        if (!"school_band".equals(groupBy)) {
            segments.sort(Comparator.comparing(Segment::label));
        }
        return new StatsResponse(groupBy, segments);
    }

    @Cacheable(value = "whatIf", key = "#request.cacheKey()")
    public WhatIfResponse whatIf(@Valid WhatIfRequest request) {
        if (!FEATURES.contains(request.vary())) {
            throw new IllegalArgumentException("Choose a feature from the pricing model.");
        }
        if (request.start() == request.end()) {
            throw new IllegalArgumentException("The what-if range needs two different values.");
        }
        List<FeatureSet> instances = new ArrayList<>();
        instances.add(request.baseline());
        double step = (request.end() - request.start()) / (request.steps() - 1);
        for (int index = 0; index < request.steps(); index++) {
            instances.add(request.baseline().with(request.vary(), request.start() + step * index));
        }
        List<Double> prices = modelGateway.predict(instances);
        double baselinePrice = prices.getFirst();
        List<WhatIfPoint> points = new ArrayList<>();
        for (int index = 0; index < request.steps(); index++) {
            double price = prices.get(index + 1);
            points.add(new WhatIfPoint(
                    round(request.start() + step * index),
                    round(price),
                    round(price - baselinePrice)
            ));
        }
        return new WhatIfResponse(round(baselinePrice), request.vary(), points);
    }

    private static String label(String groupBy, Property property) {
        return switch (groupBy) {
            case "bedrooms" -> property.bedrooms() + " bedrooms";
            case "decade" -> (property.yearBuilt() / 10) * 10 + "s";
            case "school_band" -> schoolBand(property.schoolRating());
            default -> throw new IllegalArgumentException("Group by bedrooms, decade, or school_band.");
        };
    }

    private static String schoolBand(double rating) {
        if (rating < 7) {
            return "Under 7";
        }
        if (rating < 8) {
            return "7 to 8";
        }
        if (rating < 9) {
            return "8 to 9";
        }
        return "9 and above";
    }

    private static Comparator<Property> comparator(String sort) {
        String key = sort == null || sort.isBlank() ? "id" : sort;
        return switch (key) {
            case "id" -> Comparator.comparingInt(Property::id);
            case "price" -> Comparator.comparingDouble(Property::price);
            case "square_footage" -> Comparator.comparingDouble(Property::squareFootage);
            case "bedrooms" -> Comparator.comparingInt(Property::bedrooms);
            case "bathrooms" -> Comparator.comparingDouble(Property::bathrooms);
            case "year_built" -> Comparator.comparingInt(Property::yearBuilt);
            case "lot_size" -> Comparator.comparingDouble(Property::lotSize);
            case "distance_to_city_center" -> Comparator.comparingDouble(Property::distanceToCityCenter);
            case "school_rating" -> Comparator.comparingDouble(Property::schoolRating);
            default -> throw new IllegalArgumentException("Unknown sort field: " + key);
        };
    }

    private static Range range(List<Double> values) {
        return new Range(
                round(values.stream().mapToDouble(Double::doubleValue).min().orElse(0)),
                round(values.stream().mapToDouble(Double::doubleValue).max().orElse(0)),
                round(values.stream().mapToDouble(Double::doubleValue).average().orElse(0)),
                round(median(values))
        );
    }

    private static double median(List<Double> values) {
        List<Double> sorted = values.stream().sorted().toList();
        int size = sorted.size();
        if (size == 0) {
            return 0;
        }
        if (size % 2 == 1) {
            return sorted.get(size / 2);
        }
        return (sorted.get(size / 2 - 1) + sorted.get(size / 2)) / 2.0;
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record PropertyFilter(
            Integer bedrooms,
            Integer minYear,
            Integer maxYear,
            Double minPrice,
            Double maxPrice,
            Double minSchool,
            Double maxDistance,
            String sort,
            String direction
    ) {
        public String cacheKey() {
            return bedrooms + "|" + minYear + "|" + maxYear + "|" + minPrice + "|" + maxPrice
                    + "|" + minSchool + "|" + maxDistance + "|" + sort + "|" + direction;
        }
    }

    public record Range(double min, double max, double mean, double median) {
    }

    public record Summary(int count, Range price, FeatureSet medians, Map<String, Range> ranges) {
    }

    public record Segment(String label, int count, double averagePrice, double medianPrice) {
    }

    public record StatsResponse(String groupBy, List<Segment> segments) {
    }

    public record WhatIfRequest(
            @Valid @NotNull FeatureSet baseline,
            @NotBlank String vary,
            double start,
            double end,
            @Min(2) @Max(21) int steps
    ) {
        public String cacheKey() {
            return vary + "|" + start + "|" + end + "|" + steps + "|" + baseline;
        }
    }

    public record WhatIfPoint(double value, double predictedPrice, double delta) {
    }

    public record WhatIfResponse(double baselinePrice, String vary, List<WhatIfPoint> points) {
    }
}
