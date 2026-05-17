package com.group.mock.service;

import org.springframework.security.core.userdetails.UserDetailsService;

import com.group.mock.entity.Account;
import com.group.mock.entity.DTO.request.LoginRequest;

public interface AccountService extends UserDetailsService {
    void saveAccount(LoginRequest loginRequest);
    void deleteAccount();
    void updateAccount();
    Account getAccountByUsername(String username);

}
