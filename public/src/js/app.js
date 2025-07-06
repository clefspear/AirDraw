//npx http-server ./public
import { setupCamera } from './camera.js';
import { initHands, sendVideoToHands } from './mediapipeHands.js';
import { initVoiceRecognition } from './voice.js';

const videoElement = document.getElementById('webcam-video');
const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');

const pointer = document.getElementById('pointer');
const pointerCircle = document.getElementById('pointer-circle');
const penIcon = document.getElementById('pen-icon');

// Debug elements
const debugInfo = document.getElementById('debug-info');
const cameraFingers = document.getElementById('camera-fingers');
const debugToggleBtn = document.getElementById('debug-toggle');

// Global variables for drawing
let drawing = false;
let tool = 'pen'; // or 'eraser'
let lastPos = null;
let penColor = '#FF0000'; // Default red color
let voiceRecognition = null;

// For dual-hand tracking
let pointer2 = null;
let lastPos2 = null;

// Global variables for debug info
let frameCount = 0;
let lastFrameTime = performance.now();
let fps = 0;
let latestHandData = null;
let isHandDetected = false;
let handedness = '';
let fingerCount = 0; // Track number of fingers up

// Make hand information available globally
window.handedness = '';

// Create a global state object for sharing data with other scripts
window.airdrawState = {
  penColor: penColor,
  tool: tool,
  isDrawing: false,
  fingerCount: 0
};

// Function to update the global state
function updateGlobalState() {
  window.airdrawState.penColor = penColor;
  window.airdrawState.tool = tool;
  window.airdrawState.isDrawing = drawing;
  window.airdrawState.fingerCount = fingerCount;
  window.handedness = handedness;
}

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
  }
}

// Create a second pointer for dual-hand mode
function createSecondPointer() {
  // Check if second pointer already exists
  if (document.getElementById('pointer2')) {
    return document.getElementById('pointer2');
  }
  
  console.log('Creating second pointer for dual-hand mode');
  
  const pointer2 = document.createElement('div');
  pointer2.id = 'pointer2';
  pointer2.style.display = 'none';
  
  // Create pointer circle
  const pointerCircle2 = document.createElement('div');
  pointerCircle2.id = 'pointer-circle2';
  
  // Create pen icon
  const penIcon2 = document.createElement('img');
  penIcon2.id = 'pen-icon2';
  penIcon2.src = './icons/pen.svg'; // Default to pen, will be updated based on gesture
  penIcon2.alt = 'Tool Icon';
  
  // Add elements to pointer
  pointer2.appendChild(pointerCircle2);
  pointer2.appendChild(penIcon2);
  
  // Add pointer to document body
  document.body.appendChild(pointer2);
  
  // Apply styles
  Object.assign(pointer2.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '20',
    display: 'none',
    alignItems: 'center',
    gap: '6px'
  });
  
  Object.assign(pointerCircle2.style, {
    width: '24px',
    height: '24px',
    backgroundColor: '#FF0000',
    borderRadius: '50%',
    boxShadow: '0 0 6px #FF0000'
  });
  
  Object.assign(penIcon2.style, {
    width: '24px',
    height: '24px'
  });
  
  console.log('Second pointer created for dual-hand mode');
  return pointer2;
}

// Add keyboard event listeners
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Press 'd' to toggle debug panel
    if (e.key.toLowerCase() === 'd') {
      // Get fresh reference to the debug panel
      const debugInfoElement = document.getElementById('debug-info');
      const debugToggleBtnElement = document.getElementById('debug-toggle');
      
      if (!debugInfoElement) return;
      
      // Get the current state
      const computedStyle = getComputedStyle(debugInfoElement);
      const isHidden = computedStyle.opacity === '0' || 
                       computedStyle.display === 'none' || 
                       debugInfoElement.style.opacity === '0';
                       
      // Force the update regardless of current state to ensure it works
      if (isHidden) {
        // Show debug panel
        debugInfoElement.style.opacity = '1';
        debugInfoElement.style.display = 'block';
        if (debugToggleBtnElement) debugToggleBtnElement.textContent = 'Hide';
      } else {
        // Completely hide debug panel
        debugInfoElement.style.opacity = '0';
        debugInfoElement.style.display = 'none';
        if (debugToggleBtnElement) debugToggleBtnElement.textContent = 'Debug';
      }
      
      // Prevent any default behavior
      e.preventDefault();
      
      console.log('Debug panel toggled via keyboard shortcut');
    }
  });
  
  console.log('Keyboard shortcuts initialized: D = toggle debug');
}

