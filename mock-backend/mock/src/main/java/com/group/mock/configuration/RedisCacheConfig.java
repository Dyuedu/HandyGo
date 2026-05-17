package com.group.mock.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group.mock.entity.DTO.cache.AccountCache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisCacheConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        return mapper;
    }

    @SuppressWarnings({ "deprecation", "removal" })
    @Bean
    public RedisTemplate<String, AccountCache> accountCacheTemplate(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper) {
        RedisTemplate<String, AccountCache> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        Jackson2JsonRedisSerializer<AccountCache> serializer =
                new Jackson2JsonRedisSerializer<>(AccountCache.class);
        ObjectMapper mapper = objectMapper.copy();
        mapper.findAndRegisterModules();
        serializer.setObjectMapper(mapper);

        StringRedisSerializer keySerializer = new StringRedisSerializer();
        template.setKeySerializer(keySerializer);
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(keySerializer);
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }
}
