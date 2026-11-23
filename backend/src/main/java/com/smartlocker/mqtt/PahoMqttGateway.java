package com.smartlocker.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/**
 * Kết nối MQTT thực tế bằng Eclipse Paho MQTTv3 tới Mosquitto (local hoặc broker online có xác thực).
 * Tuân thủ đúng topic & payload JSON trong docs/mqtt-contract.md.
 */
@Component
@ConditionalOnProperty(name = "app.mqtt.enabled", havingValue = "true", matchIfMissing = true)
public class PahoMqttGateway implements MqttPublisher, MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(PahoMqttGateway.class);

    private final MqttEventHandler eventHandler;
    private final ObjectMapper objectMapper;
    private final String brokerUrl;
    private final String username;
    private final String password;
    private final String topicPrefix;

    private MqttClient client;

    public PahoMqttGateway(
            @Lazy MqttEventHandler eventHandler,
            ObjectMapper objectMapper,
            @Value("${app.mqtt.broker-url:tcp://localhost:1883}") String brokerUrl,
            @Value("${app.mqtt.username:}") String username,
            @Value("${app.mqtt.password:}") String password,
            @Value("${app.mqtt.topic-prefix:}") String topicPrefix
    ) {
        this.eventHandler = eventHandler;
        this.objectMapper = objectMapper;
        this.brokerUrl = normalizeBrokerUrl(brokerUrl);
        this.username = username;
        this.password = password;
        this.topicPrefix = normalizePrefix(topicPrefix);
    }

    @PostConstruct
    public void start() {
        try {
            String clientId = "smart-locker-backend-" + UUID.randomUUID().toString().substring(0, 8);
            client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            client.setCallback(this);

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(5);
            options.setKeepAliveInterval(20);
            if (!username.isBlank()) {
                options.setUserName(username);
                options.setPassword(password.toCharArray());
            }

            client.connect(options);
            subscribeTopics();
            log.info("Da ket noi MQTT broker tai {} (prefix='{}')", brokerUrl, topicPrefix);
        } catch (Exception ex) {
            log.warn("Chua ket noi duoc MQTT broker tai {}: {} (se tu ket noi lai)", brokerUrl, ex.getMessage());
        }
    }

    @PreDestroy
    public void stop() {
        if (client != null) {
            try {
                if (client.isConnected()) {
                    client.disconnect();
                }
                client.close();
            } catch (MqttException ignored) {
            }
        }
    }

    @Override
    public void publishOpenCommand(String lockerId, int compartmentNumber, String correlationId) {
        if (!isConnected()) {
            throw new IllegalStateException("Mất kết nối MQTT tới hệ thống tủ khóa. Vui lòng thử lại sau.");
        }
        try {
            String topic = topicPrefix + "locker/" + lockerId + "/cmd/open";
            String payload = objectMapper.writeValueAsString(Map.of(
                    "compartment", compartmentNumber,
                    "correlationId", correlationId
            ));
            MqttMessage msg = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
            msg.setQos(1);
            client.publish(topic, msg);
            log.info("Da gui MQTT {} -> {}", topic, payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể gửi lệnh mở tủ qua MQTT: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void publishDisplayMessage(String lockerId, String line1, String line2) {
        if (!isConnected()) {
            return;
        }
        try {
            String topic = topicPrefix + "locker/" + lockerId + "/display";
            String payload = objectMapper.writeValueAsString(Map.of(
                    "line1", line1 == null ? "" : line1,
                    "line2", line2 == null ? "" : line2
            ));
            MqttMessage msg = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
            msg.setQos(0);
            client.publish(topic, msg);
            log.info("Da gui thong bao LCD {} -> {}", topic, payload);
        } catch (Exception ex) {
            log.warn("Khong the gui thong bao LCD toi {}: {}", lockerId, ex.getMessage());
        }
    }

    @Override
    public boolean isConnected() {
        return client != null && client.isConnected();
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        if (reconnect) {
            log.info("Da tu ket noi lai MQTT broker {}", serverURI);
            subscribeTopics();
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("Mat ket noi MQTT: {}", cause != null ? cause.getMessage() : "unknown");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        try {
            String stripped = topicPrefix.isEmpty() ? topic : topic.replaceFirst("^" + topicPrefix, "");
            String[] parts = stripped.split("/");
            if (parts.length < 3 || !"locker".equals(parts[0])) {
                return;
            }
            String lockerId = parts[1];
            String channel = parts[2];
            String raw = new String(message.getPayload(), StandardCharsets.UTF_8).replace("\uFEFF", "").trim();

            if (parts.length == 3 && "heartbeat".equals(channel)) {
                eventHandler.handleHeartbeat(lockerId);
            } else if (parts.length == 3 && "event".equals(channel)) {
                JsonNode node = objectMapper.readTree(raw);
                String type = node.has("type") ? node.get("type").asText() : null;
                Integer compartment = node.has("compartment") ? node.get("compartment").asInt() : null;
                String correlationId = node.has("correlationId") ? node.get("correlationId").asText() : null;
                eventHandler.handleEvent(lockerId, type, compartment, correlationId);
            } else if (parts.length == 4 && "otp".equals(channel) && "submit".equals(parts[3])) {
                JsonNode node = objectMapper.readTree(raw);
                String otp = node.has("otp") ? node.get("otp").asText() : "";
                eventHandler.handleKeypadOtpSubmit(lockerId, otp);
            }
        } catch (Exception ex) {
            log.error("Loi xu ly tin nhan MQTT tren topic {}: {}", topic, ex.getMessage());
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Không cần xử lý thêm
    }

    private void subscribeTopics() {
        if (!isConnected()) {
            return;
        }
        try {
            client.subscribe(topicPrefix + "locker/+/event", 1);
            client.subscribe(topicPrefix + "locker/+/heartbeat", 0);
            client.subscribe(topicPrefix + "locker/+/otp/submit", 1);
        } catch (MqttException ex) {
            log.error("Khong the subscribe MQTT topic: {}", ex.getMessage());
        }
    }

    // Chuẩn hóa địa chỉ broker: tự thêm ssl:// cho cổng 8883 hoặc đổi mqtts:// -> ssl:// cho Eclipse Paho
    private String normalizeBrokerUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return "tcp://localhost:1883";
        }
        String url = raw.trim();
        if (url.startsWith("mqtts://")) {
            return "ssl://" + url.substring("mqtts://".length());
        }
        if (url.startsWith("mqtt://")) {
            return "tcp://" + url.substring("mqtt://".length());
        }
        if (!url.contains("://")) {
            return url.endsWith(":8883") ? "ssl://" + url : "tcp://" + url;
        }
        return url;
    }

    private String normalizePrefix(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String clean = raw.trim();
        return clean.endsWith("/") ? clean : clean + "/";
    }
}
