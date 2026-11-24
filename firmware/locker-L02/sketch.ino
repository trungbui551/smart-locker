/*
 * Smart Locker — Firmware ESP32 mô phỏng trên Wokwi (6 ngăn: 2 Nhỏ, 2 Vừa, 2 Lớn)
 * Tuân thủ hợp đồng MQTT tại docs/mqtt-contract.md:
 *   - Subscribe: {prefix}locker/{LOCKER_ID}/cmd/open
 *   - Publish:   {prefix}locker/{LOCKER_ID}/event      (door_opened | door_closed | fault)
 *   - Publish:   {prefix}locker/{LOCKER_ID}/heartbeat  (định kỳ 10 giây)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

// Chân GPIO cho 6 đèn LED đại diện cho khóa điện 6 ngăn:
// Ngăn 1-2 (Nhỏ - Xanh dương), Ngăn 3-4 (Vừa - Cam), Ngăn 5-6 (Lớn - Xanh lá)
const int COMPARTMENT_PINS[6] = {13, 12, 14, 27, 26, 25};
const int STATUS_LED_PIN = 2;       // LED báo trạng thái kết nối MQTT
const int BTN_CLOSE_DOOR_PIN = 32;  // Nút xanh lá: mô phỏng cảm biến đóng cửa
const int BTN_FAULT_PIN = 33;       // Nút đỏ: mô phỏng lỗi cửa (fault)

WiFiClient plainClient;
WiFiClientSecure tlsClient;
PubSubClient mqttClient;

// Trạng thái ngăn đang mở hiện tại
int activeCompartment = -1;
String activeCorrelationId = "";

unsigned long lastHeartbeatMs = 0;
unsigned long lastReconnectAttemptMs = 0;
unsigned long lastClosePressMs = 0;
unsigned long lastFaultPressMs = 0;

String topicCmdOpen;
String topicEvent;
String topicHeartbeat;

// Tạo chuỗi thời gian chuẩn ISO-8601 (lấy từ NTP hoặc mốc giả lập nếu chưa kịp đồng bộ)
String currentIsoTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 10)) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
  }
  return "2026-11-20T00:00:00Z";
}

void publishEvent(const char* type, int compartment, const String& correlationId) {
  StaticJsonDocument<256> doc;
  doc["type"] = type;
  doc["compartment"] = compartment;
  if (correlationId.length() > 0) {
    doc["correlationId"] = correlationId;
  }
  doc["ts"] = currentIsoTimestamp();

  String payload;
  serializeJson(doc, payload);
  bool ok = mqttClient.publish(topicEvent.c_str(), payload.c_str());
  Serial.printf("[%s] Gui su kien %s (ngan #%d) -> %s\n", LOCKER_ID, type, compartment, ok ? "OK" : "LOI");
}

void publishHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["ts"] = currentIsoTimestamp();

  String payload;
  serializeJson(doc, payload);
  bool ok = mqttClient.publish(topicHeartbeat.c_str(), payload.c_str());
  Serial.printf("[%s] Gui heartbeat -> %s\n", LOCKER_ID, ok ? "OK" : "LOI");
}

// Xử lý lệnh mở ngăn nhận từ Backend trên topic locker/{LOCKER_ID}/cmd/open
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String raw;
  raw.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    raw += (char)payload[i];
  }
  Serial.printf("[%s] Nhan lenh tren %s: %s\n", LOCKER_ID, topic, raw.c_str());

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, raw);
  if (err) {
    Serial.printf("[%s] JSON khong hop le: %s\n", LOCKER_ID, err.c_str());
    return;
  }

  int compartment = doc["compartment"] | -1;
  String correlationId = doc["correlationId"] | "";

  if (compartment < 1 || compartment > 6) {
    Serial.printf("[%s] So ngan khong ton tai: %d\n", LOCKER_ID, compartment);
    return;
  }

  // Bật đèn LED mô phỏng mở khóa ngăn tương ứng
  digitalWrite(COMPARTMENT_PINS[compartment - 1], HIGH);
  activeCompartment = compartment;
  activeCorrelationId = correlationId;

  Serial.printf("[%s] >>> DA MO KHOA NGAN #%d! Hay bam nut XANH LA (Dong cua) sau khi bo/lay hang.\n",
                LOCKER_ID, compartment);

  // Phản hồi ngay door_opened kèm đúng correlationId (trong hạn 10 giây của Backend)
  publishEvent("door_opened", compartment, correlationId);
}

void connectWifi() {
  Serial.printf("[%s] Dang ket noi Wi-Fi %s", LOCKER_ID, WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(" THANH CONG!");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

bool connectMqtt() {
  String clientId = String("esp32-") + LOCKER_ID + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.printf("[%s] Dang ket noi MQTT %s:%d...\n", LOCKER_ID, MQTT_HOST, MQTT_PORT);

  bool connected;
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  } else {
    connected = mqttClient.connect(clientId.c_str());
  }

  if (connected) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    mqttClient.subscribe(topicCmdOpen.c_str(), 1);
    Serial.printf("[%s] Ket noi MQTT THANH CONG! Dang lang nghe: %s\n", LOCKER_ID, topicCmdOpen.c_str());
    publishHeartbeat();
    lastHeartbeatMs = millis();
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.printf("[%s] Ket noi MQTT that bai (ma loi=%d). Thu lai sau 5s...\n", LOCKER_ID, mqttClient.state());
  }
  return connected;
}

void triggerDoorClosed() {
  if (activeCompartment < 1) {
    Serial.printf("[%s] Khong co ngan nao dang mo de dong.\n", LOCKER_ID);
    return;
  }
  int comp = activeCompartment;
  String corr = activeCorrelationId;

  digitalWrite(COMPARTMENT_PINS[comp - 1], LOW);
  activeCompartment = -1;
  activeCorrelationId = "";

  Serial.printf("[%s] <<< DA DONG CUA NGAN #%d.\n", LOCKER_ID, comp);
  publishEvent("door_closed", comp, corr);
}

void triggerDoorFault() {
  int comp = activeCompartment >= 1 ? activeCompartment : 5;
  Serial.printf("[%s] !!! MO PHONG LOI CUA (FAULT) TAI NGAN #%d.\n", LOCKER_ID, comp);
  publishEvent("fault", comp, activeCorrelationId);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  for (int i = 0; i < 6; i++) {
    pinMode(COMPARTMENT_PINS[i], OUTPUT);
    digitalWrite(COMPARTMENT_PINS[i], LOW);
  }
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
  pinMode(BTN_CLOSE_DOOR_PIN, INPUT_PULLUP);
  pinMode(BTN_FAULT_PIN, INPUT_PULLUP);

  // Ghép topic theo tiền tố cấu hình trong config.h
  String prefix = String(MQTT_TOPIC_PREFIX);
  topicCmdOpen = prefix + "locker/" + LOCKER_ID + "/cmd/open";
  topicEvent = prefix + "locker/" + LOCKER_ID + "/event";
  topicHeartbeat = prefix + "locker/" + LOCKER_ID + "/heartbeat";

  connectWifi();

  if (MQTT_USE_TLS) {
    // Bỏ qua kiểm tra chứng chỉ gốc trong môi trường mô phỏng Wokwi để nối thẳng HiveMQ/EMQX Cloud TLS
    tlsClient.setInsecure();
    mqttClient.setClient(tlsClient);
  } else {
    mqttClient.setClient(plainClient);
  }
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
  mqttClient.setCallback(onMqttMessage);

  connectMqtt();
}

void loop() {
  unsigned long now = millis();

  if (!mqttClient.connected()) {
    digitalWrite(STATUS_LED_PIN, LOW);
    if (now - lastReconnectAttemptMs > 5000) {
      lastReconnectAttemptMs = now;
      connectMqtt();
    }
    return;
  }

  mqttClient.loop();

  // Gửi heartbeat định kỳ mỗi 10 giây
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    publishHeartbeat();
  }

  // Đọc nút bấm XANH LÁ (Đóng cửa) có chống dội phím 400ms
  if (digitalRead(BTN_CLOSE_DOOR_PIN) == LOW && now - lastClosePressMs > 400) {
    lastClosePressMs = now;
    triggerDoorClosed();
  }

  // Đọc nút bấm ĐỎ (Giả lập lỗi fault) có chống dội phím 400ms
  if (digitalRead(BTN_FAULT_PIN) == LOW && now - lastFaultPressMs > 400) {
    lastFaultPressMs = now;
    triggerDoorFault();
  }

  // Hỗ trợ gõ lệnh "close" hoặc "fault" trực tiếp trong Serial Monitor
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("close")) {
      triggerDoorClosed();
    } else if (cmd.equalsIgnoreCase("fault")) {
      triggerDoorFault();
    }
  }
}