// Initialize voice recognition
function initializeVoiceRecognition() {
  try {
    // Initialize voice recognition with color change callback
    voiceRecognition = initVoiceRecognition((hexColor, colorName) => {
      // Update pen color
      penColor = hexColor;
      
      // Update global state
      window.airdrawState.penColor = hexColor;
      
      // Flash feedback for the user
      flashColorFeedback(hexColor);
      
      // If color changes to very light colors, update debug text to be visible
      updateDebugTextColor(hexColor);
      
      // Show color change notification
      showColorChangeNotification(colorName, hexColor);
      
      // Update debug panel
      updateDebugPanel();
      
      // Update pen icon color
      updatePointerColors(hexColor);
      
      console.log(`Voice command: Changed color to ${colorName} (${hexColor})`);
    });
    
    // Store in window for access from UI
    window.voiceRecognition = voiceRecognition;
    
    console.log("Voice recognition initialized successfully");
  } catch (err) {
    console.error("Error initializing voice recognition:", err);
    
    // Create a fallback voice button that shows an error message
    const toolsContainer = document.getElementById('tools');
    if (toolsContainer) {
      const voiceBtn = document.createElement('button');
      voiceBtn.id = 'voice-btn';
      voiceBtn.textContent = '🎤 Voice (Unavailable)';
      voiceBtn.style.opacity = '0.7';
      voiceBtn.addEventListener('click', () => {
        alert('Voice recognition is not available in this browser or requires permission. Try using Chrome or Edge.');
      });
      toolsContainer.appendChild(voiceBtn);
    }
  }
}

// Update the color of the pointer and pen icon
function updatePointerColors(hexColor) {
  // Update first pointer
  if (pointerCircle) {
    pointerCircle.style.backgroundColor = hexColor;
    pointerCircle.style.boxShadow = `0 0 6px ${hexColor}`;
  }
  
  // Update second pointer if it exists
  const pointerCircle2 = document.getElementById('pointer-circle2');
  if (pointerCircle2) {
    pointerCircle2.style.backgroundColor = hexColor;
    pointerCircle2.style.boxShadow = `0 0 6px ${hexColor}`;
  }
  
  // Update color swatch in the color display
  const colorSwatch = document.getElementById('color-swatch');
  if (colorSwatch) {
    colorSwatch.style.backgroundColor = hexColor;
  }
  
  console.log("Updated pointer colors to:", hexColor);
}

// Show a notification when color changes
function showColorChangeNotification(colorName, hexColor) {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('color-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'color-notification';
    document.body.appendChild(notification);
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '200px', // Position well above the debug panel
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'sans-serif',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    });
  }
  
  // Create color swatch
  const swatch = document.createElement('span');
  Object.assign(swatch.style, {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: hexColor,
    borderRadius: '2px',
    marginRight: '6px',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  });
  
  // Set notification content
  notification.innerHTML = '';
  notification.appendChild(swatch);
  notification.appendChild(document.createTextNode(`Color changed to ${colorName}`));
  
  // Show notification
  notification.style.opacity = '1';
  
  // Clear any existing timeout
  if (window.notificationTimeout) {
    clearTimeout(window.notificationTimeout);
  }
  
  // Set a new timeout
  window.notificationTimeout = setTimeout(() => {
    notification.style.opacity = '0';
  }, 3000);
}

// Add visual feedback when color changes
function flashColorFeedback(hexColor) {
  // Create a flash element
  const flash = document.createElement('div');
  flash.className = 'color-flash';
  
  // Style the flash
  Object.assign(flash.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: hexColor,
    opacity: '0.2',
    zIndex: '999',
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-out'
  });
  
  // Add to body
  document.body.appendChild(flash);
  
  // Fade out and remove
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 500);
  }, 100);
}

// Update the debug panel with current information - FIXED: removed duplicate debug info
function updateDebugPanel() {
  // Only update if debug panel exists
  if (!debugInfo) return;
  
  // Let debug.js handle all updates to prevent duplicate text
  if (window.debugJsActive) {
    return;
  }
  
  // Only if not managed by debug.js, build a fresh debug panel
  let debugText = `FPS: ${fps}\n`;
  debugText += `Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}\n`;
  debugText += `Color: ${penColor}\n`;
  debugText += `Time: ${new Date().toLocaleTimeString()}\n`;
  debugText += `Window: ${window.innerWidth}x${window.innerHeight}\n`;
  
  // Add hand data if available
  if (isHandDetected && latestHandData) {
    const { x, y } = latestHandData;
    debugText += `Hand: ${handedness}\n`;
    debugText += `Position: ${Math.round(x)}px, ${Math.round(y)}px\n`;
    debugText += `Fingers up: ${fingerCount}`;
  } else {
    debugText += `No hand detected`;
  }
  
  // Update the debug element with the complete text
  debugInfo.textContent = debugText;
}

