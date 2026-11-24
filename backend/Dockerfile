# Multi-stage Dockerfile cho Backend Spring Boot 3 (Java 21)
# Giai đoạn 1: Build file JAR bằng Maven Wrapper có sẵn trong repo
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY mvnw pom.xml ./
COPY .mvn ./.mvn
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src ./src
RUN ./mvnw -B clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng bằng ảnh JRE siêu gọn (tối ưu RAM cho gói Render miễn phí 512MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cài đặt múi giờ Việt Nam cho container
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
