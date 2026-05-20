package com.group.mock.configuration.dataInitializer;


import com.group.mock.entity.Role;
import com.group.mock.entity.Voucher;
import com.group.mock.entity.enums.VoucherDiscountType;
import com.group.mock.repository.RoleRepository;
import com.group.mock.repository.VoucherRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final VoucherRepository voucherRepository;

    public DataInitializer(RoleRepository roleRepository, VoucherRepository voucherRepository) {
        this.roleRepository = roleRepository;
        this.voucherRepository = voucherRepository;
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

        if (voucherRepository.findByCode("GIAM30K").isEmpty()) {
            Voucher voucher = new Voucher();
            voucher.setCode("GIAM30K");
            voucher.setValue(new BigDecimal("30000"));
            voucher.setDiscountType(VoucherDiscountType.FIXED_AMOUNT);
            voucher.setMaxUses(20);
            voucher.setUsed(false);
            voucherRepository.save(voucher);
            System.out.println(">> [DataInit] Đã khởi tạo voucher GIAM30K (30.000 VND, tối đa 20 lượt)");
        }
    }
}
