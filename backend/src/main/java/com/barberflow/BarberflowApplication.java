package com.barberflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@SpringBootApplication
@RestController
public class BarberflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarberflowApplication.class, args);
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "ok", true,
                "status", "UP",
                "timestamp", Instant.now().toString()
        );
    }
}
