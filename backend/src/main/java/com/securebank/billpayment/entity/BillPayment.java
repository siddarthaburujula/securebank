package com.securebank.billpayment.entity;

import com.securebank.account.entity.Account;
import com.securebank.transaction.entity.Transaction;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_payments")
public class BillPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false, unique = true)
    private Transaction transaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_category", nullable = false)
    private BillCategory billCategory;

    @Column(name = "consumer_number", nullable = false, length = 50)
    private String consumerNumber;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "biller_name", nullable = false, length = 100)
    private String billerName;

    @Column(name = "status", nullable = false)
    private String status = "SUCCESS";

    @Column(name = "paid_at", nullable = false, updatable = false)
    private LocalDateTime paidAt = LocalDateTime.now();

    public BillPayment() {}

    public BillPayment(Account account, Transaction transaction, BillCategory billCategory,
                       String consumerNumber, BigDecimal amount, String billerName) {
        this.account = account;
        this.transaction = transaction;
        this.billCategory = billCategory;
        this.consumerNumber = consumerNumber;
        this.amount = amount;
        this.billerName = billerName;
        this.status = "SUCCESS";
        this.paidAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }

    public Transaction getTransaction() { return transaction; }
    public void setTransaction(Transaction transaction) { this.transaction = transaction; }

    public BillCategory getBillCategory() { return billCategory; }
    public void setBillCategory(BillCategory billCategory) { this.billCategory = billCategory; }

    public String getConsumerNumber() { return consumerNumber; }
    public void setConsumerNumber(String consumerNumber) { this.consumerNumber = consumerNumber; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getBillerName() { return billerName; }
    public void setBillerName(String billerName) { this.billerName = billerName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPaidAt() { return paidAt; }
}
