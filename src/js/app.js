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

let drawing = false;
let tool = 'pen'; // or 'eraser'
let lastPos = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

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

async function main() {
  await setupCamera(videoElement);

  const hands = initHands(onResults);
  await sendVideoToHands(hands, videoElement);
}

function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    pointer.style.display = 'none';
    drawing = false;
    lastPos = null;
    return;
  }

  pointer.style.display = 'flex';

  const landmarks = results.multiHandLandmarks[0];
  // Index fingertip is landmark #8
  const indexTip = landmarks[8];

  // Coordinates normalized [0,1], invert y for canvas
  const x = indexTip.x * window.innerWidth;
  const y = indexTip.y * window.innerHeight;

  // Move pointer
  pointer.style.transform = `translate(${x - 16}px, ${y - 16}px)`; // center 24px circle

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

main();