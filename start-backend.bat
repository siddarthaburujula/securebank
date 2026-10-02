@echo off
echo ========================================================
echo Starting SecureBank Spring Boot 3 Backend on port 8080...
echo ========================================================
cd /d "%~dp0backend"
mvn spring-boot:run
pause
