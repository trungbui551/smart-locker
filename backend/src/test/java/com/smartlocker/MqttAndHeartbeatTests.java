package com.smartlocker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlocker.audit.AuditEventRepository;
import com.smartlocker.delivery.DeliveryRepository;
import com.smartlocker.delivery.DeliveryStatus;
import com.smartlocker.locker.CompartmentRepository;
import com.smartlocker.locker.CompartmentStatus;
import com.smartlocker.locker.Locker;
import com.smartlocker.locker.LockerRepository;
import com.smartlocker.locker.LockerStatus;
import com.smartlocker.mqtt.CommandStatus;
import com.smartlocker.mqtt.LockerCommand;
import com.smartlocker.mqtt.LockerCommandRepository;
import com.smartlocker.mqtt.LockerCommandService;
import com.smartlocker.mqtt.MqttEventHandler;
import com.smartlocker.mqtt.NoOpMqttPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.lang.reflect.Field;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử M4:
 * - Luồng gửi hàng & lấy hàng đầy đủ qua sự kiện MQTT door_opened -> door_closed
 * - Bỏ qua sự kiện gửi trùng correlationId
 * - Quá 10 giây không nhận door_opened -> lệnh TIMED_OUT và KHÔNG đổi trạng thái đơn
 * - Sự kiện fault -> đánh dấu ngăn FAULT
 * - Mất 3 heartbeat liên tiếp -> tủ OFFLINE; có heartbeat lại -> tủ ONLINE
 * - Nhân viên vận hành mở ngăn thủ công có ghi nhật ký
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MqttAndHeartbeatTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NoOpMqttPublisher mqttPublisher;

    @Autowired
    private MqttEventHandler mqttEventHandler;

    @Autowired
    private LockerCommandService commandService;

    @Autowired
    private LockerCommandRepository commandRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private LockerRepository lockerRepository;

    @Autowired
    private CompartmentRepository compartmentRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Test
    void fullDropoffAndPickupFlowViaMqttEventsAndIgnoreDuplicates() throws Exception {
        mqttPublisher.clear();
        String adminToken = login("admin", "Locker@123");
        String courierToken = login("courier", "Locker@123");
        String recipientToken = login("recipient", "Locker@123");

        // Tạo tủ riêng L40 cho bài test MQTT
        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L40\",\"name\":\"Tủ MQTT Test\",\"location\":\"Lab\"}"))
                .andExpect(status().isCreated());

        // 1. Shipper cấp ngăn -> tự động gửi lệnh MQTT cmd/open kèm correlationId
        MvcResult createRes = mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"L40\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"SMALL\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correlationId").isNotEmpty())
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long deliveryId = createdJson.get("id").asLong();
        int compNum = createdJson.get("compartmentNumber").asInt();
        String dropoffCorrelationId = createdJson.get("correlationId").asText();

        assertThat(mqttPublisher.getSentCommands())
                .anyMatch(c -> c.lockerId().equals("L40") && c.correlationId().equals(dropoffCorrelationId));

        // 2. Giả lập tủ gửi door_opened (và gửi trùng lần 2 -> phải bỏ qua an toàn)
        mqttEventHandler.handleEvent("L40", "door_opened", compNum, dropoffCorrelationId);
        mqttEventHandler.handleEvent("L40", "door_opened", compNum, dropoffCorrelationId);
        assertThat(commandRepository.findById(dropoffCorrelationId).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.OPENED);

        // 3. Giả lập tủ gửi door_closed -> đơn tự chuyển READY và tự sinh OTP
        mqttEventHandler.handleEvent("L40", "door_closed", compNum, dropoffCorrelationId);
        assertThat(deliveryRepository.findById(deliveryId).orElseThrow().getStatus())
                .isEqualTo(DeliveryStatus.READY);

        // 4. Người nhận lấy OTP và xác thực -> tự động gửi lệnh MQTT mở ngăn lấy hàng
        MvcResult otpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn();
        String plainOtp = objectMapper.readTree(otpRes.getResponse().getContentAsString()).get("otpCode").asText();

        MvcResult verifyRes = mockMvc.perform(post("/api/deliveries/" + deliveryId + "/otp/verify")
                        .header("Authorization", "Bearer " + recipientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + plainOtp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correlationId").isNotEmpty())
                .andReturn();
        String pickupCorrelationId = objectMapper.readTree(verifyRes.getResponse().getContentAsString())
                .get("correlationId").asText();

        // 5. Giả lập tủ gửi door_opened -> door_closed cho lần lấy hàng -> đơn PICKED_UP & ngăn về FREE
        mqttEventHandler.handleEvent("L40", "door_opened", compNum, pickupCorrelationId);
        mqttEventHandler.handleEvent("L40", "door_closed", compNum, pickupCorrelationId);

        assertThat(deliveryRepository.findById(deliveryId).orElseThrow().getStatus())
                .isEqualTo(DeliveryStatus.PICKED_UP);
        assertThat(compartmentRepository.findByLockerIdAndNumber("L40", compNum).orElseThrow().getStatus())
                .isEqualTo(CompartmentStatus.FREE);
    }

    @Test
    void openTimeoutAfter10sDoesNotChangeDeliveryStatusAndFaultMarksCompartment() throws Exception {
        String adminToken = login("admin", "Locker@123");
        String courierToken = login("courier", "Locker@123");

        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L41\",\"name\":\"Tủ Timeout Fault\",\"location\":\"Lab\"}"))
                .andExpect(status().isCreated());

        MvcResult createRes = mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"L41\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"MEDIUM\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long deliveryId = json.get("id").asLong();
        String correlationId = json.get("correlationId").asText();

        // Đẩy createdAt của lệnh về 15 giây trước -> chạy expireTimedOutCommands()
        LockerCommand cmd = commandRepository.findById(correlationId).orElseThrow();
        Field createdAtField = LockerCommand.class.getDeclaredField("createdAt");
        createdAtField.setAccessible(true);
        createdAtField.set(cmd, Instant.now().minusSeconds(15));
        commandRepository.save(cmd);

        int timedOut = commandService.expireTimedOutCommands();
        assertThat(timedOut).isGreaterThanOrEqualTo(1);
        assertThat(commandRepository.findById(correlationId).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.TIMED_OUT);
        // Trạng thái đơn KHÔNG bị đổi sang READY
        assertThat(deliveryRepository.findById(deliveryId).orElseThrow().getStatus())
                .isEqualTo(DeliveryStatus.STORING);

        // Giả lập tủ gửi sự kiện fault ở ngăn #5 -> ngăn chuyển FAULT
        mqttEventHandler.handleEvent("L41", "fault", 5, null);
        assertThat(compartmentRepository.findByLockerIdAndNumber("L41", 5).orElseThrow().getStatus())
                .isEqualTo(CompartmentStatus.FAULT);
    }

    @Test
    void missingThreeHeartbeatsMarksOfflineAndHeartbeatRestoresOnline() throws Exception {
        String adminToken = login("admin", "Locker@123");
        String operatorToken = login("operator", "Locker@123");

        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L42\",\"name\":\"Tủ Heartbeat\",\"location\":\"Lab\"}"))
                .andExpect(status().isCreated());

        // Đẩy lastHeartbeatAt về 40 giây trước (> 3 * 10s) -> chuyển OFFLINE
        Locker locker = lockerRepository.findById("L42").orElseThrow();
        locker.setLastHeartbeatAt(Instant.now().minusSeconds(40));
        lockerRepository.save(locker);

        commandService.detectOfflineLockers();
        assertThat(lockerRepository.findById("L42").orElseThrow().getStatus()).isEqualTo(LockerStatus.OFFLINE);

        // Nhận heartbeat mới -> tự trở về ONLINE
        mqttEventHandler.handleHeartbeat("L42");
        assertThat(lockerRepository.findById("L42").orElseThrow().getStatus()).isEqualTo(LockerStatus.ONLINE);

        // Nhân viên vận hành mở ngăn thủ công có ghi nhật ký MANUAL_OPEN
        mockMvc.perform(post("/api/operator/lockers/L42/compartments/1/open")
                        .header("Authorization", "Bearer " + operatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Kiểm tra cửa ngăn 1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purpose").value("MANUAL"));

        assertThat(auditEventRepository.findAll())
                .anyMatch(e -> "MANUAL_OPEN".equals(e.getAction()) && e.getDetail().contains("L42"));
    }

    @Test
    void keypadOtpSubmitOpensCompartmentWhenValidAndDisplaysErrorWhenInvalid() throws Exception {
        mqttPublisher.clear();
        String adminToken = login("admin", "Locker@123");
        String courierToken = login("courier", "Locker@123");
        String recipientToken = login("recipient", "Locker@123");

        mockMvc.perform(post("/api/admin/lockers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"L43\",\"name\":\"Tủ Bàn Phím\",\"location\":\"Lab\"}"))
                .andExpect(status().isCreated());

        MvcResult createRes = mockMvc.perform(post("/api/deliveries")
                        .header("Authorization", "Bearer " + courierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lockerId\":\"L43\",\"recipientIdentifier\":\"recipient\",\"packageSize\":\"SMALL\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode created = objectMapper.readTree(createRes.getResponse().getContentAsString());
        long deliveryId = created.get("id").asLong();
        String dropCorr = created.get("correlationId").asText();

        // Hoàn tất gửi hàng -> đơn chuyển READY + có OTP
        mqttEventHandler.handleEvent("L43", "door_opened", 1, dropCorr);
        mqttEventHandler.handleEvent("L43", "door_closed", 1, dropCorr);

        MvcResult otpRes = mockMvc.perform(get("/api/deliveries/" + deliveryId + "/otp")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn();
        String validOtp = objectMapper.readTree(otpRes.getResponse().getContentAsString()).get("otpCode").asText();
        String wrongOtp = validOtp.equals("123456") ? "654321" : "123456";

        mqttPublisher.clear();

        // Nhập sai trên bàn phím tủ -> gửi thông báo lỗi lên màn hình LCD
        mqttEventHandler.handleKeypadOtpSubmit("L43", wrongOtp);
        assertThat(mqttPublisher.getSentCommands()).isEmpty();
        assertThat(mqttPublisher.getDisplayMessages())
                .anyMatch(m -> m.lockerId().equals("L43") && m.line1().contains("SAI MA OTP"));

        // Nhập đúng 6 số trên bàn phím tủ -> tự gửi lệnh cmd/open cho ngăn #1
        mqttEventHandler.handleKeypadOtpSubmit("L43", validOtp);
        assertThat(mqttPublisher.getSentCommands())
                .anyMatch(c -> c.lockerId().equals("L43") && c.compartmentNumber() == 1);
    }

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
