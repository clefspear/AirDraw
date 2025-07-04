// Load MediaPipe Hands via CDN in index.html (or npm install for local dev)
// This file wraps hand detection initialization and frame processing

export function initHands(onResultsCallback) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8,
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