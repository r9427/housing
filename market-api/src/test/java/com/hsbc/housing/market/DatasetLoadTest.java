package com.hsbc.housing.market;

import com.hsbc.housing.market.data.DatasetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class DatasetLoadTest {
    @Autowired
    private DatasetRepository repository;

    @Test
    void loadsTheHousingDataset() {
        assertEquals(50, repository.all().size());
    }
}
