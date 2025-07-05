# ✍️ AirDraw

![Screenshot 2025-07-04 at 11 04 35 PM](https://github.com/user-attachments/assets/ead6de89-aa79-450f-a3cd-67acc5375263)

**AirDraw** is a browser-based virtual whiteboard that lets you draw in the air using just your **fingertips** — no touchscreen or stylus required. It uses your **webcam** (phone or desktop) and real-time **hand tracking** with **MediaPipe** to turn your index finger into a pen or eraser.

---

## 🚀 Features

- Draw with your index finger using your webcam
- Works on both desktop and mobile browsers
- Red circle + pen icon tracks your fingertip in real-time
- Toggle between **Pen** and **Eraser**
- Clean, full-screen canvas with live camera preview

---

## 🛠️ Built With

- **Vanilla JavaScript**
- **MediaPipe Hands** (via CDN)
- **HTML5 Canvas**
- **WebRTC** for camera access

---

## 📦 Folder Structure

<pre>
📦 AirDraw/
├── public/
│   ├── icons/              → SVG icons (pen icon)
│   ├── index.html          → Main entry HTML
│   └── src/
│       ├── css/
│       │   └── styles.css  → Styling and layout
│       └── js/
│           ├── app.js          → Main app logic and canvas
│           ├── camera.js       → Camera setup
│           ├── debug.js        → Debug panel and visualization
│           └── mediapipeHands.js → Hand tracking logic
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

---

## 🧠 How It Works

- **MediaPipe Hands** detects 21 hand landmarks from webcam input.
- We track the **index fingertip** (landmark #8) and map its position to the canvas.
- A red circle and pen icon follow the finger as a cursor.
- Depending on selected tool (pen or eraser), it draws or erases on the canvas in real-time.

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
- Vanilla JS + Canvas API

---

## 🧠 Author

**Peter Azmy**  
Built with love for fingertip creativity 💡  
[LinkedIn](https://www.linkedin.com/in/peterazmy)  
[GitHub](https://github.com/clefspear)
