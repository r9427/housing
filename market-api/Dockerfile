FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package
COPY docker/HealthCheck.java /tmp/HealthCheck.java
RUN javac /tmp/HealthCheck.java

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/market-api.jar app.jar
COPY --from=build /tmp/HealthCheck.class HealthCheck.class

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=12 CMD ["java", "-cp", "/app", "HealthCheck"]

ENTRYPOINT ["java", "-jar", "app.jar"]
