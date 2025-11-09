@echo off
echo Starting MyTurn Web Server...
echo.
echo Your server will be available at:
echo   - Local: http://localhost:8000
echo   - Network: http://YOUR_IP:8000
echo.
echo To find your IP address, run: ipconfig
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause

