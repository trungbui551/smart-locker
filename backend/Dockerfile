# Multi-stage Dockerfile cho Backend Spring Boot 3 (Java 21)
# Giai đoạn 1: Dùng ảnh maven:3.9-eclipse-temurin-21-alpine (có sẵn Maven, không bị lỗi 429 khi tải mvnw trên Render)
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng bằng ảnh JRE siêu gọn (tối ưu RAM cho gói Render miễn phí 512MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cài đặt múi giờ Việt Nam cho container
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
