package com.group.mock;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;

public class TestDB {
    public static void main(String[] args) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&options=reference=prqowmqmkeqhpkkxqfdz");
        config.setUsername("postgres.prqowmqmkeqhpkkxqfdz");
        config.setPassword("tdJtSnYhVeCR6BQA");
        config.setDriverClassName("org.postgresql.Driver");
        
        try {
            HikariDataSource ds = new HikariDataSource(config);
            Connection conn = ds.getConnection();
            System.out.println("HikariCP SUCCESS!");
            conn.close();
            ds.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
