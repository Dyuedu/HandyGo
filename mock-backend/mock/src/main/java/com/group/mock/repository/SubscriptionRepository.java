package com.group.mock.repository;

import com.group.mock.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByStatus(String status);
    Optional<Subscription> findByIdAndStatus(Long id, String status);
}
