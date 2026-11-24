package com.smartlocker.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    List<PasswordResetToken> findByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);
}
