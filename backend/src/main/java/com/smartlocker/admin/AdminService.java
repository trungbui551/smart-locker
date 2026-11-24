package com.smartlocker.admin;

import com.smartlocker.audit.AuditService;
import com.smartlocker.auth.AuthDtos;
import com.smartlocker.auth.Role;
import com.smartlocker.auth.User;
import com.smartlocker.auth.UserRepository;
import com.smartlocker.locker.Compartment;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.CompartmentSize;
import com.smartlocker.locker.CompartmentStatus;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerController;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Nghiệp vụ Quản trị viên (ADMIN):
 * - S14: xem, tạo, đổi vai trò, khóa/mở khóa tài khoản
 * - S15: thêm tủ khóa mới (6 ngăn mặc định), thêm ngăn (tối đa 9 ngăn/tủ), đổi cỡ ngăn Nhỏ/Vừa/Lớn
 */
@Service
public class AdminService {

    private static final int MAX_COMPARTMENTS_PER_LOCKER = 9;

    private final UserRepository userRepository;
    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminService(
            UserRepository userRepository,
            LockerRepository lockerRepository,
            CompartmentRepository compartmentRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserProfileResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(AuthDtos.UserProfileResponse::from)
                .toList();
    }

    @Transactional
    public AuthDtos.UserProfileResponse createUser(User admin, AdminDtos.CreateUserRequest req) {
        String username = req.username().trim();
        String email = req.email().trim().toLowerCase();
        String phone = req.phone().trim();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email đã tồn tại.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Số điện thoại đã tồn tại.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(phone);
        user.setFullName(req.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(req.role());
        user.setActive(true);

        User saved = userRepository.save(user);
        auditService.record(admin.getId(), "ADMIN_USER_CREATE",
                "Tạo tài khoản " + saved.getUsername() + " với vai trò " + saved.getRole());
        return AuthDtos.UserProfileResponse.from(saved);
    }

    @Transactional
    public AuthDtos.UserProfileResponse updateUserRole(User admin, Long userId, Role nextRole) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản #" + userId));
        target.setRole(nextRole);
        User saved = userRepository.save(target);
        auditService.record(admin.getId(), "ADMIN_USER_UPDATE",
                "Đổi vai trò của " + saved.getUsername() + " sang " + nextRole);
        return AuthDtos.UserProfileResponse.from(saved);
    }

    @Transactional
    public AuthDtos.UserProfileResponse updateUserActive(User admin, Long userId, boolean active) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản #" + userId));
        if (target.getId().equals(admin.getId()) && !active) {
            throw new IllegalArgumentException("Không thể tự khóa tài khoản quản trị viên đang đăng nhập.");
        }
        target.setActive(active);
        User saved = userRepository.save(target);
        auditService.record(admin.getId(), "ADMIN_USER_LOCK",
                (active ? "Mở khóa" : "Khóa") + " tài khoản " + saved.getUsername());
        return AuthDtos.UserProfileResponse.from(saved);
    }

    @Transactional
    public LockerController.LockerView createLocker(User admin, AdminDtos.CreateLockerRequest req) {
        String lockerId = req.id().trim().toUpperCase();
        if (lockerRepository.existsById(lockerId)) {
            throw new IllegalArgumentException("Mã tủ " + lockerId + " đã tồn tại.");
        }

        Locker locker = new Locker();
        locker.setId(lockerId);
        locker.setName(req.name().trim());
        locker.setLocation(req.location() == null ? "" : req.location().trim());
        locker.setStatus(LockerStatus.ONLINE);
        locker.setLastHeartbeatAt(Instant.now());
        lockerRepository.save(locker);

        // Mặc định tạo 6 ngăn đủ 3 cỡ (2 Nhỏ, 2 Vừa, 2 Lớn) theo PRD
        List<CompartmentSize> sizes = List.of(
                CompartmentSize.SMALL, CompartmentSize.SMALL,
                CompartmentSize.MEDIUM, CompartmentSize.MEDIUM,
                CompartmentSize.LARGE, CompartmentSize.LARGE
        );
        for (int i = 0; i < sizes.size(); i++) {
            Compartment c = new Compartment();
            c.setLocker(locker);
            c.setNumber(i + 1);
            c.setSize(sizes.get(i));
            c.setStatus(CompartmentStatus.FREE);
            compartmentRepository.save(c);
        }

        auditService.record(admin.getId(), "ADMIN_LOCKER_CREATE",
                "Thêm tủ mới " + lockerId + " (" + locker.getName() + ") gồm 6 ngăn.");
        return toLockerView(locker);
    }

    @Transactional
    public LockerController.LockerView addCompartment(User admin, String lockerId, CompartmentSize size) {
        String id = lockerId.trim().toUpperCase();
        Locker locker = lockerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tủ " + id));
        List<Compartment> existing = compartmentRepository.findByLockerIdOrderByNumberAsc(id);
        if (existing.size() >= MAX_COMPARTMENTS_PER_LOCKER) {
            throw new IllegalArgumentException("Mỗi tủ chỉ hỗ trợ tối đa " + MAX_COMPARTMENTS_PER_LOCKER + " ngăn.");
        }

        int nextNumber = existing.isEmpty() ? 1 : existing.getLast().getNumber() + 1;
        Compartment comp = new Compartment();
        comp.setLocker(locker);
        comp.setNumber(nextNumber);
        comp.setSize(size);
        comp.setStatus(CompartmentStatus.FREE);
        compartmentRepository.save(comp);

        auditService.record(admin.getId(), "ADMIN_LOCKER_UPDATE",
                "Thêm ngăn #" + nextNumber + " (cỡ " + size.getLabelVi() + ") cho tủ " + id);
        return toLockerView(locker);
    }

    @Transactional
    public LockerController.LockerView updateCompartmentSize(
            User admin,
            String lockerId,
            Integer compartmentNumber,
            CompartmentSize size
    ) {
        String id = lockerId.trim().toUpperCase();
        Compartment comp = compartmentRepository.findByLockerIdAndNumber(id, compartmentNumber)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ngăn #" + compartmentNumber + " của tủ " + id));
        if (comp.getStatus() == CompartmentStatus.OCCUPIED) {
            throw new IllegalArgumentException("Không thể đổi kích cỡ ngăn đang chứa hàng.");
        }
        comp.setSize(size);
        compartmentRepository.save(comp);

        auditService.record(admin.getId(), "ADMIN_LOCKER_UPDATE",
                "Đổi kích cỡ ngăn #" + compartmentNumber + " của tủ " + id + " sang " + size.getLabelVi());
        return toLockerView(comp.getLocker());
    }

    private LockerController.LockerView toLockerView(Locker locker) {
        List<Compartment> comps = compartmentRepository.findByLockerIdOrderByNumberAsc(locker.getId());
        List<LockerController.CompartmentView> views = comps.stream()
                .map(c -> new LockerController.CompartmentView(c.getId(), c.getNumber(), c.getSize(), c.getStatus()))
                .toList();
        return new LockerController.LockerView(
                locker.getId(),
                locker.getName(),
                locker.getLocation(),
                locker.getStatus(),
                locker.getLastHeartbeatAt(),
                comps.stream().filter(c -> c.getStatus() == CompartmentStatus.FREE && c.getSize() == CompartmentSize.SMALL).count(),
                comps.stream().filter(c -> c.getStatus() == CompartmentStatus.FREE && c.getSize() == CompartmentSize.MEDIUM).count(),
                comps.stream().filter(c -> c.getStatus() == CompartmentStatus.FREE && c.getSize() == CompartmentSize.LARGE).count(),
                views
        );
    }
}
