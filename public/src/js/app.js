//npx http-server ./public

import { setupCamera } from './camera.js';
import { initHands, sendVideoToHands } from './mediapipeHands.js';

const videoElement = document.getElementById('webcam-video');
const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');

const pointer = document.getElementById('pointer');
const pointerCircle = document.getElementById('pointer-circle');
const penIcon = document.getElementById('pen-icon');

const penBtn = document.getElementById('pen-btn');
const eraserBtn = document.getElementById('eraser-btn');

// Debug elements
const debugInfo = document.getElementById('debug-info');
const cameraFingers = document.getElementById('camera-fingers');
const debugToggleBtn = document.getElementById('debug-toggle');

// Global variables for drawing
let drawing = false;
let tool = 'pen'; // or 'eraser'
let lastPos = null;

// Global variables for debug info
let frameCount = 0;
let lastFrameTime = performance.now();
let fps = 0;
let latestHandData = null;
let isHandDetected = false;
let handedness = '';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Fix camera-fingers position
function fixCameraFingersPosition() {
  const cameraContainer = document.querySelector('.camera-container');
  
  if (cameraContainer && cameraFingers) {
    // Make sure camera-fingers is in the container
    if (!cameraContainer.contains(cameraFingers)) {
      cameraContainer.appendChild(cameraFingers);
    }
    
    // Apply container styling to ensure it's positioned correctly
    // Object.assign(cameraContainer.style, {
    //   position: 'fixed',
    //   bottom: '10px',
    //   right: '10px',
    //   width: '150px',
    //   height: '112px',
    //   border: '2px solid #333',
    //   borderRadius: '8px',
    //   overflow: 'hidden',
    //   zIndex: '10'
    // });
  }
}

// Tool buttons
penBtn.addEventListener('click', () => {
  tool = 'pen';
  penBtn.classList.add('active');
  eraserBtn.classList.remove('active');
});

eraserBtn.addEventListener('click', () => {
  tool = 'eraser';
  eraserBtn.classList.add('active');
  penBtn.classList.remove('active');
});

// Debug toggle
debugToggleBtn.addEventListener('click', () => {
  debugInfo.classList.toggle('debug-hidden');
  
  // Update button text
  if (debugInfo.classList.contains('debug-hidden')) {
    debugToggleBtn.textContent = 'Debug';
  } else {
    debugToggleBtn.textContent = 'Hide';
  }
});

// Camera status update - use pointer position for handedness
// Camera status update
function updateCameraFingersInfo(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    cameraFingers.textContent = 'No hand';
    cameraFingers.style.color = '#d00';
    isHandDetected = false;
    handedness = ''; // Clear global handedness
    return;
  }
  
  // Determine which hand is being used based on the x-position
  // This is more reliable than the MediaPipe labeling when using mirrored video
  const landmarks = results.multiHandLandmarks[0];
  const wristX = landmarks[0].x; // Wrist position (normalized 0-1)
  
  // Because we're flipping the x-coordinate in the drawing function,
  // we need to be consistent here:
  // If wristX is > 0.5, it's on the right side of the actual screen
  // Due to our mirroring adjustment, this means it's the right hand in reality
  if (wristX > 0.5) {
    handedness = 'Right';
  } else {
    handedness = 'Left';
  }
  
  cameraFingers.textContent = `${handedness} hand`;
  cameraFingers.style.color = '#0a0';
  isHandDetected = true;
}

// Separate loop for updating debug info
function updateDebugLoop() {
  // Calculate FPS
  const now = performance.now();
  frameCount++;
  
  if (now - lastFrameTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    frameCount = 0;
    lastFrameTime = now;
  }

  // Build debug info text
  let debugText = `FPS: ${fps}\n`;
  debugText += `Tool: ${tool}\n`;
  debugText += `Time: ${new Date().toLocaleTimeString()}\n`;
  debugText += `Window: ${window.innerWidth}x${window.innerHeight}\n`;
  
  // Add hand data if available
  if (isHandDetected && latestHandData) {
    const { x, y } = latestHandData;
    debugText += `Hand: ${handedness}\n`;
    debugText += `Position: ${Math.round(x)}px, ${Math.round(y)}px\n`;
  } else {
    debugText += `No hand detected`;
  }
  
  // Update the debug element
  debugInfo.textContent = debugText;
  
  // Continue the loop
  requestAnimationFrame(updateDebugLoop);
}

// Process hand tracking results
function onResults(results) {
  // Update camera fingers info based on position
  updateCameraFingersInfo(results);
  
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    pointer.style.display = 'none';
    drawing = false;
    lastPos = null;
    latestHandData = null; // Clear hand data
    return;
  }
  
  pointer.style.display = 'flex';
  
  const landmarks = results.multiHandLandmarks[0];
  // Index fingertip is landmark #8
  const indexTip = landmarks[8];
  
  // Coordinates normalized [0,1], invert y for canvas
  // Mirror the x-coordinate to match the mirrored webcam feed
  const x = (1 - indexTip.x) * window.innerWidth; // Mirror the x-coordinate
  const y = indexTip.y * window.innerHeight;
  
  // Move pointer
  pointer.style.transform = `translate(${x - 12}px, ${y - 12}px)`; // center the 24px circle
  
  // Store the latest hand data globally
  latestHandData = { x, y };
  
  // Drawing logic (simple - draw if tool is pen)
  if (tool === 'pen') {
    if (lastPos) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPos = { x, y };
  } else if (tool === 'eraser') {
    // Erase a small circle around fingertip
    ctx.clearRect(x - 15, y - 15, 30, 30);
    lastPos = null;
  }
}

// Initialize the application
async function main() {
  await setupCamera(videoElement);
  
  // Fix camera-fingers position before starting
  fixCameraFingersPosition();
  
  const hands = initHands(onResults);
  await sendVideoToHands(hands, videoElement);
  
  // Apply styling to debug info
  Object.assign(debugInfo.style, {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    zIndex: '40',
    background: 'rgba(0, 0, 0, 0.75)',
    color: '#0f0',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    maxWidth: '260px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  });
  
  
  // Start the debug update loop
  requestAnimationFrame(updateDebugLoop);
}

// Start the application
main();