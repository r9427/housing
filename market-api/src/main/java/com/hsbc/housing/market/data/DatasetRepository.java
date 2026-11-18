package com.hsbc.housing.market.data;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Repository
public class DatasetRepository {
    private List<Property> properties = List.of();

    @PostConstruct
    public void load() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/house_prices.csv");
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) {
                throw new IllegalStateException("Housing dataset is empty");
            }
            List<Property> loaded = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] cells = line.split(",");
                loaded.add(new Property(
                        Integer.parseInt(cells[0].trim()),
                        Double.parseDouble(cells[1].trim()),
                        Integer.parseInt(cells[2].trim()),
                        Double.parseDouble(cells[3].trim()),
                        Integer.parseInt(cells[4].trim()),
                        Double.parseDouble(cells[5].trim()),
                        Double.parseDouble(cells[6].trim()),
                        Double.parseDouble(cells[7].trim()),
                        Double.parseDouble(cells[8].trim())
                ));
            }
            properties = List.copyOf(loaded);
        }
    }

    public List<Property> all() {
        return properties;
    }
}
