#!/bin/bash
echo "Starting MyTurn Web Server..."
echo ""
echo "Your server will be available at:"
echo "  - Local: http://localhost:8000"
echo "  - Network: http://YOUR_IP:8000"
echo ""
echo "To find your IP address, run: ifconfig or ip addr"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000

