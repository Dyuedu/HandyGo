package com.group.mock.controller;

import com.group.mock.configuration.VNPayConfiguration.VNPayUtil;
import com.group.mock.entity.DTO.request.TopUpRequest;
import com.group.mock.entity.DTO.request.WalletDeductRequest;
import com.group.mock.entity.DTO.response.TopUpResponse;
import com.group.mock.entity.DTO.response.TransactionHistorySummary;
import com.group.mock.entity.DTO.response.WalletBalanceResponse;
import com.group.mock.entity.DTO.response.WalletDeductResponse;
import com.group.mock.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class WalletController {
    private final WalletService walletService;

    @PostMapping
    public ResponseEntity<WalletBalanceResponse> createWallet(Authentication authentication) {
        return ResponseEntity.ok(walletService.createWallet(authentication.getName()));
    }

    @GetMapping("/balance")
    public ResponseEntity<WalletBalanceResponse> getBalance(Authentication authentication) {
        return ResponseEntity.ok(walletService.getBalance(authentication.getName()));
    }

    @PostMapping("/topup")
    public ResponseEntity<TopUpResponse> topUp(
            Authentication authentication,
            @RequestBody TopUpRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = VNPayUtil.getIpAddress(httpRequest);
        return ResponseEntity.ok(walletService.createTopUp(authentication.getName(), request, ipAddress));
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransactionHistorySummary>> history(Authentication authentication) {
        return ResponseEntity.ok(walletService.getHistory(authentication.getName()));
    }

    @PostMapping("/deduct")
    public ResponseEntity<WalletDeductResponse> deduct(
            Authentication authentication,
            @RequestBody WalletDeductRequest request) {
        return ResponseEntity.ok(walletService.deduct(authentication.getName(), request));
    }
}
