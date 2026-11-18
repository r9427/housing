FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/target/market-api.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=12 CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
