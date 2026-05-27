package com.group.mock.entity.DTO.cache;

import java.io.Serializable;
import java.util.UUID;

import com.group.mock.entity.Account;
import com.group.mock.entity.Role;
import com.group.mock.entity.enums.Status;

public class AccountCache implements Serializable {
    private UUID id;
    private String username;
    private String password;
    private Integer roleId;
    private String roleName;
    private Status status;

    public AccountCache() {
    }

    public static AccountCache fromAccount(Account account) {
        if (account == null) {
            return null;
        }

        AccountCache cache = new AccountCache();
        cache.id = account.getId();
        cache.username = account.getUsername();
        cache.password = account.getPassword();
        cache.status = account.getStatus();
        if (account.getRole() != null) {
            cache.roleId = account.getRole().getId();
            cache.roleName = account.getRole().getName();
        }
        return cache;
    }

    public Account toAccount() {
        Account account = new Account();
        account.setId(id);
        account.setUsername(username);
        account.setPassword(password);
        account.setStatus(status);
        if (roleId != null || roleName != null) {
            Role role = new Role();
            if (roleId != null) {
                role.setId(roleId);
            }
            role.setName(roleName);
            account.setRole(role);
        }
        return account;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
