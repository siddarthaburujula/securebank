package com.securebank.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public HealthCheckController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> getHealth() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("application", "SecureBank Online Banking System");
        healthData.put("version", "1.0.0");
        healthData.put("tagline", "Secure Transactions. Smarter Banking. A Better Tomorrow.");

        try {
            Integer accountCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM accounts", Integer.class);
            healthData.put("database", "CONNECTED");
            healthData.put("accountsInDatabase", accountCount);
            return ApiResponse.success("SecureBank backend and MySQL database are healthy and online", healthData);
        } catch (Exception ex) {
            healthData.put("database", "DISCONNECTED: " + ex.getMessage());
            return ApiResponse.error("Database connection failure", healthData);
        }
    }
}
