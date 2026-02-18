# Dockerfile - Backend Spring Boot XELLE
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /build

COPY src/backend/pom.xml ./pom.xml
COPY src/backend/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
    CMD ["sh", "-c", "wget -qO- http://localhost:8080/health >/dev/null 2>&1 || exit 1"]

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
