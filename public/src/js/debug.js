// AirDraw Debug Helper
(function() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('AirDraw Debug Helper starting...');
    
    // Create debug panel if it doesn't exist
    let debugInfo = document.getElementById('debug-info');
    if (!debugInfo) {
      console.log('Creating debug panel...');
      debugInfo = document.createElement('div');
      debugInfo.id = 'debug-info';
      document.body.appendChild(debugInfo);
    }
    
    // Style the debug panel
    Object.assign(debugInfo.style, {
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      zIndex: '9999',
      background: 'rgba(0, 0, 0, 0.75)',
      color: '#0f0', // Always use green text
      padding: '10px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '260px',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.4',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'block',
      opacity: '1'
    });
    
    // Create or fix camera-fingers
    let cameraFingers = document.getElementById('camera-fingers');
    const cameraContainer = document.querySelector('.camera-container');
    
    if (cameraContainer) {
      if (!cameraFingers) {
        console.log('Creating camera-fingers element...');
        cameraFingers = document.createElement('div');
        cameraFingers.id = 'camera-fingers';
        cameraFingers.textContent = 'No hand';
        cameraContainer.appendChild(cameraFingers);
      } else if (!cameraContainer.contains(cameraFingers)) {
        cameraContainer.appendChild(cameraFingers);
      }
      
      // Make sure the camera container has a proper z-index
      cameraContainer.style.zIndex = '5000';
      
      // Also ensure the video element doesn't overlap
      const videoElement = document.getElementById('webcam-video');
      if (videoElement) {
        videoElement.style.zIndex = '1';
      }
    }
    
    // Add debug toggle button if it doesn't exist
    let debugToggleBtn = document.getElementById('debug-toggle');
    if (!debugToggleBtn) {
      console.log('Creating debug toggle button...');
      
      const toolsContainer = document.getElementById('tools');
      if (toolsContainer) {
        debugToggleBtn = document.createElement('button');
        debugToggleBtn.id = 'debug-toggle';
        debugToggleBtn.textContent = 'Debug';
        toolsContainer.appendChild(debugToggleBtn);
      }
    }
    
    // Variables for debug info
    let frameCount = 0;
    let lastFrameTime = performance.now();
    let fps = 0;
    
    // Tell app.js that debug.js is active
    window.debugJsActive = true;
    
    // Update loop
    function updateDebug() {
      // Calculate FPS
      const now = performance.now();
      frameCount++;
      
      if (now - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        frameCount = 0;
        lastFrameTime = now;
      }
      
      // Get finger count for determining active tool
      const fingerCount = window.airdrawState?.fingerCount || 0;
      
      // Determine tool based on finger count (similar to app.js logic)
      let firstHandTool = 'pen'; // Default
      
      if (fingerCount === 0) {
        // No fingers up (closed fist/rock) - move mode
        firstHandTool = 'move';
      } else if (fingerCount >= 4) {
        // 4 or more fingers up - eraser mode
        firstHandTool = 'eraser';
      } else if (fingerCount >= 1 && fingerCount <= 3) {
        // 1-3 fingers up - pen mode
        firstHandTool = 'pen';
      }
      
      // Get color info from global state if available
      const colorInfo = window.airdrawState ? `Color: ${window.airdrawState.penColor}\n` : '';
      
      // Check for hand detection status
      const pointer = document.getElementById('pointer');
      const pointer2 = document.getElementById('pointer2');
      
      // Variables for dual hand tracking
      let totalFingerCount = 0;
      let leftHandPresent = false;
      let rightHandPresent = false;
      let leftFingerCount = 0;
      let rightFingerCount = 0;
      let handPositionInfo = "";
      let bothHandsPresent = false;
      let secondHandTool = 'pen'; // Default tool for second hand
      
      // Get camera text to extract finger counts
      const cameraFingersElement = document.getElementById('camera-fingers');
      const cameraText = cameraFingersElement ? cameraFingersElement.textContent : '';
      
      // First hand
      if (pointer && getComputedStyle(pointer).display !== 'none') {
        const transform = pointer.style.transform;
        if (transform) {
          const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
          if (match && match.length === 3) {
            const x = parseFloat(match[1]) + 12;
            const y = parseFloat(match[2]) + 12;
            
            // Get handedness from app.js state
            const handInfo1 = window.handedness || '';
            
            // Explicitly flip handedness for debug console to match camera display
            if (handInfo1 === 'Left') rightHandPresent = true;
            if (handInfo1 === 'Right') leftHandPresent = true;
            
            // Get finger count from camera text if possible
            let firstHandFingerCount = fingerCount; // Default to global fingerCount
            
            // Try to extract first hand finger count from camera display
            if (cameraText) {
              if (cameraText.includes('&')) {
                // Two hands case: "Left hand (X fingers) & Right hand (Y fingers)"
                const bothHandsMatch = cameraText.match(/(\w+) hand \((\d+) fingers\) & (\w+) hand \((\d+) fingers\)/);
                if (bothHandsMatch && bothHandsMatch.length === 5) {
                  // If left hand is mentioned first
                  if (bothHandsMatch[1] === 'Left') {
                    if (handInfo1 === 'Left') {
                      firstHandFingerCount = parseInt(bothHandsMatch[2], 10);
                    } else {
                      firstHandFingerCount = parseInt(bothHandsMatch[4], 10);
                    }
                  } else { // Right hand mentioned first
                    if (handInfo1 === 'Right') {
                      firstHandFingerCount = parseInt(bothHandsMatch[2], 10);
                    } else {
                      firstHandFingerCount = parseInt(bothHandsMatch[4], 10);
                    }
                  }
                }
              } else {
                // One hand case: "Left hand (X fingers)" or "Right hand (X fingers)"
                const fingerMatch = cameraText.match(/(\w+) hand \((\d+) fingers\)/);
                if (fingerMatch && fingerMatch.length === 3) {
                  firstHandFingerCount = parseInt(fingerMatch[2], 10);
                }
              }
            }
            
            // Store extracted finger count for first hand
            if (!isNaN(firstHandFingerCount)) {
              totalFingerCount = firstHandFingerCount;
              
              // Store finger count by flipped hand
              if (handInfo1 === 'Left') rightFingerCount = firstHandFingerCount;
              if (handInfo1 === 'Right') leftFingerCount = firstHandFingerCount;
            }
            
            // Store position info for display later
            handPositionInfo = `Position: ${Math.round(x)}px, ${Math.round(y)}px`;
            
            // Check first hand tool by looking at its icon color/background
            const pointerCircle1 = document.getElementById('pointer-circle');
            if (pointerCircle1) {
              const bgColor = getComputedStyle(pointerCircle1).backgroundColor;
              // If it's white or very light, it's likely the eraser
              if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#FFFFFF' || bgColor === 'white') {
                firstHandTool = 'eraser';
              } else {
                firstHandTool = 'pen';
              }
            }
          }
        }
      }
      
      // Second hand
      if (pointer2 && getComputedStyle(pointer2).display !== 'none') {
        bothHandsPresent = true;
        const transform = pointer2.style.transform;
        if (transform) {
          const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
          if (match && match.length === 3) {
            // For the second hand, we need to determine its handedness
            // It's usually the opposite of the first hand
            const firstHandedness = window.handedness || '';
            const secondHandedness = firstHandedness === 'Left' ? 'Right' : 'Left';
            
            // Explicitly flip handedness for debug console to match camera display
            if (secondHandedness === 'Left') rightHandPresent = true;
            if (secondHandedness === 'Right') leftHandPresent = true;
            
            // Get the second hand's tool by looking at its circle color
            const pointerCircle2 = document.getElementById('pointer-circle2');
            if (pointerCircle2) {
              const bgColor = getComputedStyle(pointerCircle2).backgroundColor;
              // If it's white or very light, it's likely the eraser
              if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#FFFFFF' || bgColor === 'white') {
                secondHandTool = 'eraser';
              } else {
                secondHandTool = 'pen';
              }
            }
            
            // Extract second hand finger count from camera text if possible
            let secondHandFingerCount = 5; // Default to 5 (max fingers on a hand)
            
            // Try to extract second hand finger count from camera display
            if (cameraText && cameraText.includes('&')) {
                // "Left hand (X fingers) & Right hand (Y fingers)"
                const bothHandsMatch = cameraText.match(/(\w+) hand \((\d+) fingers\) & (\w+) hand \((\d+) fingers\)/);
                if (bothHandsMatch && bothHandsMatch.length === 5) {
                  // If left hand is mentioned first
                  if (bothHandsMatch[1] === 'Left') {
                    if (secondHandedness === 'Left') {
                      secondHandFingerCount = parseInt(bothHandsMatch[2], 10);
                    } else {
                      secondHandFingerCount = parseInt(bothHandsMatch[4], 10);
                    }
                  } else { // Right hand mentioned first
                    if (secondHandedness === 'Right') {
                      secondHandFingerCount = parseInt(bothHandsMatch[2], 10);
                    } else {
                      secondHandFingerCount = parseInt(bothHandsMatch[4], 10);
                    }
                  }
                }
            }
            
            // Store extracted finger count for second hand
            if (!isNaN(secondHandFingerCount)) {
              totalFingerCount += secondHandFingerCount;
              
              // Store finger count by flipped hand
              if (secondHandedness === 'Left') rightFingerCount = secondHandFingerCount;
              if (secondHandedness === 'Right') leftFingerCount = secondHandFingerCount;
            }
          }
        }
      }
      
      // Update the display text
      // CHANGE: Show different text based on whether one or two hands are present
      if (bothHandsPresent) {
        // Format tools with proper capitalization
        const firstToolDisplay = firstHandTool === 'pen' ? 'Pen' : (firstHandTool === 'eraser' ? 'Eraser' : 'Move');
        const secondToolDisplay = secondHandTool === 'pen' ? 'Pen' : (secondHandTool === 'eraser' ? 'Eraser' : 'Move');
        
        // Show both tools when two hands are present
        debugInfo.textContent = 
          `FPS: ${fps}\n` +
          `Tools: ${firstToolDisplay} & ${secondToolDisplay}\n` +
          colorInfo +
          `Time: ${new Date().toLocaleTimeString()}\n` +
          `Window: ${window.innerWidth}x${window.innerHeight}`;
      } else {
        // Single tool display for one hand
        debugInfo.textContent = 
          `FPS: ${fps}\n` +
          `Tool: ${firstHandTool === 'pen' ? 'Pen' : (firstHandTool === 'eraser' ? 'Eraser' : firstHandTool.charAt(0).toUpperCase() + firstHandTool.slice(1))}\n` +
          colorInfo +
          `Time: ${new Date().toLocaleTimeString()}\n` +
          `Window: ${window.innerWidth}x${window.innerHeight}`;
      }
      
      // Add hand information - using the flipped handedness to match camera display
      if (leftHandPresent && rightHandPresent) {
        debugInfo.textContent += "\nHands: Left & Right";
      } else if (leftHandPresent) {
        debugInfo.textContent += "\nHand: Left";
      } else if (rightHandPresent) {
        debugInfo.textContent += "\nHand: Right";
      } else {
        debugInfo.textContent += "\nHand: ";
      }
      
      // Add position info if available
      if (handPositionInfo && (!pointer2 || getComputedStyle(pointer2).display === 'none')) {
        debugInfo.textContent += `\n${handPositionInfo}`;
      }
      
      // Add finger count info
      if (totalFingerCount > 0) {
        debugInfo.textContent += `\nFingers up: ${totalFingerCount}`;
      }
      
// Add current color highlight notification if color changed recently
const colorNotification = document.getElementById('color-notification');
if (colorNotification && getComputedStyle(colorNotification).opacity !== '0') {
  // Check current visibility of the debug panel
  const isCurrentlyVisible = getComputedStyle(debugInfo).display !== 'none' && 
                            getComputedStyle(debugInfo).opacity !== '0';
  
  // Just update the button text without changing the panel visibility
  if (debugToggleBtn) {
    debugToggleBtn.textContent = isCurrentlyVisible ? 'Hide' : 'Debug';
  }
}
      
      // Continue the loop
      requestAnimationFrame(updateDebug);
    }
    
    // Start the update loop
    console.log('Starting debug update loop...');
    requestAnimationFrame(updateDebug);
    
    // Sync button text with the app.js syncDebugState function if available
    console.log('Syncing debug button text on initial load');
    setTimeout(() => {
      if (window.syncDebugState) {
        window.syncDebugState();
      }
    }, 1000);
  });
})();