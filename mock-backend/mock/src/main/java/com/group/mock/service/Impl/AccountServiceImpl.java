package com.group.mock.service.Impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.group.mock.entity.Account;
import com.group.mock.entity.Role;
import com.group.mock.entity.DTO.cache.AccountCache;
import com.group.mock.entity.DTO.request.LoginRequest;
import com.group.mock.repository.AccountRepository;
import com.group.mock.service.AccountService;

import java.time.Duration;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {
    private static final String ACCOUNT_BY_USERNAME_CACHE_KEY_PREFIX = "cache:account:username:";

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, AccountCache> accountCacheTemplate;

    @Value("${app.cache.account-ttl-seconds:300}")
    private long accountCacheTtlSeconds;

    public AccountServiceImpl(
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            RedisTemplate<String, AccountCache> accountCacheTemplate) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountCacheTemplate = accountCacheTemplate;
    }

    @Override
    public void saveAccount(LoginRequest loginRequest) {
        Account account = new Account();
        Role role = new Role();
        role.setId(1);
        role.setName("user");
        account.setRole(role);
        account.setUsername(loginRequest.getUsername());
        account.setPassword(passwordEncoder.encode(loginRequest.getPassword()));
        Account savedAccount = accountRepository.save(account);
        cacheAccount(savedAccount);
    }

    @Override
    public void deleteAccount() {

    }

    @Override
    public void updateAccount() {

    }

    @Override
    public Account loadUserByUsername(String username) throws UsernameNotFoundException {
        return getAccountByUsername(username);
    }

    @Override
    public Account getAccountByUsername(String username) {
        AccountCache cachedAccount = accountCacheTemplate.opsForValue().get(accountByUsernameCacheKey(username));
        if (cachedAccount != null) {
            return cachedAccount.toAccount();
        }

        Optional<Account> accountOptional = accountRepository.findByUsername(username);
        if (accountOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        Account account = accountOptional.get();
        cacheAccount(account);
        return account;
    }

    private void cacheAccount(Account account) {
        if (account == null || account.getUsername() == null) {
            return;
        }

        AccountCache cacheValue = AccountCache.fromAccount(account);
        accountCacheTemplate.opsForValue().set(
                accountByUsernameCacheKey(account.getUsername()),
                cacheValue,
                Duration.ofSeconds(accountCacheTtlSeconds));
    }

    private String accountByUsernameCacheKey(String username) {
        return ACCOUNT_BY_USERNAME_CACHE_KEY_PREFIX + username;
    }
}
