@echo off
echo ========================================================
echo Launching SecureBank Full-Stack (Backend + Frontend)...
echo ========================================================
start "SecureBank Backend (Port 8080)" cmd /k "%~dp0start-backend.bat"
timeout /t 5 /nobreak >nul
start "SecureBank Frontend (Port 5173)" cmd /k "%~dp0start-frontend.bat"
echo Services are starting in separate windows!
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
pause
