package com.smartlocker.locker;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * API xem danh sách tủ và số ngăn trống theo kích cỡ (dùng cho Shipper, Vận hành, Admin).
 */
@RestController
@RequestMapping("/api/lockers")
public class LockerController {

    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;

    public LockerController(LockerRepository lockerRepository, CompartmentRepository compartmentRepository) {
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
    }

    @GetMapping
    public List<LockerView> listLockers() {
        return lockerRepository.findAll().stream()
                .map(locker -> {
                    List<Compartment> comps = compartmentRepository.findByLockerIdOrderByNumberAsc(locker.getId());
                    List<CompartmentView> compViews = comps.stream()
                            .map(c -> new CompartmentView(c.getId(), c.getNumber(), c.getSize(), c.getStatus()))
                            .toList();
                    long freeSmall = countFree(comps, CompartmentSize.SMALL);
                    long freeMedium = countFree(comps, CompartmentSize.MEDIUM);
                    long freeLarge = countFree(comps, CompartmentSize.LARGE);
                    return new LockerView(
                            locker.getId(),
                            locker.getName(),
                            locker.getLocation(),
                            locker.getStatus(),
                            locker.getLastHeartbeatAt(),
                            freeSmall,
                            freeMedium,
                            freeLarge,
                            compViews
                    );
                })
                .toList();
    }

    private long countFree(List<Compartment> comps, CompartmentSize size) {
        return comps.stream()
                .filter(c -> c.getStatus() == CompartmentStatus.FREE && c.getSize() == size)
                .count();
    }

    public record CompartmentView(Long id, Integer number, CompartmentSize size, CompartmentStatus status) {
    }

    public record LockerView(
            String id,
            String name,
            String location,
            LockerStatus status,
            Instant lastHeartbeatAt,
            long freeSmall,
            long freeMedium,
            long freeLarge,
            List<CompartmentView> compartments
    ) {
    }
}
