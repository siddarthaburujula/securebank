package com.securebank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RegistrationAndAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Auth Flow: Register new customer, login, and fetch dashboard")
    void testRegisterAndLogin() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6);
        String username = "cust_" + randomSuffix;
        String email = "cust_" + randomSuffix + "@securebank.com";
        String phone = "+91" + (1000000000L + (long)(Math.random() * 8999999999L));

        String registerJson = String.format("""
                {
                    "username": "%s",
                    "password": "Password@123",
                    "confirmPassword": "Password@123",
                    "fullName": "Test Customer %s",
                    "email": "%s",
                    "phoneNumber": "%s",
                    "dateOfBirth": "1994-08-20",
                    "address": "45 Financial District, Hyderabad, India",
                    "accountType": "SAVINGS",
                    "initialDeposit": 25000.00
                }
                """, username, randomSuffix, email, phone);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").isNotEmpty())
                .andReturn();

        JsonNode regData = objectMapper.readTree(regResult.getResponse().getContentAsString()).path("data");
        String accountNumber = regData.path("accountNumber").asText();
        assertNotNull(accountNumber);

        // Login with new customer
        String loginJson = String.format("""
                {
                    "usernameOrEmail": "%s",
                    "password": "Password@123"
                }
                """, username);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // Fetch dashboard for newly registered user
        mockMvc.perform(get("/api/accounts/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value(accountNumber))
                .andExpect(jsonPath("$.data.availableBalance").value(25000.00));
    }
}
