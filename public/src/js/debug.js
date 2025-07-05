// AirDraw Debug Helper
// Add this to a file called debug.js in your /src/js/ directory

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
      color: '#0f0',
      padding: '10px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '260px',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.4',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'block'
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
    
    // Add toggle functionality
    if (debugToggleBtn) {
      debugToggleBtn.addEventListener('click', function() {
        const isHidden = debugInfo.style.opacity === '0.2';
        debugInfo.style.opacity = isHidden ? '1' : '0.2';
        this.textContent = isHidden ? 'Hide' : 'Debug';
      });
    }
    
    // Variables for debug info
    let frameCount = 0;
    let lastFrameTime = performance.now();
    let fps = 0;
    
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
      
      // Get tool info
      const tool = document.querySelector('#pen-btn.active') ? 'pen' : 'eraser';
      
      // Update debug text
      debugInfo.textContent = 
        `FPS: ${fps}\n` +
        `Tool: ${tool}\n` +
        `Time: ${new Date().toLocaleTimeString()}\n` +
        `Window: ${window.innerWidth}x${window.innerHeight}\n`;
      
      // Check if hand is detected - we can look at the pointer display
      const pointer = document.getElementById('pointer');
      if (pointer && getComputedStyle(pointer).display !== 'none') {
        // Try to get hand position from transform
        const transform = pointer.style.transform;
        let x = 0, y = 0;
        
        if (transform) {
          const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
          if (match && match.length === 3) {
            x = parseFloat(match[1]) + 12; // Add back the offset
            y = parseFloat(match[2]) + 12;
            
            debugInfo.textContent += `Hand detected\nPosition: ${Math.round(x)}px, ${Math.round(y)}px`;
          } else {
            debugInfo.textContent += 'Hand detected';
          }
        } else {
          debugInfo.textContent += 'Hand detected';
        }
      } else {
        debugInfo.textContent += 'No hand detected';
      }
      
      // Continue the loop
      requestAnimationFrame(updateDebug);
    }
    
    // Start the update loop
    console.log('Starting debug update loop...');
    requestAnimationFrame(updateDebug);
  });
})();