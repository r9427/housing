package com.hsbc.housing.market.web;

import com.github.benmanes.caffeine.cache.stats.CacheStats;
import com.hsbc.housing.market.service.MarketService;
import com.hsbc.housing.market.service.MarketService.PropertyFilter;
import com.hsbc.housing.market.service.MarketService.WhatIfRequest;
import jakarta.validation.Valid;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class MarketController {
    private final MarketService marketService;
    private final CacheManager cacheManager;

    public MarketController(MarketService marketService, CacheManager cacheManager) {
        this.marketService = marketService;
        this.cacheManager = cacheManager;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/market/summary")
    public MarketService.Summary summary() {
        return marketService.summary();
    }

    @GetMapping("/api/market/properties")
    public List<?> properties(
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minSchool,
            @RequestParam(required = false) Double maxDistance,
            @RequestParam(required = false, defaultValue = "id") String sort,
            @RequestParam(required = false, defaultValue = "asc") String dir
    ) {
        return marketService.properties(new PropertyFilter(
                bedrooms, minYear, maxYear, minPrice, maxPrice, minSchool, maxDistance, sort, dir
        ));
    }

    @GetMapping("/api/market/stats")
    public MarketService.StatsResponse stats(@RequestParam(defaultValue = "bedrooms") String groupBy) {
        return marketService.stats(groupBy);
    }

    @PostMapping("/api/market/what-if")
    public MarketService.WhatIfResponse whatIf(@Valid @RequestBody WhatIfRequest request) {
        return marketService.whatIf(request);
    }

    @GetMapping("/api/market/cache")
    public Map<String, Object> cache() {
        List<Map<String, Object>> caches = new ArrayList<>();
        for (String name : cacheManager.getCacheNames()) {
            if (cacheManager.getCache(name) instanceof CaffeineCache caffeineCache) {
                CacheStats stats = caffeineCache.getNativeCache().stats();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", name);
                row.put("hit_count", stats.hitCount());
                row.put("miss_count", stats.missCount());
                caches.add(row);
            }
        }
        return Map.of("caches", caches);
    }
}
