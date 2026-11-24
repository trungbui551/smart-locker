# Multi-stage Dockerfile cho Backend Spring Boot 3 (Java 21)
# Giai đoạn 1: Dùng ảnh Maven có sẵn + Google Maven Central Mirror (Asia) để tránh lỗi 429 trên Render Singapore
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml maven-settings.xml ./
RUN mvn -B -s maven-settings.xml dependency:go-offline

COPY src ./src
RUN mvn -B -s maven-settings.xml clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng bằng ảnh JRE siêu gọn (tối ưu RAM cho gói Render miễn phí 512MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cài đặt múi giờ Việt Nam cho container
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
