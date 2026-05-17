package com.group.mock.controller;

import com.group.mock.entity.DTO.response.PaymentCallbackResponse;
import com.group.mock.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final WalletService walletService;

    @GetMapping("/vnpay-callback")
    public ResponseEntity<PaymentCallbackResponse> vnpayCallback(
            @RequestParam Map<String, String> params) {
        return ResponseEntity.ok(walletService.handleVnpayCallback(params));
    }
}
