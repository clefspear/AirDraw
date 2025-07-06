// Load MediaPipe Hands via CDN in index.html (or npm install for local dev)
// This file wraps hand detection initialization and frame processing

export function initHands(onResultsCallback) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 2, // Set to 2 to enable dual-hand tracking
    modelComplexity: 1,
    minDetectionConfidence: 0.7, // Slightly lower threshold for better detection
    minTrackingConfidence: 0.7,
  });

  hands.onResults(onResultsCallback);

  return hands;
}

export async function sendVideoToHands(hands, video) {
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: video.videoWidth || 640,
    height: video.videoHeight || 480,
  });

  camera.start();
}