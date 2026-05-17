package com.group.mock.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.script.DefaultRedisScript;

@Configuration
public class RedisScriptsConfig {

    @Bean
    public DefaultRedisScript<Long> walletDeductScript() {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setResultType(Long.class);
        script.setScriptText(
                "local balance = redis.call('GET', KEYS[1])\n" +
                "if not balance then return -2 end\n" +
                "local amount = tonumber(ARGV[1])\n" +
                "local current = tonumber(balance)\n" +
                "if current < amount then return -1 end\n" +
                "local newBalance = current - amount\n" +
                "redis.call('SET', KEYS[1], newBalance)\n" +
                "return newBalance");
        return script;
    }
}