// Make debug text visible on light backgrounds
function updateDebugTextColor(backgroundColor) {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate perceived brightness (ITU-R BT.709)
  const getBrightness = (r, g, b) => {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return;
  
  const brightness = getBrightness(rgb.r, rgb.g, rgb.b);
  
  // Update debug text color based on background brightness
  if (debugInfo) {
    debugInfo.style.color = brightness > 0.6 ? '#000' : '#0f0';
    debugInfo.style.backgroundColor = brightness > 0.6 ? 
      'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.75)';
  }
}

// Camera status update - use pointer position for handedness
function updateCameraFingersInfo(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    cameraFingers.textContent = 'No hand';
    cameraFingers.style.color = '#d00';
    isHandDetected = false;
    handedness = ''; // Clear global handedness
    window.handedness = '';
    fingerCount = 0;
    return;
  }
  
  // Detect which hands are present
  const hands = {
    'Left': false,
    'Right': false
  };
  
  let leftFingerCount = 0;
  let rightFingerCount = 0;
  
  // Check each hand
  for (let i = 0; i < results.multiHandLandmarks.length; i++) {
    const handType = results.multiHandedness[i].label;
    hands[handType] = true;
    
    // Count fingers for each hand
    const fingersCount = countExtendedFingers(results.multiHandLandmarks[i]);
    if (handType === 'Left') {
      leftFingerCount = fingersCount;
    } else {
      rightFingerCount = fingersCount;
    }
    
    // Update global handedness for the first hand
    if (i === 0) {
      handedness = handType;
      window.handedness = handType;
      // Global fingerCount is for the first hand detected
      fingerCount = fingersCount;
    }
  }
  
  // Update camera fingers text based on hands detected
  let statusText = '';
  if (hands['Left'] && hands['Right']) {
    statusText = `Left hand (${leftFingerCount} fingers) & Right hand (${rightFingerCount} fingers)`;
  } else if (hands['Left']) {
    statusText = `Left hand (${leftFingerCount} fingers)`;
  } else if (hands['Right']) {
    statusText = `Right hand (${rightFingerCount} fingers)`;
  }
  
  cameraFingers.textContent = statusText;
  cameraFingers.style.color = '#0a0';
  isHandDetected = true;
}

// Count extended fingers using hand landmarks
function countExtendedFingers(landmarks) {
  if (!landmarks) return 0;
  
  // Finger tips are landmarks 4, 8, 12, 16, 20
  // Base knuckles are landmarks 2, 5, 9, 13, 17
  // First knuckles are landmarks 3, 6, 10, 14, 18
  // Wrist is landmark 0

  // Calculate palm centroid
  const wrist = landmarks[0];
  const middleBase = landmarks[9];
  const palmCenterX = (wrist.x + middleBase.x) / 2;
  const palmCenterY = (wrist.y + middleBase.y) / 2;
  const palmCenterZ = (wrist.z + middleBase.z) / 2;

  // Check each finger if it's extended
  const extendedFingers = [];
  
  // Thumb (index 4) - special case
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const thumbKnuckle = landmarks[3];
  
  // For thumb, check if it's to the side of hand
  // Thumb is considered extended if its tip is further from the palm center than the base
  const thumbTipDist = distance3D(
    thumbTip.x, thumbTip.y, thumbTip.z,
    palmCenterX, palmCenterY, palmCenterZ
  );
  
  const thumbBaseDist = distance3D(
    thumbBase.x, thumbBase.y, thumbBase.z,
    palmCenterX, palmCenterY, palmCenterZ
  );
  
  if (thumbTipDist > thumbBaseDist * 1.1) {
    extendedFingers.push('thumb');
  }
  
  // For each finger, check if it's extended by comparing the distances
  // Finger is extended if tip is further from palm than knuckle
  const fingerTips = [8, 12, 16, 20]; // index, middle, ring, pinky tips
  const fingerBases = [5, 9, 13, 17]; // index, middle, ring, pinky bases
  const fingerFirstKnuckles = [6, 10, 14, 18]; // first knuckles of each finger
  const fingerNames = ['index', 'middle', 'ring', 'pinky'];
  
  for (let i = 0; i < fingerTips.length; i++) {
    const tipIndex = fingerTips[i];
    const baseIndex = fingerBases[i];
    const knuckleIndex = fingerFirstKnuckles[i];
    
    const tip = landmarks[tipIndex];
    const base = landmarks[baseIndex];
    const knuckle = landmarks[knuckleIndex];
    
    // Calculate distances from palm center
    const tipDist = distance3D(
      tip.x, tip.y, tip.z,
      palmCenterX, palmCenterY, palmCenterZ
    );
    
    const knuckleDist = distance3D(
      knuckle.x, knuckle.y, knuckle.z,
      palmCenterX, palmCenterY, palmCenterZ
    );
    
    // Finger is extended if tip is significantly further than knuckle from palm center
    if (tipDist > knuckleDist * 1.3) {
      extendedFingers.push(fingerNames[i]);
    }
  }
  
  // Update global state with finger count
  if (window.airdrawState) {
    window.airdrawState.fingerCount = extendedFingers.length;
  }
  
  console.log("Extended fingers:", extendedFingers.join(", "), `(${extendedFingers.length})`);
  
  return extendedFingers.length;
}

