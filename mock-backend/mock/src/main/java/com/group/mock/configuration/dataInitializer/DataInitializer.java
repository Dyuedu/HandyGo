package com.group.mock.configuration.dataInitializer;


import com.group.mock.entity.Role;
import com.group.mock.repository.RoleRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    // Inject Repository qua Constructor (Đúng chuẩn Clean Code trong Constitution)
    public DataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Danh sách các Role cần có cho hệ thống Uber Thợ của bạn
        List<String> defaultRoles = List.of("ROLE_USER", "ROLE_WORKER", "ROLE_ADMIN");

        for (String roleName : defaultRoles) {
            // Kiểm tra nếu Role chưa tồn tại trong DB thì mới thêm mới
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                System.out.println(">> [DataInit] Đã khởi tạo thành công Role: " + roleName);
            }
        }
    }
}
