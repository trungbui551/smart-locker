package com.smartlocker.admin;

import com.smartlocker.auth.AuthDtos;
import com.smartlocker.auth.User;
import com.smartlocker.locker.LockerController;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API chỉ dành cho Quản trị viên (được bảo vệ bởi hasRole("ADMIN") trong SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<AuthDtos.UserProfileResponse> listUsers() {
        return adminService.listUsers();
    }

    @PostMapping("/users")
    public ResponseEntity<AuthDtos.UserProfileResponse> createUser(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody AdminDtos.CreateUserRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(admin, request));
    }

    @PatchMapping("/users/{id}/role")
    public AuthDtos.UserProfileResponse updateRole(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.UpdateRoleRequest request
    ) {
        return adminService.updateUserRole(admin, id, request.role());
    }

    @PatchMapping("/users/{id}/active")
    public AuthDtos.UserProfileResponse updateActive(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.UpdateActiveRequest request
    ) {
        return adminService.updateUserActive(admin, id, request.active());
    }

    @PostMapping("/lockers")
    public ResponseEntity<LockerController.LockerView> createLocker(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody AdminDtos.CreateLockerRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createLocker(admin, request));
    }

    @PostMapping("/lockers/{lockerId}/compartments")
    public ResponseEntity<LockerController.LockerView> addCompartment(
            @AuthenticationPrincipal User admin,
            @PathVariable String lockerId,
            @Valid @RequestBody AdminDtos.UpdateCompartmentSizeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.addCompartment(admin, lockerId, request.size()));
    }

    @PatchMapping("/lockers/{lockerId}/compartments/{number}/size")
    public LockerController.LockerView updateCompartmentSize(
            @AuthenticationPrincipal User admin,
            @PathVariable String lockerId,
            @PathVariable Integer number,
            @Valid @RequestBody AdminDtos.UpdateCompartmentSizeRequest request
    ) {
        return adminService.updateCompartmentSize(admin, lockerId, number, request.size());
    }
}
