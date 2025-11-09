# Running MyTurn on Android

## Option 1: Use Your Computer as a Server (Easiest)

### Step 1: Find your computer's IP address
- **Windows**: Open Command Prompt and type `ipconfig`, look for "IPv4 Address"
- **Mac/Linux**: Open Terminal and type `ifconfig` or `ip addr`, look for your local IP (usually starts with 192.168.x.x)

### Step 2: Start a simple web server
Open a terminal/command prompt in the MyTurn folder and run:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (if you have it):**
```bash
npx http-server -p 8000
```

### Step 3: Access from Android
1. Make sure your Android device is on the same Wi-Fi network as your computer
2. Open a browser on your Android device
3. Go to: `http://YOUR_COMPUTER_IP:8000`
   - Example: `http://192.168.1.100:8000`

## Option 2: Use a Mobile Web Server App

1. Install **"HTTP Server"** or **"Simple HTTP Server"** from Google Play Store
2. Copy your MyTurn folder to your Android device
3. In the app, select the MyTurn folder as the web root
4. Start the server
5. Open the provided URL in your browser (usually `http://localhost:8080`)

## Option 3: Deploy to GitHub Pages (Free, Always Accessible)

1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select your main branch and save
4. Your app will be available at: `https://YOUR_USERNAME.github.io/MyTurn`

## Option 4: Use Netlify Drop (Easiest Online Hosting)

1. Go to https://app.netlify.com/drop
2. Drag and drop your MyTurn folder
3. Get an instant URL to access from anywhere

## Notes:
- The app uses localStorage, so data will be saved per device/browser
- Make sure JavaScript is enabled in your browser
- For best experience, use Chrome or Firefox on Android

