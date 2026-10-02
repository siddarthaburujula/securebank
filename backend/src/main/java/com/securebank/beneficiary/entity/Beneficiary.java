package com.securebank.beneficiary.entity;

import com.securebank.customer.entity.Customer;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiaries", uniqueConstraints = {
    @UniqueConstraint(name = "uk_customer_beneficiary", columnNames = {"customer_id", "account_number", "ifsc_code"})
})
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "beneficiary_name", nullable = false, length = 100)
    private String beneficiaryName;

    @Column(name = "account_number", nullable = false, length = 16)
    private String accountNumber;

    @Column(name = "ifsc_code", nullable = false, length = 16)
    private String ifscCode;

    @Column(name = "bank_name", nullable = false, length = 50)
    private String bankName = "SecureBank";

    @Column(name = "nickname", length = 50)
    private String nickname;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "cooling_off_until")
    private LocalDateTime coolingOffUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Beneficiary() {}

    public Beneficiary(Customer customer, String beneficiaryName, String accountNumber,
                       String ifscCode, String bankName, String nickname, LocalDateTime coolingOffUntil) {
        this.customer = customer;
        this.beneficiaryName = beneficiaryName;
        this.accountNumber = accountNumber;
        this.ifscCode = ifscCode;
        this.bankName = (bankName != null && !bankName.isBlank()) ? bankName : "SecureBank";
        this.nickname = nickname;
        this.coolingOffUntil = coolingOffUntil;
        this.active = true;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isCoolingOffActive() {
        return coolingOffUntil != null && LocalDateTime.now().isBefore(coolingOffUntil);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getBeneficiaryName() { return beneficiaryName; }
    public void setBeneficiaryName(String beneficiaryName) { this.beneficiaryName = beneficiaryName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCoolingOffUntil() { return coolingOffUntil; }
    public void setCoolingOffUntil(LocalDateTime coolingOffUntil) { this.coolingOffUntil = coolingOffUntil; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
