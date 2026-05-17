package com.group.mock.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.group.mock.entity.TransactionHistory;

import java.util.List;
import java.util.Optional;

public interface TransactionHistoryRepository extends JpaRepository<TransactionHistory, Long> {
	Optional<TransactionHistory> findByVnpTxnRef(String vnpTxnRef);
	List<TransactionHistory> findByWalletIdOrderByCreatedAtDesc(Long walletId);
}
