package com.securebank.billpayment.dto;

import com.securebank.billpayment.entity.BillPayment;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BillPaymentResponseDTO {

    private Long id;
    private String referenceNumber;
    private String billCategory;
    private String billerName;
    private String consumerNumber;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String status;
    private LocalDateTime paidAt;

    public BillPaymentResponseDTO() {}

    public static BillPaymentResponseDTO fromEntity(BillPayment bp, BigDecimal balanceAfter) {
        BillPaymentResponseDTO dto = new BillPaymentResponseDTO();
        dto.setId(bp.getId());
        dto.setReferenceNumber(bp.getTransaction().getReferenceNumber());
        dto.setBillCategory(bp.getBillCategory().name());
        dto.setBillerName(bp.getBillerName());
        dto.setConsumerNumber(bp.getConsumerNumber());
        dto.setAmount(bp.getAmount());
        dto.setBalanceAfter(balanceAfter);
        dto.setStatus(bp.getStatus());
        dto.setPaidAt(bp.getPaidAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getBillCategory() { return billCategory; }
    public void setBillCategory(String billCategory) { this.billCategory = billCategory; }

    public String getBillerName() { return billerName; }
    public void setBillerName(String billerName) { this.billerName = billerName; }

    public String getConsumerNumber() { return consumerNumber; }
    public void setConsumerNumber(String consumerNumber) { this.consumerNumber = consumerNumber; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
