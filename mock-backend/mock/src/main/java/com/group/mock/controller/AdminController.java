package com.group.mock.controller;

import com.group.mock.entity.DTO.response.AdminWorkerResponse;
import com.group.mock.service.AdminService;
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
}