// Helper function: 3D distance between two points
function distance3D(x1, y1, z1, x2, y2, z2) {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) + 
    Math.pow(y1 - y2, 2) + 
    Math.pow(z1 - z2, 2)
  );
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

  // Update global state
  updateGlobalState();
  
  // Continue the loop
  requestAnimationFrame(updateDebugLoop);
}

// Process hand tracking results
function onResults(results) {
  // Update camera fingers info based on position
  updateCameraFingersInfo(results);
  
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    pointer.style.display = 'none';
    if (pointer2) pointer2.style.display = 'none';
    drawing = false;
    lastPos = null;
    lastPos2 = null;
    latestHandData = null; // Clear hand data
    return;
  }
  
  // Process hands
  for (let i = 0; i < results.multiHandLandmarks.length; i++) {
    const landmarks = results.multiHandLandmarks[i];
    const handInfo = results.multiHandedness[i];
    const handType = handInfo.label; // 'Left' or 'Right'
    
    // Determine which pointer to use based on hand order
    const pointerElement = i === 0 ? pointer : (pointer2 || createSecondPointer());
    
    // Process this hand
    processHand(landmarks, handType, pointerElement, i);
  }
  
  // Hide second pointer if only one hand is detected
  if (results.multiHandLandmarks.length === 1 && pointer2) {
    pointer2.style.display = 'none';
    lastPos2 = null;
  }
}

// Process a single hand
function processHand(landmarks, handType, pointerElement, handIndex) {
  // Make sure pointer element exists
  if (!pointerElement) return;
  
  pointerElement.style.display = 'flex';
  
  // Index fingertip is landmark #8
  const indexTip = landmarks[8];
  
  // Coordinates normalized [0,1], invert y for canvas
  // Mirror the x-coordinate to match the mirrored webcam feed
  const x = (1 - indexTip.x) * window.innerWidth; // Mirror the x-coordinate
  const y = indexTip.y * window.innerHeight;
  
  // Move pointer
  pointerElement.style.transform = `translate(${x - 12}px, ${y - 12}px)`; // center the 24px circle
  
  // Store the latest hand data globally for the first hand
  if (handIndex === 0) {
    latestHandData = { x, y };
  }
  
  // Count extended fingers for this hand
  const fingerCount = countExtendedFingers(landmarks);
  
  // Determine tool based on finger count, not hand type
  let activeTool;
  
  if (fingerCount === 0) {
    // No fingers up (closed fist/rock) - just move cursor without drawing
    activeTool = 'move';
  } else if (fingerCount >= 4) {
    // 4 or more fingers up - switch to eraser mode temporarily
    activeTool = 'eraser';
  } else if (fingerCount >= 1 && fingerCount <= 3) {
    // 1-3 fingers up - use pen tool
    activeTool = 'pen';
  }
  
  // Get current position based on hand index
  const currentPos = handIndex === 0 ? lastPos : lastPos2;
  
  // Get tool icon element
  const iconElement = handIndex === 0 ? penIcon : pointerElement.querySelector('#pen-icon2');
  
  // Apply the active tool's behavior
  if (activeTool === 'pen') {
    // Set the pointer color to the current pen color
    const pointerCircleElement = handIndex === 0 ? pointerCircle : pointerElement.querySelector('#pointer-circle2');
    if (pointerCircleElement) {
      pointerCircleElement.style.backgroundColor = penColor;
      pointerCircleElement.style.boxShadow = `0 0 6px ${penColor}`;
    }
    
    // Update icon to pen.svg
    if (iconElement) {
      iconElement.src = './icons/pen.svg';
    }
    
    // FIX: Add buffer to prevent line connecting between hands on first detection
    // Only draw if we have a valid previous position that's not too far away
    if (currentPos) {
      // Calculate distance between current and last position
      const distance = Math.sqrt(
        Math.pow(x - currentPos.x, 2) + 
        Math.pow(y - currentPos.y, 2)
      );
      
      // Only draw if distance is reasonable (prevents long lines when hands first appear)
      if (distance < 100) { // 100px threshold should work for most cases
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        console.log(`Skipped drawing line - distance too large: ${distance.toFixed(1)}px`);
      }
    }
    
    // Update position directly
    if (handIndex === 0) {
      lastPos = { x, y };
    } else {
      lastPos2 = { x, y };
    }
  } else if (activeTool === 'eraser') {
    // Set the pointer color for eraser
    const pointerCircleElement = handIndex === 0 ? pointerCircle : pointerElement.querySelector('#pointer-circle2');
    if (pointerCircleElement) {
      pointerCircleElement.style.backgroundColor = '#FFFFFF';
      pointerCircleElement.style.boxShadow = '0 0 6px #FFFFFF';
    }
    
    // Update icon to eraser.svg
    if (iconElement) {
      iconElement.src = './icons/eraser.svg';
    }
    
    // Erase a small circle around fingertip
    ctx.clearRect(x - 15, y - 15, 30, 30);
    
    // Clear position directly
    if (handIndex === 0) {
      lastPos = null;
    } else {
      lastPos2 = null;
    }
  } else {
    // Move mode - just track the pointer without drawing
    if (handIndex === 0) {
      lastPos = null;
    } else {
      lastPos2 = null;
    }
  }
  
  // Show active tool in the debug panel for the first hand
  if (debugInfo && handIndex === 0) {
    if (window.debugJsActive) {
      // Let debug.js handle this
    } else {
      // If we're managing the debug panel, update it with the current active tool
      const lines = debugInfo.textContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Tool:')) {
          // Capitalize the first letter of the tool name
          lines[i] = `Tool: ${activeTool.charAt(0).toUpperCase()}${activeTool.slice(1)}`;
          break;
        }
      }
      debugInfo.textContent = lines.join('\n');
    }
  }
}

