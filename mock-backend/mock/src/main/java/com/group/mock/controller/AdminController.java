package com.group.mock.controller;

import com.group.mock.entity.DTO.request.CreateSubscriptionPlanRequest;
import com.group.mock.entity.DTO.request.CreateVoucherRequest;
import com.group.mock.entity.DTO.response.AdminWorkerResponse;
import com.group.mock.entity.DTO.response.SubscriptionPlanResponse;
import com.group.mock.entity.DTO.response.VoucherSummaryResponse;
import com.group.mock.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/workers")
    public ResponseEntity<List<AdminWorkerResponse>> getAllWorkers() {
        return ResponseEntity.ok(adminService.getAllWorkers());
    }

    @GetMapping("/workers/{id}")
    public ResponseEntity<AdminWorkerResponse> getWorkerById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getWorkerById(id));
    }

    @PutMapping("/workers/{id}/verify")
    public ResponseEntity<?> toggleWorkerVerification(@PathVariable UUID id) {
        adminService.toggleWorkerVerification(id);
        return ResponseEntity.ok(Map.of("message", "Thay đổi trạng thái xác thực thành công"));
    }

    @PutMapping("/workers/{id}/status")
    public ResponseEntity<?> toggleWorkerStatus(@PathVariable UUID id) {
        adminService.toggleWorkerStatus(id);
        return ResponseEntity.ok(Map.of("message", "Thay đổi trạng thái tài khoản thành công"));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<List<VoucherSummaryResponse>> getAllVouchers() {
        return ResponseEntity.ok(adminService.getAllVouchers());
    }

    @PostMapping("/vouchers")
    public ResponseEntity<VoucherSummaryResponse> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        return ResponseEntity.ok(adminService.createVoucher(request));
    }

    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllSubscriptionPlans() {
        return ResponseEntity.ok(adminService.getAllSubscriptionPlans());
    }

    @PostMapping("/subscription-plans")
    public ResponseEntity<SubscriptionPlanResponse> createSubscriptionPlan(
            @Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return ResponseEntity.ok(adminService.createSubscriptionPlan(request));
    }
}
