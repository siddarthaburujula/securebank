@echo off
echo ========================================================
echo Pushing SecureBank to GitHub: siddarthaburujula/securebank
echo ========================================================
set PATH=C:\Program Files\Git\cmd;%PATH%
cd /d "%~dp0"
git branch -M main
git push -u origin main
echo.
echo ========================================================
echo If prompted by Git Credential Manager, confirm login in your browser.
echo ========================================================
pause
