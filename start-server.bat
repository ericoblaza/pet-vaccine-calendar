@echo off
echo ========================================
echo   PET VACCINE CALENDAR - SERVER
echo ========================================
echo.
echo Starting web server...
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Your app will be available at:
echo   Local:  http://localhost:8000
echo   Mobile: http://%IP%:8000
echo.
echo ========================================
echo   MOBILE ACCESS INSTRUCTIONS:
echo ========================================
echo 1. Make sure phone is on SAME WiFi
echo 2. Open Chrome on your phone
echo 3. Go to: http://%IP%:8000
echo 4. Tap menu (3 dots) ^> "Add to Home screen"
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python -m http.server 8000

if errorlevel 1 (
    echo.
    echo Python not found! Trying alternative method...
    echo.
    php -S localhost:8000
)

if errorlevel 1 (
    echo.
    echo Neither Python nor PHP found.
    echo Please install Python or use XAMPP.
    pause
)

