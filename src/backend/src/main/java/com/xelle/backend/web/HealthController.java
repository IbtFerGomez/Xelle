package com.xelle.backend.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "xelle-backend-spring");
    }

    @GetMapping("/api/health")
    public Map<String, Object> apiHealth() {
        return Map.of("status", "ok", "api", "/api");
    }
}
