package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class RegisterRequest {
    @NotBlank(message = "Vai trò là bắt buộc")
    @Pattern(regexp = "USER|WORKER", message = "Vai trò chỉ hỗ trợ USER hoặc WORKER")
    private String role;

    @NotBlank(message = "Tên đăng nhập là bắt buộc")
    @Size(min = 4, max = 50, message = "Tên đăng nhập phải từ 4 đến 50 ký tự")
    @Pattern(regexp = "\\S+", message = "Tên đăng nhập không được chứa khoảng trắng")
    private String username;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Mật khẩu phải có ít nhất 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
    )
    private String password;

    private String fullName;

    @Pattern(regexp = "^(|0|\\+84)(3|5|7|8|9)[0-9]{8}$", message = "Số điện thoại Việt Nam không hợp lệ")
    private String phone;

    private String jobType;
    private MultipartFile professionalCertificate;
}