// Initialize the application
async function main() {
  try {
    await setupCamera(videoElement);
    
    // Fix camera-fingers position before starting
    fixCameraFingersPosition();
    
    // Create second pointer for dual-hand mode
    pointer2 = createSecondPointer();
    
    const hands = initHands(onResults);
    await sendVideoToHands(hands, videoElement);
    
    // Apply styling to debug info only if not already styled
    if (debugInfo && !debugInfo.style.position) {
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
    }
    
    // Set initial pen color for the pointer
    updatePointerColors(penColor);
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Start the debug update loop
    requestAnimationFrame(updateDebugLoop);
    
    // Initialize voice recognition for color control
    initializeVoiceRecognition();
    
    // Set up the debug toggle button
    if (debugToggleBtn) {
      debugToggleBtn.addEventListener('click', function() {
        const debugInfoElement = document.getElementById('debug-info');
        if (!debugInfoElement) return;
        
        const isHidden = getComputedStyle(debugInfoElement).opacity === '0' || 
                         debugInfoElement.style.display === 'none';
        
        if (isHidden) {
          // Show debug panel
          debugInfoElement.style.opacity = '1';
          debugInfoElement.style.display = 'block';
          this.textContent = 'Hide';
        } else {
          // Completely hide debug panel
          debugInfoElement.style.opacity = '0';
          debugInfoElement.style.display = 'none';
          this.textContent = 'Debug';
        }
        
        console.log(`Debug panel ${isHidden ? 'shown' : 'hidden'}`);
      });
    }
    
    console.log("AirDraw initialized successfully");
  } catch (err) {
    console.error("Error initializing AirDraw:", err);
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.top = '50%';
    errorMsg.style.left = '50%';
    errorMsg.style.transform = 'translate(-50%, -50%)';
    errorMsg.style.background = 'rgba(255, 0, 0, 0.8)';
    errorMsg.style.color = 'white';
    errorMsg.style.padding = '20px';
    errorMsg.style.borderRadius = '10px';
    errorMsg.style.zIndex = '9999';
    errorMsg.style.maxWidth = '80%';
    errorMsg.style.textAlign = 'center';
    errorMsg.innerHTML = `<h2>Error Initializing AirDraw</h2><p>${err.message}</p><p>Try refreshing the page or check console for details.</p>`;
    document.body.appendChild(errorMsg);
  }
}

// Make keyboard shortcuts work globally
setupKeyboardShortcuts();

// Start the application
main();