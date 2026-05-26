package com.group.mock.entity.DTO.response;

public record WithdrawalDetailResponse(
        WithdrawalResponse request,
        String vietQrPayload,
        String qrImageDataUrl) {
}
