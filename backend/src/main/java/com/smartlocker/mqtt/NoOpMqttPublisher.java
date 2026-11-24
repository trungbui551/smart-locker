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

    public record PublishedDisplay(String lockerId, String line1, String line2) {
    }

    private final List<PublishedOpen> sentCommands = new CopyOnWriteArrayList<>();
    private final List<PublishedDisplay> displayMessages = new CopyOnWriteArrayList<>();

    @Override
    public void publishOpenCommand(String lockerId, int compartmentNumber, String correlationId) {
        sentCommands.add(new PublishedOpen(lockerId, compartmentNumber, correlationId));
    }

    @Override
    public void publishDisplayMessage(String lockerId, String line1, String line2) {
        displayMessages.add(new PublishedDisplay(lockerId, line1, line2));
    }

    @Override
    public boolean isConnected() {
        return true;
    }

    public List<PublishedOpen> getSentCommands() {
        return sentCommands;
    }

    public List<PublishedDisplay> getDisplayMessages() {
        return displayMessages;
    }

    public void clear() {
        sentCommands.clear();
        displayMessages.clear();
    }
}
