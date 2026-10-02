package com.securebank.admin.dto;

import java.math.BigDecimal;

public class ScamShieldStatsDTO {
    private long totalAccounts;
    private long totalDormantAccounts;
    private BigDecimal highRiskDormantFunds;
    private long scamAttemptsBlocked;
    private long activeThreatAlerts;
    private long pendingReactivations;

    public ScamShieldStatsDTO() {
        this.highRiskDormantFunds = BigDecimal.ZERO;
    }

    public long getTotalAccounts() { return totalAccounts; }
    public void setTotalAccounts(long totalAccounts) { this.totalAccounts = totalAccounts; }

    public long getTotalDormantAccounts() { return totalDormantAccounts; }
    public void setTotalDormantAccounts(long totalDormantAccounts) { this.totalDormantAccounts = totalDormantAccounts; }

    public BigDecimal getHighRiskDormantFunds() { return highRiskDormantFunds; }
    public void setHighRiskDormantFunds(BigDecimal highRiskDormantFunds) { this.highRiskDormantFunds = highRiskDormantFunds; }

    public long getScamAttemptsBlocked() { return scamAttemptsBlocked; }
    public void setScamAttemptsBlocked(long scamAttemptsBlocked) { this.scamAttemptsBlocked = scamAttemptsBlocked; }

    public long getActiveThreatAlerts() { return activeThreatAlerts; }
    public void setActiveThreatAlerts(long activeThreatAlerts) { this.activeThreatAlerts = activeThreatAlerts; }

    public long getPendingReactivations() { return pendingReactivations; }
    public void setPendingReactivations(long pendingReactivations) { this.pendingReactivations = pendingReactivations; }
}
