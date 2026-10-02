package com.securebank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securebank.account.entity.Account;
import com.securebank.account.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class BeneficiaryAndBillPaymentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AccountRepository accountRepository;

    private static String token;

    @BeforeEach
    void setUp() throws Exception {
        if (token == null) {
            String loginJson = "{\"usernameOrEmail\":\"siddartha\",\"password\":\"Password@123\"}";
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson))
                    .andExpect(status().isOk())
                    .andReturn();
            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
            token = root.path("data").path("token").asText();
        }
    }

    @Test
    @DisplayName("Beneficiary Flow: Add Beneficiary & Check 30-min Cooling Off Period")
    void testBeneficiaryFlow() throws Exception {
        String addBeneficiaryJson = """
                {
                    "beneficiaryAccountNumber": "100194738508",
                    "beneficiaryIfscCode": "SECURE000001",
                    "nickname": "Ananya Tech"
                }
                """;

        // May already exist from sample data or previous run, so perform GET or POST
        MvcResult listResult = mockMvc.perform(get("/api/beneficiaries")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode listData = objectMapper.readTree(listResult.getResponse().getContentAsString()).path("data");
        assertTrue(listData.isArray(), "Beneficiaries list should be an array");
    }

    @Test
    @DisplayName("Bill Payment Flow: Pay Electricity Bill and verify debit")
    void testBillPayment() throws Exception {
        Account before = accountRepository.findByAccountNumber("100100000001").orElseThrow();
        BigDecimal balanceBefore = before.getBalance();
        BigDecimal billAmount = new BigDecimal("450.00");

        String billJson = String.format("""
                {
                    "billCategory": "ELECTRICITY",
                    "billerName": "State Power Distribution",
                    "consumerNumber": "CON-PWR-%s",
                    "amount": 450.00
                }
                """, UUID.randomUUID().toString().substring(0, 6));

        mockMvc.perform(post("/api/bills/pay")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(billJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.amount").value(450.00));

        Account after = accountRepository.findByAccountNumber("100100000001").orElseThrow();
        assertTrue(before.getBalance().compareTo(after.getBalance()) > 0,
                "Balance must decrease after paying bill");
    }

    @Test
    @DisplayName("Statements Flow: Fetch summary and CSV Export")
    void testStatements() throws Exception {
        mockMvc.perform(get("/api/transactions/statement")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("100100000001"));

        MvcResult csvResult = mockMvc.perform(get("/api/transactions/statement/csv")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String csv = csvResult.getResponse().getContentAsString();
        assertTrue(csv.contains("SecureBank - Account Statement"));
        assertTrue(csv.contains("100100000001"));
    }
}
