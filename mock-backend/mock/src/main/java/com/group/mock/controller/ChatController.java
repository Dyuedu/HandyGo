package com.group.mock.controller;

import com.group.mock.entity.Account;
import com.group.mock.entity.Message;
import com.group.mock.entity.MessageAttachment;
import com.group.mock.entity.UserProfile;
import com.group.mock.entity.DTO.response.ApiResponse;
import com.group.mock.entity.DTO.response.ConversationResponse;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.MessageRepository;
import com.group.mock.repository.UserProfileRepository;
import com.group.mock.service.CloudinaryUploadService;
import com.group.mock.configuration.ChatWebSocketHandler;
import com.group.mock.exception.AuthServiceException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AccountRepository accountRepository;
    private final MessageRepository messageRepository;
    private final UserProfileRepository userProfileRepository;
    private final CloudinaryUploadService cloudinaryUploadService;

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(Authentication authentication) {
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để xem danh sách hội thoại");
        }

        String username = authentication.getName();
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng"));

        UUID myId = account.getId();
        List<UUID> contactIds = messageRepository.findContactIds(myId);

        List<ConversationResponse> conversations = new ArrayList<>();
        for (UUID contactId : contactIds) {
            Optional<Account> contactAccountOpt = accountRepository.findById(contactId);
            if (contactAccountOpt.isEmpty()) {
                continue;
            }
            Account contactAccount = contactAccountOpt.get();
            
            // Resolve contact name from user profile
            String contactName = userProfileRepository.findById(contactId)
                    .map(UserProfile::getFullName)
                    .orElse(contactAccount.getUsername());

            String contactRole = contactAccount.getRole() != null 
                    ? contactAccount.getRole().getName().replaceFirst("^ROLE_", "") 
                    : "USER";

            // Resolve last message
            Optional<Message> lastMessageOpt = messageRepository.findLastMessage(myId, contactId);
            String lastMessage = "";
            java.time.LocalDateTime lastMessageTime = java.time.LocalDateTime.now();

            if (lastMessageOpt.isPresent()) {
                Message msg = lastMessageOpt.get();
                lastMessage = msg.getContent() != null ? msg.getContent() : "[Hình ảnh/Tập tin]";
                lastMessageTime = msg.getSentAt();
            }

            conversations.add(new ConversationResponse(
                    contactId,
                    contactName,
                    contactRole,
                    lastMessage,
                    lastMessageTime,
                    0 // unreadCount placeholder
            ));
        }

        // Sort conversations: newest message first
        List<ConversationResponse> sortedConversations = conversations.stream()
                .sorted((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(sortedConversations, null));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<List<Message>>> getChatHistory(
            Authentication authentication,
            @RequestParam("contactId") UUID contactId) {
        
        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để xem lịch sử nhắn tin");
        }

        String username = authentication.getName();
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng"));

        UUID myId = account.getId();
        List<Message> history = messageRepository.findChatHistory(myId, contactId);

        return ResponseEntity.ok(ApiResponse.success(history, null));
    }

    @PostMapping(value = "/messages", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Message>> sendMessageWithAttachments(
            Authentication authentication,
            @RequestParam("receiverId") UUID receiverId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {

        if (authentication == null) {
            throw new AuthServiceException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Bạn cần đăng nhập để gửi tin nhắn");
        }

        String username = authentication.getName();
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AuthServiceException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy tài khoản người dùng"));

        UUID myId = account.getId();

        // 1. Create and save Message
        Message chatMessage = new Message();
        chatMessage.setSenderId(myId);
        chatMessage.setReceiverId(receiverId);
        chatMessage.setContent(content);
        chatMessage.setMessageType(files != null && files.length > 0 ? "IMAGE" : "TEXT");
        chatMessage.setSentAt(java.time.LocalDateTime.now());
        
        // Save first to get message ID
        Message savedMessage = messageRepository.save(chatMessage);

        // 2. Upload attachments
        List<MessageAttachment> attachments = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                try {
                    String fileUrl = cloudinaryUploadService.uploadFile(file);
                    
                    MessageAttachment attachment = new MessageAttachment();
                    attachment.setMessage(savedMessage);
                    attachment.setFileUrl(fileUrl);
                    attachment.setFileType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    
                    attachments.add(attachment);
                } catch (Exception e) {
                    // Fail silently for one file, continue uploading others
                }
            }
        }

        if (!attachments.isEmpty()) {
            savedMessage.setAttachments(attachments);
            // Re-save message with cascading attachments
            savedMessage = messageRepository.save(savedMessage);
        }

        // 3. Broadcast message via WebSocket
        ChatWebSocketHandler.broadcastMessageToUsers(savedMessage);

        return ResponseEntity.ok(ApiResponse.success(savedMessage, null));
    }
}
