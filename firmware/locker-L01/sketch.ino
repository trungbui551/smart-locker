/*
 * Smart Locker — Firmware ESP32 nâng cấp (Bàn phím 4x4 + LCD 16x2 + Servo + 6 LED + 2 nút)
 * Tuân thủ đầy đủ hợp đồng MQTT tại docs/mqtt-contract.md:
 *   - Subscribe: {prefix}locker/{LOCKER_ID}/cmd/open    -> Bật LED + xoay Servo 90° + báo door_opened
 *   - Subscribe: {prefix}locker/{LOCKER_ID}/display     -> Hiện thông báo lên màn hình LCD 16x2
 *   - Publish:   {prefix}locker/{LOCKER_ID}/otp/submit  -> Gửi 6 số OTP bấm trên bàn phím 4x4 + '#'
 *   - Publish:   {prefix}locker/{LOCKER_ID}/event       -> door_opened | door_closed | fault
 *   - Publish:   {prefix}locker/{LOCKER_ID}/heartbeat   -> Nhịp sống định kỳ
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <ESP32Servo.h>
#include <time.h>
#include "config.h"

// 6 đèn LED đại diện khóa điện 6 ngăn: 1-2 (Nhỏ), 3-4 (Vừa), 5-6 (Lớn)
const int COMPARTMENT_PINS[6] = {13, 12, 14, 27, 26, 25};
const int SERVO_PIN = 23;           // Động cơ Servo mô phỏng chốt khóa cơ (0° = khóa, 90° = mở)
const int BTN_CLOSE_DOOR_PIN = 32;  // Nút xanh lá: cảm biến đóng cửa
const int BTN_FAULT_PIN = 33;       // Nút đỏ: giả lập lỗi cửa (fault)

// Cấu hình màn hình LCD 16x2 I2C (SDA=21, SCL=22)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Cấu hình động cơ Servo chốt khóa
Servo lockServo;

// Cấu hình bàn phím màng 4x4
const byte ROWS = 4;
const byte COLS = 4;
char KEY_MAP[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte ROW_PINS[ROWS] = {19, 18, 5, 17};
byte COL_PINS[COLS] = {16, 4, 15, 2};
Keypad keypad = Keypad(makeKeymap(KEY_MAP), ROW_PINS, COL_PINS, ROWS, COLS);

WiFiClient plainClient;
WiFiClientSecure tlsClient;
PubSubClient mqttClient;

// Trạng thái ngăn đang mở và chuỗi OTP đang bấm trên bàn phím
int activeCompartment = -1;
String activeCorrelationId = "";
String typedOtp = "";
unsigned long lcdMessageUntilMs = 0;

unsigned long lastHeartbeatMs = 0;
unsigned long lastReconnectAttemptMs = 0;
unsigned long lastClosePressMs = 0;
unsigned long lastFaultPressMs = 0;

String topicCmdOpen;
String topicDisplay;
String topicOtpSubmit;
String topicEvent;
String topicHeartbeat;

void showLcd(const String& line1, const String& line2, unsigned long holdMs = 0) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
  lcdMessageUntilMs = holdMs > 0 ? (millis() + holdMs) : 0;
}

void showIdleLcd() {
  if (activeCompartment >= 1) {
    showLcd("DANG MO NGAN #" + String(activeCompartment), "Bam nut XANH!");
  } else if (typedOtp.length() > 0) {
    String stars = "";
    for (unsigned int i = 0; i < typedOtp.length(); i++) stars += "*";
    showLcd("Nhap OTP + #:", stars + " (" + String(typedOtp.length()) + "/6)");
  } else {
    showLcd("SmartLocker " + String(LOCKER_ID), "Nhap 6 so + #");
  }
}

String currentIsoTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 10)) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buf);
  }
  return "2026-11-22T00:00:00Z";
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

void submitTypedOtp() {
  if (typedOtp.length() != 6) {
    showLcd("Can du 6 chu so", "Bam * de xoa", 2000);
    return;
  }
  StaticJsonDocument<128> doc;
  doc["otp"] = typedOtp;
  doc["ts"] = currentIsoTimestamp();

  String payload;
  serializeJson(doc, payload);
  mqttClient.publish(topicOtpSubmit.c_str(), payload.c_str());
  Serial.printf("[%s] Da gui OTP tu ban phim len Backend de kiem tra...\n", LOCKER_ID);
  typedOtp = "";
  showLcd("Dang kiem tra", "Vui long cho...", 3000);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String raw;
  raw.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    raw += (char)payload[i];
  }
  String topicStr = String(topic);
  Serial.printf("[%s] Nhan lenh tren %s: %s\n", LOCKER_ID, topic, raw.c_str());

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, raw)) {
    Serial.printf("[%s] JSON khong hop le!\n", LOCKER_ID);
    return;
  }

  // Nhận thông báo hiển thị lên LCD (ví dụ: SAI MA OTP!)
  if (topicStr == topicDisplay) {
    String l1 = doc["line1"] | "Thong bao";
    String l2 = doc["line2"] | "";
    showLcd(l1, l2, 3000);
    return;
  }

  // Nhận lệnh mở ngăn từ Backend (cmd/open)
  int compartment = doc["compartment"] | -1;
  String correlationId = doc["correlationId"] | "";
  if (compartment < 1 || compartment > 6) {
    return;
  }

  // Bật đèn LED ngăn tương ứng + xoay chốt Servo 90 độ (MỞ KHÓA)
  digitalWrite(COMPARTMENT_PINS[compartment - 1], HIGH);
  lockServo.write(90);
  activeCompartment = compartment;
  activeCorrelationId = correlationId;
  typedOtp = "";

  showLcd("MO NGAN #" + String(compartment) + "!", "Dong cua khi xong");
  Serial.printf("[%s] >>> DA MO NGAN #%d (Servo 90° + LED ON)!\n", LOCKER_ID, compartment);

  publishEvent("door_opened", compartment, correlationId);
}

void connectWifi() {
  showLcd("Dang noi Wi-Fi", WIFI_SSID);
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
  showLcd("Dang noi MQTT", "EMQX Cloud TLS...");
  String clientId = String("esp32-") + LOCKER_ID + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  bool connected = strlen(MQTT_USER) > 0
      ? mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)
      : mqttClient.connect(clientId.c_str());

  if (connected) {
    mqttClient.subscribe(topicCmdOpen.c_str(), 1);
    mqttClient.subscribe(topicDisplay.c_str(), 0);
    Serial.printf("[%s] Ket noi MQTT THANH CONG! Lang nghe: %s\n", LOCKER_ID, topicCmdOpen.c_str());
    publishHeartbeat();
    lastHeartbeatMs = millis();
    showIdleLcd();
  } else {
    Serial.printf("[%s] Ket noi MQTT that bai (ma=%d)\n", LOCKER_ID, mqttClient.state());
    showLcd("Loi ket noi MQTT", "Thu lai sau 5s");
  }
  return connected;
}

void triggerDoorClosed() {
  if (activeCompartment < 1) {
    showLcd("Khong co ngan mo", "Nhap 6 so + #", 1500);
    return;
  }
  int comp = activeCompartment;
  String corr = activeCorrelationId;

  // Tắt đèn LED + xoay chốt Servo về 0 độ (KHÓA LẠI)
  digitalWrite(COMPARTMENT_PINS[comp - 1], LOW);
  lockServo.write(0);
  activeCompartment = -1;
  activeCorrelationId = "";

  showLcd("DA DONG NGAN #" + String(comp), "Cam on quy khach", 2500);
  Serial.printf("[%s] <<< DA DONG NGAN #%d (Servo 0° + LED OFF).\n", LOCKER_ID, comp);
  publishEvent("door_closed", comp, corr);
}

void triggerDoorFault() {
  int comp = activeCompartment >= 1 ? activeCompartment : 5;
  showLcd("CANH BAO LOI!", "Ngan #" + String(comp) + " fault", 3000);
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
  pinMode(BTN_CLOSE_DOOR_PIN, INPUT_PULLUP);
  pinMode(BTN_FAULT_PIN, INPUT_PULLUP);

  // Khởi tạo LCD 16x2 I2C và Servo ở vị trí khóa (0°)
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lockServo.attach(SERVO_PIN);
  lockServo.write(0);

  String prefix = String(MQTT_TOPIC_PREFIX);
  topicCmdOpen = prefix + "locker/" + LOCKER_ID + "/cmd/open";
  topicDisplay = prefix + "locker/" + LOCKER_ID + "/display";
  topicOtpSubmit = prefix + "locker/" + LOCKER_ID + "/otp/submit";
  topicEvent = prefix + "locker/" + LOCKER_ID + "/event";
  topicHeartbeat = prefix + "locker/" + LOCKER_ID + "/heartbeat";

  connectWifi();

  if (MQTT_USE_TLS) {
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
    if (now - lastReconnectAttemptMs > 5000) {
      lastReconnectAttemptMs = now;
      connectMqtt();
    }
    return;
  }

  mqttClient.loop();

  // Quay lại màn hình chờ sau khi hết thời gian hiện thông báo tạm trên LCD
  if (lcdMessageUntilMs > 0 && now >= lcdMessageUntilMs) {
    lcdMessageUntilMs = 0;
    showIdleLcd();
  }

  // Gửi heartbeat định kỳ
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    publishHeartbeat();
  }

  // Đọc phím bấm trên bàn phím màng 4x4
  char key = keypad.getKey();
  if (key) {
    if (key >= '0' && key <= '9') {
      if (typedOtp.length() < 6) {
        typedOtp += key;
        showIdleLcd();
      }
    } else if (key == '*') {
      typedOtp = "";
      showLcd("Da xoa ma OTP", "Nhap 6 so + #", 1000);
    } else if (key == '#') {
      submitTypedOtp();
    }
  }

  // Nút xanh lá: đóng cửa
  if (digitalRead(BTN_CLOSE_DOOR_PIN) == LOW && now - lastClosePressMs > 400) {
    lastClosePressMs = now;
    triggerDoorClosed();
  }

  // Nút đỏ: giả lập lỗi fault
  if (digitalRead(BTN_FAULT_PIN) == LOW && now - lastFaultPressMs > 400) {
    lastFaultPressMs = now;
    triggerDoorFault();
  }

  // Hỗ trợ gõ lệnh trong Serial Monitor
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("close")) triggerDoorClosed();
    else if (cmd.equalsIgnoreCase("fault")) triggerDoorFault();
  }
}
