package com.hsbc.housing.market.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("summary", "properties", "stats", "whatIf");
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(300)
                .expireAfterWrite(Duration.ofMinutes(10))
                .recordStats());
        return manager;
    }
}
