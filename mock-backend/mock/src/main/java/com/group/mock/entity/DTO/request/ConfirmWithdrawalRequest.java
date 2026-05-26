package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConfirmWithdrawalRequest {

    @Size(max = 500)
    private String adminNote;
}
