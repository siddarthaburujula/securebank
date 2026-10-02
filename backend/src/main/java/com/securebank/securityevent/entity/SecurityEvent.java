package com.securebank.securityevent.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.securebank.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_events", indexes = {
    @Index(name = "idx_security_severity", columnList = "severity"),
    @Index(name = "idx_security_status", columnList = "status")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SecuritySeverity severity = SecuritySeverity.MEDIUM;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SecurityEventStatus status = SecurityEventStatus.OPEN;

    @Column(name = "detected_at", nullable = false, updatable = false)
    private LocalDateTime detectedAt;

    public SecurityEvent() {}

    public SecurityEvent(User user, String eventType, SecuritySeverity severity, String description) {
        this.user = user;
        this.eventType = eventType;
        this.severity = severity;
        this.description = description;
        this.status = SecurityEventStatus.OPEN;
        this.detectedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.detectedAt == null) {
            this.detectedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public SecuritySeverity getSeverity() { return severity; }
    public void setSeverity(SecuritySeverity severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SecurityEventStatus getStatus() { return status; }
    public void setStatus(SecurityEventStatus status) { this.status = status; }

    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }
}
