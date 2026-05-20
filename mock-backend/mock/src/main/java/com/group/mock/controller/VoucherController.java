package com.group.mock.controller;

import com.group.mock.entity.DTO.response.VoucherSummaryResponse;
import com.group.mock.service.VoucherService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<VoucherSummaryResponse>> listAvailable() {
        return ResponseEntity.ok(voucherService.listAvailableForBooking());
    }
}
