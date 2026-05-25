package com.group.mock.entity.DTO.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UpdateWorkerProfileRequest {

    @NotBlank(message = "Loại công việc là bắt buộc")
    @Size(max = 50, message = "Loại công việc tối đa 50 ký tự")
    private String jobType;

    private MultipartFile professionalCertificate;
}
