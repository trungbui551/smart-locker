package com.smartlocker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlocker.auth.User;
import com.smartlocker.auth.UserRepository;
import com.smartlocker.delivery.DeliveryDtos;
import com.smartlocker.delivery.DeliveryService;
import com.smartlocker.locker.CompartmentSize;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử M2:
 * - Admin quản lý tài khoản & cấu hình tủ/ngăn
 * - Shipper cấp ngăn đúng kích cỡ, báo lỗi khi hết ngăn đúng cỡ, chặn tủ OFFLINE
 * - 2 shipper gọi đồng thời KHÔNG bao giờ cấp trùng 1 ngăn
 * - Người nhận A không xem được đơn của Người nhận B
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LockerAndAllocationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LockerRepository lockerRepository;

    @Test
    void adminCanManageLockersAndUsersWhileNonAdminIsForbidden() throws Exception {
        String adminToken = login("admin", "Locker@123");
        String courierToken = login("courier", "Locker@123");

        // Shipper không được gọi API tạo tủ của Admin -> 403
        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L99\",\"name\":\"Tủ lậu\"}"))
                .andExpect(status().isForbidden());

        // Admin tạo tủ L03 (mặc định 6 ngăn), thêm ngăn #7 cỡ LARGE và đổi cỡ ngăn #1 sang MEDIUM
        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L03\",\"name\":\"Tủ Sảnh C\",\"location\":\"Tháp C\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("L03"))
                .andExpect(jsonPath("$.compartments.length()").value(6));

        mockMvc.perform(post("/api/admin/lockers/L03/compartments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"size\":\"LARGE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.compartments.length()").value(7));

        mockMvc.perform(patch("/api/admin/lockers/L03/compartments/1/size")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"size\":\"MEDIUM\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compartments[0].size").value("MEDIUM"));
    }

    @Test
    void allocateBySizeReportsFullAndBlocksOfflineLocker() throws Exception {
        String adminToken = login("admin", "Locker@123");
        String courierToken = login("courier", "Locker@123");

        // Tạo tủ riêng L10 (2 ngăn SMALL) để kiểm tra hết ngăn cỡ SMALL
        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L10\",\"name\":\"Tủ Test Full\",\"location\":\"Test\"}"))
                .andExpect(status().isCreated());

        String payload = "{\"lockerId\":\"L10\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"SMALL\"}";

        // Lần 1 & 2 thành công (ngăn 1 và ngăn 2)
        mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.compartmentNumber").value(1));

        mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.compartmentNumber").value(2));

        // Lần 3 hết ngăn cỡ Nhỏ -> báo lỗi rõ ràng 400
        mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tủ L10 đã hết ngăn trống cỡ Nhỏ."));

        // Đánh dấu tủ OFFLINE -> không cho cấp cỡ MEDIUM dù vẫn còn ngăn trống
        Locker locker = lockerRepository.findById("L10").orElseThrow();
        locker.setStatus(LockerStatus.OFFLINE);
        lockerRepository.save(locker);

        mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"L10\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"MEDIUM\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tủ L10 đang ngoại tuyến, không thể cấp ngăn mới."));
    }

    @Test
    void concurrentAllocationNeverAssignsSameCompartment() throws Exception {
        String adminToken = login("admin", "Locker@123");
        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L20\",\"name\":\"Tủ Đồng Thời\",\"location\":\"Test\"}"))
                .andExpect(status().isCreated());

        User courier = userRepository.findByUsernameIgnoreCase("courier").orElseThrow();
        DeliveryDtos.CreateDeliveryRequest req =
                new DeliveryDtos.CreateDeliveryRequest("L20", "recipient", CompartmentSize.MEDIUM);

        // Chạy 2 luồng xin ngăn cỡ MEDIUM cùng lúc trên tủ L20 (chỉ có 2 ngăn MEDIUM: #3 và #4)
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<DeliveryDtos.DeliveryResponse>> tasks = List.of(
                () -> deliveryService.allocateAndCreate(courier, req),
                () -> deliveryService.allocateAndCreate(courier, req)
        );
        List<Future<DeliveryDtos.DeliveryResponse>> futures = pool.invokeAll(tasks);
        pool.shutdown();

        Set<Integer> assignedNumbers = new HashSet<>();
        List<DeliveryDtos.DeliveryResponse> responses = new ArrayList<>();
        for (Future<DeliveryDtos.DeliveryResponse> f : futures) {
            DeliveryDtos.DeliveryResponse res = f.get();
            responses.add(res);
            assignedNumbers.add(res.compartmentNumber());
        }

        // Cả 2 shipper đều được cấp và 2 số ngăn PHẢI khác nhau hoàn toàn
        assertThat(responses).hasSize(2);
        assertThat(assignedNumbers).hasSize(2);
    }

    @Test
    void recipientACannotSeeRecipientBDelivery() throws Exception {
        // Tạo thêm người nhận B
        String regB = """
                {
                  "username": "recipient_b",
                  "email": "recipient_b@example.com",
                  "phone": "0977665544",
                  "fullName": "Người Nhận B",
                  "password": "Password@123"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regB))
                .andExpect(status().isCreated());

        String courierToken = login("courier", "Locker@123");
        String recipientBToken = login("recipient_b", "Password@123");

        // Shipper tạo đơn cho "recipient" (Người nhận A)
        MvcResult created = mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"L01\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"LARGE\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        long deliveryId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        // Người nhận B cố gọi xem chi tiết đơn của Người nhận A -> bị chặn 403
        mockMvc.perform(get("/api/deliveries/" + deliveryId)
                        .header("Authorization", "Bearer " + recipientBToken))
                .andExpect(status().isForbidden());
    }

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }
}
