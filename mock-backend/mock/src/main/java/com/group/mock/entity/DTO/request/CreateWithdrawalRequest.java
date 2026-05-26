package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CreateWithdrawalRequest {

    @NotNull
    @DecimalMin(value = "0.0001", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank
    @Size(max = 20)
    private String bankBin;

    @NotBlank
    @Size(max = 100)
    private String bankName;

    @NotBlank
    @Size(max = 40)
    private String accountNo;

    @NotBlank
    @Size(max = 100)
    private String accountName;
}
