package com.securebank.securityevent.dto;

import com.securebank.securityevent.entity.SecurityEvent;
import java.time.LocalDateTime;

public class SecurityEventDTO {
    private Long id;
    private String username;
    private String eventType;
    private String severity;
    private String description;
    private String status;
    private LocalDateTime detectedAt;

    public SecurityEventDTO() {}

    public static SecurityEventDTO fromEntity(SecurityEvent se) {
        SecurityEventDTO dto = new SecurityEventDTO();
        dto.setId(se.getId());
        dto.setUsername(se.getUser() != null ? se.getUser().getUsername() : "UNKNOWN / EXTERNAL");
        dto.setEventType(se.getEventType());
        dto.setSeverity(se.getSeverity().name());
        dto.setDescription(se.getDescription());
        dto.setStatus(se.getStatus().name());
        dto.setDetectedAt(se.getDetectedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }
}
