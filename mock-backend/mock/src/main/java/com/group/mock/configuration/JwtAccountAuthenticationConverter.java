package com.group.mock.configuration;

import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.group.mock.entity.Account;
import com.group.mock.service.AccountService;



@Component
public class JwtAccountAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AccountService accountService;

    public JwtAccountAuthenticationConverter(@Lazy AccountService accountService) {
        this.accountService = accountService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String username = jwt.getSubject();

        Account account = (Account) accountService.loadUserByUsername(username);

        return new JwtAuthenticationToken(jwt, account.getAuthorities());
    }
}
