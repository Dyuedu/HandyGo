package com.group.mock.entity.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private UUID contactId;
    private String contactName;
    private String contactRole;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Integer unreadCount;
}
