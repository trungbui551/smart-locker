package com.smartlocker.mqtt;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Bản giả lập MqttPublisher dùng trong môi trường kiểm thử (app.mqtt.enabled=false),
 * ghi lại các lệnh đã gửi để unit test kiểm chứng mà không cần chạy Mosquitto.
 */
@Component
@ConditionalOnProperty(name = "app.mqtt.enabled", havingValue = "false")
public class NoOpMqttPublisher implements MqttPublisher {

    public record PublishedOpen(String lockerId, int compartmentNumber, String correlationId) {
    }

    private final List<PublishedOpen> sentCommands = new CopyOnWriteArrayList<>();

    @Override
    public void publishOpenCommand(String lockerId, int compartmentNumber, String correlationId) {
        sentCommands.add(new PublishedOpen(lockerId, compartmentNumber, correlationId));
    }

    @Override
    public boolean isConnected() {
        return true;
    }

    public List<PublishedOpen> getSentCommands() {
        return sentCommands;
    }

    public void clear() {
        sentCommands.clear();
    }
}
