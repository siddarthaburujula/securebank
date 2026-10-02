package com.securebank.ledger.repository;

import com.securebank.ledger.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByAccountIdOrderByPostedAtDesc(Long accountId);
    List<LedgerEntry> findByTransactionId(Long transactionId);
}
