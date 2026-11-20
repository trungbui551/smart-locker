package com.smartlocker.locker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Nạp sẵn dữ liệu mẫu 2 tủ (L01, L02), mỗi tủ 6 ngăn (2 Nhỏ, 2 Vừa, 2 Lớn) khi chạy local.
 */
@Component
@ConditionalOnProperty(name = "app.seed-demo-users", havingValue = "true")
public class DemoLockerSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoLockerSeeder.class);

    private final LockerRepository lockerRepository;
    private final CompartmentRepository compartmentRepository;

    public DemoLockerSeeder(LockerRepository lockerRepository, CompartmentRepository compartmentRepository) {
        this.lockerRepository = lockerRepository;
        this.compartmentRepository = compartmentRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedLockerIfAbsent("L01", "Tủ Sảnh A — Chung cư Bình An", "Tầng 1, cạnh quầy lễ tân Tháp A");
        seedLockerIfAbsent("L02", "Tủ Sảnh B — Khu Học vụ", "Sảnh chính tòa nhà B1");
    }

    private void seedLockerIfAbsent(String id, String name, String location) {
        if (lockerRepository.existsById(id)) {
            return;
        }
        Locker locker = new Locker();
        locker.setId(id);
        locker.setName(name);
        locker.setLocation(location);
        locker.setStatus(LockerStatus.ONLINE);
        locker.setLastHeartbeatAt(Instant.now());
        lockerRepository.save(locker);

        List<CompartmentSize> defaultSizes = List.of(
                CompartmentSize.SMALL, CompartmentSize.SMALL,
                CompartmentSize.MEDIUM, CompartmentSize.MEDIUM,
                CompartmentSize.LARGE, CompartmentSize.LARGE
        );
        for (int i = 0; i < defaultSizes.size(); i++) {
            Compartment comp = new Compartment();
            comp.setLocker(locker);
            comp.setNumber(i + 1);
            comp.setSize(defaultSizes.get(i));
            comp.setStatus(CompartmentStatus.FREE);
            compartmentRepository.save(comp);
        }
        log.info("Da khoi tao tu mau {} gom 6 ngan (2 Nho, 2 Vua, 2 Lon)", id);
    }
}
