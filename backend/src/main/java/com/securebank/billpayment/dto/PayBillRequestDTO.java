package com.securebank.billpayment.dto;

import com.securebank.billpayment.entity.BillCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PayBillRequestDTO {

    @NotNull(message = "Bill category is required.")
    private BillCategory billCategory;

    @NotBlank(message = "Biller name is required.")
    private String billerName;

    @NotBlank(message = "Consumer/Account number is required.")
    private String consumerNumber;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "1.00", message = "Minimum bill payment amount is ₹1.00.")
    private BigDecimal amount;

    public PayBillRequestDTO() {}

    public BillCategory getBillCategory() { return billCategory; }
    public void setBillCategory(BillCategory billCategory) { this.billCategory = billCategory; }

    public String getBillerName() { return billerName; }
    public void setBillerName(String billerName) { this.billerName = billerName; }

    public String getConsumerNumber() { return consumerNumber; }
    public void setConsumerNumber(String consumerNumber) { this.consumerNumber = consumerNumber; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
