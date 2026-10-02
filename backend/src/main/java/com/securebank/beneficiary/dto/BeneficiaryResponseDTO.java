package com.securebank.beneficiary.dto;

import com.securebank.beneficiary.entity.Beneficiary;
import java.time.LocalDateTime;

public class BeneficiaryResponseDTO {

    private Long id;
    private String beneficiaryName;
    private String accountNumber;
    private String ifscCode;
    private String bankName;
    private String nickname;
    private boolean active;
    private boolean coolingOffActive;
    private LocalDateTime coolingOffUntil;
    private LocalDateTime createdAt;

    public BeneficiaryResponseDTO() {}

    public static BeneficiaryResponseDTO fromEntity(Beneficiary b) {
        BeneficiaryResponseDTO dto = new BeneficiaryResponseDTO();
        dto.setId(b.getId());
        dto.setBeneficiaryName(b.getBeneficiaryName());
        dto.setAccountNumber(b.getAccountNumber());
        dto.setIfscCode(b.getIfscCode());
        dto.setBankName(b.getBankName());
        dto.setNickname(b.getNickname());
        dto.setActive(b.isActive());
        dto.setCoolingOffActive(b.isCoolingOffActive());
        dto.setCoolingOffUntil(b.getCoolingOffUntil());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public boolean isCoolingOffActive() { return coolingOffActive; }
    public void setCoolingOffActive(boolean coolingOffActive) { this.coolingOffActive = coolingOffActive; }

    public LocalDateTime getCoolingOffUntil() { return coolingOffUntil; }
    public void setCoolingOffUntil(LocalDateTime coolingOffUntil) { this.coolingOffUntil = coolingOffUntil; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
