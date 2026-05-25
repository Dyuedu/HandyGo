package com.group.mock.entity.DTO.response;

import com.group.mock.entity.enums.WithdrawalStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record WithdrawalResponse(
        Long id,
        UUID workerId,
        String workerUsername,
        String workerFullName,
        BigDecimal amount,
        String currency,
        String bankBin,
        String bankName,
        String accountNo,
        String accountName,
        String transferContent,
        WithdrawalStatus status,
        String adminNote,
        LocalDateTime confirmedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
