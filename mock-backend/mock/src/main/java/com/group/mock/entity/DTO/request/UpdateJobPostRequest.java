package com.group.mock.entity.DTO.request;

import lombok.Data;

@Data
public class UpdateJobPostRequest {

    private String title;

    private String description;

    private String jobType;

    private String address;

    private Double latitude;

    private Double longitude;

    private String status; // OPEN, CLOSED
}
