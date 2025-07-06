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
    
    // NOTE: We don't add any click or keyboard event handlers for debug toggle
    // as those are now handled exclusively in app.js
    
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
      
      // Get tool info from global state if available
      const tool = window.airdrawState ? window.airdrawState.tool : 'pen';
      
      // Get color info from global state if available
      const colorInfo = window.airdrawState ? `Color: ${window.airdrawState.penColor}\n` : '';
      
      // Update debug text
      debugInfo.textContent = 
        `FPS: ${fps}\n` +
        `Tool: ${tool === 'pen' ? 'Pen' : (tool === 'eraser' ? 'Eraser' : tool)}\n` +
        colorInfo +
        `Time: ${new Date().toLocaleTimeString()}\n` +
        `Window: ${window.innerWidth}x${window.innerHeight}`;
      
      // Check for hand detection status
      const pointer = document.getElementById('pointer');
      const pointer2 = document.getElementById('pointer2');
      const handStatuses = [];
      
      // Initialize variables to track hands and fingers
      let totalFingerCount = 0;
      let leftHandPresent = false;
      let rightHandPresent = false;
      let leftFingerCount = 0;
      let rightFingerCount = 0;
      
      // First hand
      if (pointer && getComputedStyle(pointer).display !== 'none') {
        const transform = pointer.style.transform;
        if (transform) {
          const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
          if (match && match.length === 3) {
            const x = parseFloat(match[1]) + 12;
            const y = parseFloat(match[2]) + 12;
            
            // Get handedness from app.js state - FIX: Correct display for mirrored view
            const handInfo1 = window.handedness || '';
            // Fix for handedness display (flipped in the UI)
            const displayHandedness = handInfo1 === 'Left' ? 'Right' : (handInfo1 === 'Right' ? 'Left' : handInfo1);
            
            // Track which hand is present
            if (displayHandedness === 'Left') leftHandPresent = true;
            if (displayHandedness === 'Right') rightHandPresent = true;
            
            // Get finger count for this hand
            const fingerCount = window.airdrawState?.fingerCount || 0;
            totalFingerCount += fingerCount;
            
            // Store finger count by hand
            if (displayHandedness === 'Left') leftFingerCount = fingerCount;
            if (displayHandedness === 'Right') rightFingerCount = fingerCount;
            
            // Only add position info if we're showing just one hand
            if (!pointer2 || getComputedStyle(pointer2).display === 'none') {
              handStatuses.push(`Hand: ${displayHandedness}`);
              handStatuses.push(`Position: ${Math.round(x)}px, ${Math.round(y)}px`);
            }
          }
        }
      }
      
      // Second hand
      if (pointer2 && getComputedStyle(pointer2).display !== 'none') {
        const transform = pointer2.style.transform;
        if (transform) {
          const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
          if (match && match.length === 3) {
            // For the second hand, we need to determine its handedness
            // It's usually the opposite of the first hand
            const firstHandedness = window.handedness || '';
            const secondHandedness = firstHandedness === 'Left' ? 'Right' : 'Left';
            
            // Fix for handedness display (flipped in the UI)
            const displayHandedness = secondHandedness === 'Left' ? 'Right' : 'Left';
            
            // Track which hand is present
            if (displayHandedness === 'Left') leftHandPresent = true;
            if (displayHandedness === 'Right') rightHandPresent = true;
            
            // Estimate finger count for second hand (we don't have direct access)
            // This is a rough approximation - could be improved with better data sharing
            const fingerCount = 1; // Assume at least index finger is up
            totalFingerCount += fingerCount;
            
            // Store finger count by hand
            if (displayHandedness === 'Left') leftFingerCount = fingerCount;
            if (displayHandedness === 'Right') rightFingerCount = fingerCount;
          }
        }
      }
      
      // Create a combined hands status when both hands are present
      if (leftHandPresent && rightHandPresent) {
        handStatuses.push(`Hands: Left & Right`);
      } else if (leftHandPresent) {
        handStatuses.push(`Hand: Left`);
      } else if (rightHandPresent) {
        handStatuses.push(`Hand: Right`);
      }
      
      // Add finger count info
      if (totalFingerCount > 0) {
        handStatuses.push(`Fingers up: ${totalFingerCount}`);
      }
      
      // Add hand detection status
      if (handStatuses.length > 0) {
        debugInfo.textContent += "\n" + handStatuses.join("\n");
      } else {
        debugInfo.textContent += "\nNo hands detected";
      }
      
      // Add current color highlight notification if color changed recently
      const colorNotification = document.getElementById('color-notification');
      if (colorNotification && getComputedStyle(colorNotification).opacity !== '0') {
        // Ensure the debug info is visible when color changes
        debugInfo.style.opacity = '1';
        if (debugToggleBtn) debugToggleBtn.textContent = 'Hide';
      }
      
      // Continue the loop
      requestAnimationFrame(updateDebug);
    }
    
    // Start the update loop
    console.log('Starting debug update loop...');
    requestAnimationFrame(updateDebug);
  });
})();