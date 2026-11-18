package com.hsbc.housing.market.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ModelGateway {
    private final RestClient client;

    public ModelGateway(@Value("${model.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    public List<Double> predict(List<FeatureSet> instances) {
        Map<String, Object> body = Map.of(
                "instances",
                instances.stream().map(ModelGateway::toMap).toList()
        );
        try {
            PredictResponse response = client.post()
                    .uri("/predict")
                    .body(body)
                    .retrieve()
                    .body(PredictResponse.class);
            if (response == null || response.predictions() == null) {
                throw new ModelUnavailableException("The pricing model returned an empty response.");
            }
            return response.predictions().stream().map(Prediction::predictedPrice).toList();
        } catch (RestClientException exception) {
            throw new ModelUnavailableException("The pricing model is unavailable.", exception);
        }
    }

    private static Map<String, Object> toMap(FeatureSet features) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("square_footage", features.squareFootage());
        values.put("bedrooms", features.bedrooms());
        values.put("bathrooms", features.bathrooms());
        values.put("year_built", features.yearBuilt());
        values.put("lot_size", features.lotSize());
        values.put("distance_to_city_center", features.distanceToCityCenter());
        values.put("school_rating", features.schoolRating());
        return values;
    }

    public record PredictResponse(List<Prediction> predictions) {
    }

    public record Prediction(@JsonProperty("predicted_price") double predictedPrice) {
    }
}
