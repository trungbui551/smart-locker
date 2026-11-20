package com.smartlocker.locker;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LockerRepository extends JpaRepository<Locker, String> {
}
