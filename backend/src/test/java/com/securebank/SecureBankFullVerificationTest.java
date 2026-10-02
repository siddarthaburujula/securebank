package com.securebank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.account.entity.Account;
import com.securebank.account.entity.AccountStatus;
import com.securebank.account.repository.AccountRepository;
import com.securebank.ledger.entity.EntryType;
import com.securebank.ledger.entity.LedgerEntry;
import com.securebank.ledger.repository.LedgerRepository;
import com.securebank.transaction.entity.Transaction;
import com.securebank.transaction.entity.TransactionStatus;
import com.securebank.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Verification Test Suite for SecureBank
 * Covers:
 * 1. Account Authentication & Receiver Lookup (Account 2 from Account 1)
 * 2. Atomic Fund Transfer (₹5,000 from Account 1 to Account 2)
 * 3. Exact Balance Verifications & Double-Entry Ledger assertions (DEBIT & CREDIT)
 * 4. Idempotency Key deduplication (no double debits)
 * 5. Dormant Account Protection (403 Rejection)
 * 6. Dormant Account Reactivation Workflow (Step-up OTP + Admin Approval -> ACTIVE)
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SecureBankFullVerificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LedgerRepository ledgerRepository;

    @Autowired
    private com.securebank.dormant.repository.ReactivationRequestRepository reactivationRequestRepository;

    private static String siddarthaToken;
    private static String rahulToken;
    private static String vikramToken;
    private static String adminToken;

    private static final String ACC_SIDDARTHA = "100100000001";
    private static final String ACC_RAHUL = "100100000002";
    private static final String ACC_VIKRAM = "100100000003";
    private static final String IFSC_CODE = "SECURE000001";

    private String loginAndGetToken(String username, String password) throws Exception {
        String loginJson = String.format("{\"usernameOrEmail\":\"%s\",\"password\":\"%s\"}", username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }

    @BeforeEach
    void setUpTokens() throws Exception {
        if (siddarthaToken == null) {
            siddarthaToken = loginAndGetToken("siddartha", "Password@123");
        }
        if (rahulToken == null) {
            rahulToken = loginAndGetToken("rahul", "Password@123");
        }
        if (vikramToken == null) {
            vikramToken = loginAndGetToken("vikram", "Password@123");
        }
        if (adminToken == null) {
            adminToken = loginAndGetToken("admin", "Admin@123");
        }
    }

    @Test
    @Order(1)
    @DisplayName("Step 1: Receiver Account Lookup by Account Number + IFSC")
    void testReceiverLookup() throws Exception {
        mockMvc.perform(get("/api/accounts/lookup")
                        .header("Authorization", "Bearer " + siddarthaToken)
                        .param("accountNumber", ACC_RAHUL)
                        .param("ifscCode", IFSC_CODE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value(ACC_RAHUL))
                .andExpect(jsonPath("$.data.receiverName").value("Rahul Sharma"))
                .andExpect(jsonPath("$.data.ifscCode").value(IFSC_CODE));
    }

    @Test
    @Order(2)
    @DisplayName("Step 2: Atomic Fund Transfer ₹5,000 from Siddartha to Rahul with Double-Entry Ledger")
    void testAtomicTransferAndLedger() throws Exception {
        // Ensure starting balances are ₹50,000 and ₹10,000 as specified in verification plan
        Account sender = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        sender.setBalance(new BigDecimal("50000.00"));
        sender.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(sender);

        Account receiver = accountRepository.findByAccountNumber(ACC_RAHUL).orElseThrow();
        receiver.setBalance(new BigDecimal("10000.00"));
        receiver.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(receiver);

        BigDecimal transferAmount = new BigDecimal("5000.00");
        String idempotencyKey = "IDEMP-VERIFY-" + UUID.randomUUID();

        String transferJson = String.format("""
                {
                    "receiverAccountNumber": "%s",
                    "receiverIfscCode": "%s",
                    "amount": 5000.00,
                    "transferType": "IMPS",
                    "description": "Educational Verification Transfer",
                    "idempotencyKey": "%s"
                }
                """, ACC_RAHUL, IFSC_CODE, idempotencyKey);

        MvcResult result = mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + siddarthaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.amount").value(5000.00))
                .andExpect(jsonPath("$.data.idempotent").value(false))
                .andExpect(jsonPath("$.data.senderBalanceAfter").value(45000.00))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String refNumber = responseNode.path("data").path("referenceNumber").asText();
        assertNotNull(refNumber, "Reference number should be generated");

        // Verify balances in database
        Account senderAfter = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        Account receiverAfter = accountRepository.findByAccountNumber(ACC_RAHUL).orElseThrow();

        assertEquals(0, new BigDecimal("45000.00").compareTo(senderAfter.getBalance()),
                "Sender balance must be exactly ₹45,000.00");
        assertEquals(0, new BigDecimal("15000.00").compareTo(receiverAfter.getBalance()),
                "Receiver balance must be exactly ₹15,000.00");

        // Verify Transaction in Database
        Transaction tx = transactionRepository.findByReferenceNumber(refNumber).orElseThrow();
        assertEquals(TransactionStatus.SUCCESS, tx.getStatus());
        assertEquals(0, transferAmount.compareTo(tx.getAmount()));

        // Verify Double-Entry Ledger entries
        List<LedgerEntry> entries = ledgerRepository.findByTransactionId(tx.getId());
        assertEquals(2, entries.size(), "Must have exactly 2 ledger entries for double-entry bookkeeping");

        LedgerEntry debitEntry = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .findFirst()
                .orElseThrow(() -> new AssertionError("DEBIT ledger entry missing"));
        assertEquals(senderAfter.getId(), debitEntry.getAccount().getId());
        assertEquals(0, transferAmount.compareTo(debitEntry.getAmount()));
        assertEquals(0, senderAfter.getBalance().compareTo(debitEntry.getBalanceAfter()));

        LedgerEntry creditEntry = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .findFirst()
                .orElseThrow(() -> new AssertionError("CREDIT ledger entry missing"));
        assertEquals(receiverAfter.getId(), creditEntry.getAccount().getId());
        assertEquals(0, transferAmount.compareTo(creditEntry.getAmount()));
        assertEquals(0, receiverAfter.getBalance().compareTo(creditEntry.getBalanceAfter()));

        // Test Idempotency with exact same key
        mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + siddarthaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.idempotent").value(true));

        // Check balances again to ensure no double deduction
        Account senderAfterIdemp = accountRepository.findByAccountNumber(ACC_SIDDARTHA).orElseThrow();
        assertEquals(0, senderAfter.getBalance().compareTo(senderAfterIdemp.getBalance()),
                "Sender balance must remain unchanged upon duplicate idempotent request");
    }

    @Test
    @Order(3)
    @DisplayName("Step 3: Dormant Account Transfer Attempt Rejected with 403 / ACCOUNT_DORMANT")
    void testDormantAccountProtection() throws Exception {
        // Ensure Vikram's account is DORMANT
        Account vikramAcc = accountRepository.findByAccountNumber(ACC_VIKRAM).orElseThrow();
        vikramAcc.setStatus(AccountStatus.DORMANT);
        accountRepository.save(vikramAcc);

        String transferJson = String.format("""
                {
                    "receiverAccountNumber": "%s",
                    "receiverIfscCode": "%s",
                    "amount": 1000.00,
                    "transferType": "IMPS",
                    "description": "Attempt from dormant account",
                    "idempotencyKey": "%s"
                }
                """, ACC_RAHUL, IFSC_CODE, "DORMANT-TX-" + UUID.randomUUID());

        mockMvc.perform(post("/api/transactions/transfer")
                        .header("Authorization", "Bearer " + vikramToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("dormant")));
    }

    @Test
    @Order(4)
    @DisplayName("Step 4: Dormant Reactivation Request by Customer & Approval by Admin")
    void testDormantReactivationWorkflow() throws Exception {
        // Ensure clean state: delete any existing reactivation requests for Vikram
        Account vikramAccForClean = accountRepository.findByAccountNumber(ACC_VIKRAM).orElseThrow();
        var existingRequests = reactivationRequestRepository.findByAccountIdOrderByRequestedAtDesc(vikramAccForClean.getId());
        reactivationRequestRepository.deleteAll(existingRequests);

        // Step 4a: Vikram submits reactivation request with simulated OTP
        String reactivationRequestJson = """
                {
                    "reason": "Account reactivation required for salary credit and bill payments",
                    "otp": "123456"
                }
                """;

        MvcResult reqResult = mockMvc.perform(post("/api/dormant/reactivate")
                        .header("Authorization", "Bearer " + vikramToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reactivationRequestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        JsonNode reqData = objectMapper.readTree(reqResult.getResponse().getContentAsString()).path("data");
        long requestId = reqData.path("id").asLong();

        // Step 4b: Admin views pending reactivations
        mockMvc.perform(get("/api/admin/reactivations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Step 4c: Admin approves reactivation
        String reviewJson = """
                {
                    "approved": true,
                    "reviewNotes": "Identity verified via Aadhaar OTP simulation and phone confirmation."
                }
                """;

        mockMvc.perform(post("/api/admin/reactivations/" + requestId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // Step 4d: Verify account in database has returned to ACTIVE status
        Account reactivatedAccount = accountRepository.findByAccountNumber(ACC_VIKRAM).orElseThrow();
        assertEquals(AccountStatus.ACTIVE, reactivatedAccount.getStatus(),
                "Account status must transition from DORMANT to ACTIVE upon approval");
        assertNull(reactivatedAccount.getDormantSince(), "dormantSince must be cleared");

        // Restore Vikram to DORMANT for demo showcase purposes
        reactivatedAccount.setStatus(AccountStatus.DORMANT);
        reactivatedAccount.setDormantSince(java.time.LocalDateTime.now().minusDays(45));
        reactivatedAccount.setLastActivityAt(java.time.LocalDateTime.now().minusDays(120));
        accountRepository.save(reactivatedAccount);
    }
}
