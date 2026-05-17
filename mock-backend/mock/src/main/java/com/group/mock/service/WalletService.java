package com.group.mock.service;

import java.util.List;
import java.util.Map;

import com.group.mock.entity.DTO.request.TopUpRequest;
import com.group.mock.entity.DTO.request.WalletDeductRequest;
import com.group.mock.entity.DTO.response.PaymentCallbackResponse;
import com.group.mock.entity.DTO.response.TopUpResponse;
import com.group.mock.entity.DTO.response.TransactionHistorySummary;
import com.group.mock.entity.DTO.response.WalletBalanceResponse;
import com.group.mock.entity.DTO.response.WalletDeductResponse;

public interface WalletService {
    WalletBalanceResponse createWallet(String username);
    WalletBalanceResponse getBalance(String username);
    TopUpResponse createTopUp(String username, TopUpRequest request, String ipAddress);
    PaymentCallbackResponse handleVnpayCallback(Map<String, String> params);
    List<TransactionHistorySummary> getHistory(String username);
    WalletDeductResponse deduct(String username, WalletDeductRequest request);
}
