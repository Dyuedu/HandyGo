package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Họ tên là bắt buộc")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @Pattern(regexp = "^(|0|\\+84)(3|5|7|8|9)[0-9]{8}$", message = "Số điện thoại Việt Nam không hợp lệ")
    private String phone;
}
