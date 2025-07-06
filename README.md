# ✍️ AirDraw (https://air-draw.vercel.app)

**AirDraw** is a browser-based virtual whiteboard that lets you draw in the air using just your **fingertips** — no touchscreen or stylus required. It uses your **webcam** (phone or desktop) and real-time **hand tracking** with **MediaPipe** to turn your index finger into a pen or eraser.

---

## 🚀 Features

- **Gesture-Based Controls**: Use finger gestures to naturally switch between drawing and erasing
  - 0 fingers (closed fist) = move cursor without drawing
  - 1-3 fingers = pen tool
  - 4+ fingers = eraser tool
- **Dual-Hand Support**: Use both hands simultaneously for drawing with different tools
- **Voice-Controlled Color Changes**: Say color names to instantly change your drawing color
  - Supports over 140 named colors
  - Color modifiers (e.g., "light blue", "dark red")
  - RGB/HSL values (e.g., "50 percent red, 30 percent green")
  - Random colors ("random color")
- **Dynamic Tool Icons**: Cursor icon changes between pen and eraser based on your gestures
- **Debug Mode**: Toggle a debug panel with the 'D' key to see hand positions and finger counts
- **Smart Hand Detection**: Automatically flips hand detection for mirrored webcam display
- **Cross-Platform**: Works on desktop and mobile browsers

---
![Screenshot 2025-07-04 at 11 04 35 PM](https://github.com/user-attachments/assets/ead6de89-aa79-450f-a3cd-67acc5375263)

## 🛠️ Built With

- **Vanilla JavaScript**
- **MediaPipe Hands** (via CDN)
- **HTML5 Canvas**
- **WebRTC** for camera access
- **Web Speech API** for voice recognition

---

## 📦 Folder Structure

<pre>
📦 AirDraw/
├── public/
│   ├── icons/              → SVG icons (pen.svg, eraser.svg)
│   ├── index.html          → Main entry HTML
│   └── src/
│       ├── css/
│       │   └── styles.css  → Styling and layout
│       └── js/
│           ├── app.js              → Main app logic and canvas
│           ├── camera.js           → Camera setup
│           ├── colorDatabase.js    → Database of 140+ named colors
│           ├── debug.js            → Debug panel and visualization
│           ├── mediapipeHands.js   → Hand tracking logic
│           └── voice.js            → Voice recognition for color control
└── README.md
</pre>

---

## 🖥️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/AirDraw.git
cd AirDraw
```

### 2. Run the project

You can use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VSCode, or run a simple HTTP server:

```bash
npx http-server ./public
```

Then open your browser at [http://localhost:8080](http://localhost:8080)

> ⚠️ Allow camera access when prompted.
> ⚠️ Allow microphone access for voice color control.

---

## 🧠 How It Works

- **MediaPipe Hands** detects 21 hand landmarks from webcam input
- We track the **index fingertip** (landmark #8) and map its position to the canvas
- The app counts extended fingers to determine which tool to use:
  - 0 fingers = move cursor
  - 1-3 fingers = pen tool
  - 4+ fingers = eraser tool
- The cursor dynamically updates with pen.svg or eraser.svg based on the active tool
- Voice recognition listens for color commands to update the pen color in real-time

---

## 🗣️ Voice Commands

AirDraw supports a wide range of voice commands for changing colors:

- **Basic colors**: "red", "blue", "green", etc.
- **Modifiers**: "light blue", "dark red", "bright yellow", "pale green"
- **Comparative modifiers**: "lighter blue", "darker red", "brighter yellow"
- **RGB values**: "50 percent red, 30 percent green, 70 percent blue"
- **HSL values**: "hue 180 saturation 50 lightness 70"
- **Random**: "random color"

Press SPACE to toggle voice recognition on/off.

---

## ⌨️ Keyboard Shortcuts

- **D key**: Toggle debug panel visibility
- **SPACE**: Toggle voice recognition on/off

---

## 📱 Cross-Platform

- ✅ Chrome / Safari / Firefox on desktop
- ✅ Mobile Safari and Chrome (iOS/Android)
- ❌ Not supported in incognito mode in some browsers (due to camera restrictions)

---

## ✨ Coming Soon

- ✍️ Pinch gesture detection to toggle drawing
- 💾 Save / load drawings
- ↩️ Undo / redo
- 🧑‍🤝‍🧑 Collaborative mode (multi-user whiteboard)
- 📦 Export to PNG or PDF

---

## 📄 License

MIT License. Feel free to use, fork, or build on top of AirDraw!

---

## 🙌 Credits

- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) by Google
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for voice recognition
- Vanilla JS + Canvas API

---

## 🧠 Author

**Peter Azmy**  
Built with love for fingertip creativity 💡  
[LinkedIn](https://www.linkedin.com/in/peterazmy)  
[GitHub](https://github.com/clefspear)
