package com.group.mock.service;

import org.springframework.security.core.userdetails.UserDetailsService;

import com.group.mock.entity.Account;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.entity.DTO.request.RegisterRequest;

public interface AccountService extends UserDetailsService {
    void saveAccount(LoginRequest loginRequest);
    void register(RegisterRequest registerRequest);
    String getAccountRole(String username);
    String getWorkerVerificationStatus(String username);
    void deleteAccount();
    void updateAccount();
    Account getAccountByUsername(String username);
    Account loginOrRegisterGoogleUser(String supabaseAccessToken);
}
