package com.group.mock.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.group.mock.entity.Wallet;

import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
	Optional<Wallet> findByUserId(UUID userId);
}
