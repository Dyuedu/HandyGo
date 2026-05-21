package com.group.mock.repository;

import com.group.mock.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1) ORDER BY m.sentAt ASC")
    List<Message> findChatHistory(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId")
    List<UUID> findContactIds(@Param("userId") UUID userId);

    @Query(value = "SELECT * FROM messages WHERE (sender_id = :user1 AND receiver_id = :user2) OR (sender_id = :user2 AND receiver_id = :user1) ORDER BY send_at DESC LIMIT 1", nativeQuery = true)
    Optional<Message> findLastMessage(@Param("user1") UUID user1, @Param("user2") UUID user2);
}
