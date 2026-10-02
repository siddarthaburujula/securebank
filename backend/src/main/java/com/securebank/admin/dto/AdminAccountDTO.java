package com.securebank.admin.dto;

import com.securebank.account.entity.Account;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminAccountDTO {

    private Long id;
    private Long customerId;
    private String accountNumber;
    private String ifscCode;
    private String accountType;
    private BigDecimal balance;
    private String status;
    private String customerName;
    private String username;
    private String email;
    private String phoneNumber;
    private String address;
    private LocalDateTime lastActivityAt;
    private LocalDateTime dormantSince;
    private LocalDateTime createdAt;
    private long daysInactive;
    private String scamRiskLevel;
    private String scamRiskReason;

    public AdminAccountDTO() {}

    public static AdminAccountDTO fromEntity(Account a) {
        AdminAccountDTO dto = new AdminAccountDTO();
        dto.setId(a.getId());
        dto.setAccountNumber(a.getAccountNumber());
        dto.setIfscCode(a.getIfscCode());
        dto.setAccountType(a.getAccountType().name());
        dto.setBalance(a.getBalance());
        dto.setStatus(a.getStatus().name());
        if (a.getCustomer() != null) {
            dto.setCustomerId(a.getCustomer().getId());
            dto.setCustomerName(a.getCustomer().getFullName());
            dto.setEmail(a.getCustomer().getEmail());
            dto.setPhoneNumber(a.getCustomer().getPhoneNumber());
            dto.setAddress(a.getCustomer().getAddress());
            if (a.getCustomer().getUser() != null) {
                dto.setUsername(a.getCustomer().getUser().getUsername());
            }
        }
        dto.setLastActivityAt(a.getLastActivityAt());
        dto.setDormantSince(a.getDormantSince());
        dto.setCreatedAt(a.getCreatedAt());

        // Calculate days inactive & scam risk
        long days = 0;
        if (a.getLastActivityAt() != null) {
            days = java.time.temporal.ChronoUnit.DAYS.between(a.getLastActivityAt(), LocalDateTime.now());
        }
        dto.setDaysInactive(days);

        if (a.getStatus() == com.securebank.account.entity.AccountStatus.DORMANT) {
            if (a.getBalance().compareTo(new BigDecimal("20000.00")) >= 0) {
                dto.setScamRiskLevel("CRITICAL");
                dto.setScamRiskReason("Long dormant with high balance (₹" + a.getBalance() + "). Prime target for takeover scam.");
            } else if (a.getBalance().compareTo(new BigDecimal("5000.00")) >= 0) {
                dto.setScamRiskLevel("HIGH");
                dto.setScamRiskReason("Inactive for " + days + " days. High vulnerability to unauthorized reactivation.");
            } else {
                dto.setScamRiskLevel("MEDIUM");
                dto.setScamRiskReason("Account dormant. Protected by anti-fraud freeze.");
            }
        } else if (days >= 90) {
            dto.setScamRiskLevel("HIGH");
            dto.setScamRiskReason("Inactivity threshold exceeded (" + days + " days). Recommended for Dormancy Lock.");
        } else if (a.getStatus() == com.securebank.account.entity.AccountStatus.FROZEN) {
            dto.setScamRiskLevel("HIGH");
            dto.setScamRiskReason("Account on administrative / AML security hold.");
        } else {
            dto.setScamRiskLevel("LOW");
            dto.setScamRiskReason("Active account with verified recent transactions.");
        }

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public LocalDateTime getDormantSince() { return dormantSince; }
    public void setDormantSince(LocalDateTime dormantSince) { this.dormantSince = dormantSince; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public long getDaysInactive() { return daysInactive; }
    public void setDaysInactive(long daysInactive) { this.daysInactive = daysInactive; }

    public String getScamRiskLevel() { return scamRiskLevel; }
    public void setScamRiskLevel(String scamRiskLevel) { this.scamRiskLevel = scamRiskLevel; }

    public String getScamRiskReason() { return scamRiskReason; }
    public void setScamRiskReason(String scamRiskReason) { this.scamRiskReason = scamRiskReason; }
}
