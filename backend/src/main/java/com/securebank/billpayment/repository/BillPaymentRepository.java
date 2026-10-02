package com.securebank.billpayment.repository;

import com.securebank.billpayment.entity.BillPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {

    List<BillPayment> findByAccountIdOrderByPaidAtDesc(Long accountId);

    Page<BillPayment> findByAccountIdOrderByPaidAtDesc(Long accountId, Pageable pageable);
}
