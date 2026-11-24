package com.smartlocker.mqtt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface LockerCommandRepository extends JpaRepository<LockerCommand, String> {

    List<LockerCommand> findByStatusAndCreatedAtBefore(CommandStatus status, Instant cutoff);
}
