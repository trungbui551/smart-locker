package com.smartlocker.mqtt;

/**
 * Cổng gửi lệnh mở ngăn qua MQTT (tách interface để test không cần Mosquitto thật).
 */
public interface MqttPublisher {

    void publishOpenCommand(String lockerId, int compartmentNumber, String correlationId);

    void publishDisplayMessage(String lockerId, String line1, String line2);

    boolean isConnected();
}
