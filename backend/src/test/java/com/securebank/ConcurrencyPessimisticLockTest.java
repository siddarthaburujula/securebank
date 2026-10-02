package com.securebank;

import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.common.exception.InsufficientFundsException;
import com.securebank.transaction.dto.TransferRequestDTO;
import com.securebank.transaction.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ConcurrencyPessimisticLockTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    private static final String ACC_SIDDARTHA = "100100000001";
    private static final String ACC_RAHUL = "100100000002";
    private static final String IFSC_CODE = "SECURE000001";

    @Test
    @DisplayName("Pessimistic Lock Guard: Concurrent transfers cannot overdraw account (Race Condition Prevention)")
    void testConcurrentOverdraftProtection() throws InterruptedException {
        // Set Siddartha's balance to exactly ₹10,000
        Account sender = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        sender.setBalance(new BigDecimal("10000.00"));
        sender.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(sender);

        Account receiver = accountRepository.findByAccountNumber(ACC_RAHUL).orElseThrow();
        receiver.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(receiver);

        // Attempt two simultaneous transfers of ₹8,000 each (Total ₹16,000, which exceeds ₹10,000)
        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(numThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < numThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all threads to fire simultaneously
                    TransferRequestDTO req = new TransferRequestDTO();
                    req.setReceiverAccountNumber(ACC_RAHUL);
                    req.setReceiverIfscCode(IFSC_CODE);
                    req.setAmount(new BigDecimal("8000.00"));
                    req.setTransferType("IMPS");
                    req.setDescription("Concurrent race condition test");
                    req.setIdempotencyKey("RACE-" + UUID.randomUUID());

                    transactionService.initiateTransfer("siddartha", req, "127.0.0.1");
                    successCount.incrementAndGet();
                } catch (InsufficientFundsException ex) {
                    failureCount.incrementAndGet();
                } catch (Exception ex) {
                    failureCount.incrementAndGet();
                } finally {
                    endLatch.countDown();
                }
            });
        }

        // Fire both threads simultaneously
        startLatch.countDown();
        boolean completed = endLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "Both concurrent transactions should complete within timeout");
        assertEquals(1, successCount.get(), "Exactly one concurrent transfer must succeed");
        assertEquals(1, failureCount.get(), "Exactly one concurrent transfer must fail due to insufficient funds");

        Account senderFinal = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        assertEquals(0, new BigDecimal("2000.00").compareTo(senderFinal.getBalance()),
                "Sender balance must be exactly ₹2,000.00 (₹10,000 - ₹8,000) and cannot be negative");
    }

    @Test
    @DisplayName("Deadlock Avoidance: Bidirectional simultaneous transfers (A->B and B->A) succeed via Ascending ID Lock Order")
    void testBidirectionalTransfersDeadlockAvoidance() throws InterruptedException {
        // Ensure healthy balances
        Account a = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        a.setBalance(new BigDecimal("20000.00"));
        a.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(a);

        Account b = accountRepository.findByAccountNumber(ACC_RAHUL).orElseThrow();
        b.setBalance(new BigDecimal("20000.00"));
        b.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(b);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);

        // Thread 1: Siddartha -> Rahul ₹1,000
        executor.submit(() -> {
            try {
                startLatch.await();
                TransferRequestDTO req = new TransferRequestDTO();
                req.setReceiverAccountNumber(ACC_RAHUL);
                req.setReceiverIfscCode(IFSC_CODE);
                req.setAmount(new BigDecimal("1000.00"));
                req.setTransferType("IMPS");
                req.setDescription("Bidirectional A->B");
                req.setIdempotencyKey("BIDI-" + UUID.randomUUID());

                transactionService.initiateTransfer("siddartha", req, "127.0.0.1");
                successCount.incrementAndGet();
            } catch (Exception ex) {
                // error
            } finally {
                endLatch.countDown();
            }
        });

        // Thread 2: Rahul -> Siddartha ₹1,000
        executor.submit(() -> {
            try {
                startLatch.await();
                TransferRequestDTO req = new TransferRequestDTO();
                req.setReceiverAccountNumber(ACC_SIDDARTHA);
                req.setReceiverIfscCode(IFSC_CODE);
                req.setAmount(new BigDecimal("1000.00"));
                req.setTransferType("IMPS");
                req.setDescription("Bidirectional B->A");
                req.setIdempotencyKey("BIDI-" + UUID.randomUUID());

                transactionService.initiateTransfer("rahul", req, "127.0.0.1");
                successCount.incrementAndGet();
            } catch (Exception ex) {
                // error
            } finally {
                endLatch.countDown();
            }
        });

        startLatch.countDown();
        boolean finished = endLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "Both threads should complete without deadlock");
        assertEquals(2, successCount.get(), "Both bidirectional transfers must succeed without deadlock");
    }
}
