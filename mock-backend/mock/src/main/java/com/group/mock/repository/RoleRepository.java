package com.group.mock.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.group.mock.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    java.util.Optional<Role> findByName(String name);

}
