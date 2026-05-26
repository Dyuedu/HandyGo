package com.group.mock.entity.DTO.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String type; // BOOKING_CREATED, MESSAGE_NEW, etc.
    private String title;
    private String message;
    private String data; // JSON string
}
