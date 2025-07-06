// voice.js - Advanced color recognition system

// Extended color database - over 140 named colors
import { COLOR_DATABASE } from './colorDatabase.js';

// Initialize speech recognition
export function initVoiceRecognition(onColorChange) {
  // Check browser support
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }

  // Create speech recognition instance
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  // Create UI elements
  createVoiceUI();

  // Handle results
  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.trim().toLowerCase();
    
    console.log('Voice detected:', transcript);
    
    // Process the color command
    const colorResult = processColorCommand(transcript);
    
    if (colorResult) {
      console.log(`Changing color to ${colorResult.colorName} (${colorResult.hexColor})`);
      
      // Call the callback with the hex color
      onColorChange(colorResult.hexColor, colorResult.colorName);
      
      // Update color display
      updateColorDisplay(colorResult.hexColor, colorResult.colorName);
    } else {
      console.log('No color change - command not recognized');
    }
  };

  // Handle errors
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  // Keep restarting if it ends
  recognition.onend = () => {
    console.log('Speech recognition service disconnected');
    
    // Don't auto-restart if stopped manually
    if (!recognition.manualStop) {
      recognition.start();
      console.log('Listening for color commands...');
    }
  };

  // Start recognition
  try {
    recognition.start();
    console.log('Voice recognition started');
  } catch (err) {
    console.error('Failed to start voice recognition:', err);
  }

  // Add custom method to stop recognition
  recognition.manualStop = false;
  recognition.stopListening = () => {
    recognition.manualStop = true;
    recognition.stop();
    console.log('Voice recognition stopped');
    updateVoiceButtonUI(false);
  };

  recognition.resumeListening = () => {
    recognition.manualStop = false;
    recognition.start();
    console.log('Listening for color commands...');
    updateVoiceButtonUI(true);
  };

  // Add spacebar toggle functionality
  addSpacebarToggle(recognition);

  return recognition;
}

// Toggle voice recognition with spacebar
function addSpacebarToggle(recognition) {
  // Add keydown event listener to document
  document.addEventListener('keydown', (event) => {
    // Check if the key pressed was spacebar and not in an input field
    if (event.code === 'Space' && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      
      // Prevent default action (scrolling the page)
      event.preventDefault();
      
      // Toggle voice recognition
      toggleVoiceRecognition(recognition);
    }
  });

  console.log('Spacebar toggle added for voice recognition (press SPACE to toggle)');
}

// Function to toggle voice recognition
function toggleVoiceRecognition(recognition) {
  if (!recognition) return;
  
  const voiceBtn = document.getElementById('voice-btn');
  const isActive = voiceBtn?.classList.contains('voice-active');
  
  if (isActive) {
    // Turn off
    recognition.stopListening();
    showQuickNotification('Voice recognition paused (SPACE)', '#f44336');
  } else {
    // Turn on
    recognition.resumeListening();
    showQuickNotification('Voice recognition active (SPACE)', '#4CAF50');
  }
}

// Update the voice button UI
function updateVoiceButtonUI(isActive) {
  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;
  
  if (isActive) {
    voiceBtn.classList.add('voice-active');
    voiceBtn.innerHTML = '🎤 Voice';
    console.log('Voice button UI updated: active');
  } else {
    voiceBtn.classList.remove('voice-active');
    voiceBtn.innerHTML = '🎤 Voice (Off)';
    console.log('Voice button UI updated: inactive');
  }
}

// Show a quick notification
function showQuickNotification(message, color = '#4CAF50') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('voice-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'voice-notification';
    document.body.appendChild(notification);
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'sans-serif',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      textAlign: 'center',
      pointerEvents: 'none',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    });
  }
  
  // Set notification content
  notification.textContent = message;
  notification.style.borderLeft = `4px solid ${color}`;
  
  // Show notification
  notification.style.opacity = '1';
  
  // Clear any existing timeout
  if (window.notificationTimeout) {
    clearTimeout(window.notificationTimeout);
  }
  
  // Set a new timeout
  window.notificationTimeout = setTimeout(() => {
    notification.style.opacity = '0';
    
    // After notification fades, ensure debug button text is synced
    if (window.syncDebugState) {
      setTimeout(window.syncDebugState, 300);
    }
  }, 2000);
  
  // Make sure debug is visible and button says "Hide" when notification is shown
  if (window.syncDebugState) {
    window.syncDebugState();
  }
}

// Process color commands from voice input
function processColorCommand(transcript) {
  console.log("Processing color command:", transcript);
  
  // 1. Check for direct color names in database
  for (const colorName in COLOR_DATABASE) {
    if (transcript === colorName) {
      console.log("Exact color match found:", colorName);
      return {
        hexColor: COLOR_DATABASE[colorName],
        colorName: colorName
      };
    }
  }
  
  // 2. Check for color modifiers (light/dark/bright/pale)
  // Match patterns like "light blue", "lighter blue", "dark red", etc.
  const modifierPattern = /(light|lighter|dark|darker|bright|brighter|pale|paler|deep|deeper|muted)\s+([a-z]+)/i;
  const modifierMatches = transcript.match(modifierPattern);
  
  if (modifierMatches) {
    const modifier = modifierMatches[1].toLowerCase();
    const baseColor = modifierMatches[2].toLowerCase();
    
    console.log(`Modifier detected: "${modifier}" for base color "${baseColor}"`);
    
    // Check if base color exists
    if (COLOR_DATABASE[baseColor]) {
      // Get base color and modify it
      const baseHex = COLOR_DATABASE[baseColor];
      let newHex;
      
      // Determine the intensity based on the modifier
      let intensity = 30;
      
      // Adjust intensity for comparative modifiers (lighter, darker, etc.)
      if (modifier.endsWith('er')) {
        intensity = 40; // Stronger effect for comparative forms
      }
      
      const modifierBase = modifier.replace(/er$/, ''); // Remove 'er' suffix to handle both forms
      
      switch (modifierBase) {
        case 'light':
          newHex = lightenColor(baseHex, intensity);
          console.log(`Lightening ${baseColor} by ${intensity}%`);
          break;
        case 'dark':
          newHex = darkenColor(baseHex, intensity);
          console.log(`Darkening ${baseColor} by ${intensity}%`);
          break;
        case 'bright':
          newHex = saturateColor(baseHex, intensity);
          console.log(`Brightening ${baseColor} by ${intensity}%`);
          break;
        case 'pale':
          newHex = desaturateColor(baseHex, intensity);
          console.log(`Making ${baseColor} paler by ${intensity}%`);
          break;
        case 'deep':
          newHex = darkenColor(saturateColor(baseHex, 20), 20);
          console.log(`Making ${baseColor} deeper (saturate 20%, darken 20%)`);
          break;
        case 'muted':
          newHex = desaturateColor(baseHex, 40);
          console.log(`Muting ${baseColor} (desaturate 40%)`);
          break;
        default:
          newHex = baseHex;
          console.log(`Using base color ${baseColor} (no modification applied)`);
      }
      
      console.log(`Modified color: ${modifier} ${baseColor} -> ${newHex}`);
      
      return {
        hexColor: newHex,
        colorName: `${modifier} ${baseColor}`
      };
    } else {
      console.log(`Base color "${baseColor}" not found in database`);
    }
  }
  
  // 3. Check for RGB/HSL explicit values
  const rgbMatch = transcript.match(/(\d+)\s*percent\s*(red|green|blue)/gi);
  if (rgbMatch && rgbMatch.length > 0) {
    const rgbValues = [0, 0, 0]; // Default rgb
    
    rgbMatch.forEach(match => {
      const [_, percent, color] = match.match(/(\d+)\s*percent\s*(red|green|blue)/i);
      const index = color.toLowerCase() === 'red' ? 0 : 
                    color.toLowerCase() === 'green' ? 1 : 2;
      
      // Convert percentage to 0-255 value
      rgbValues[index] = Math.min(255, Math.round((parseInt(percent) / 100) * 255));
      console.log(`Setting ${color} to ${percent}% (${rgbValues[index]})`);
    });
    
    const hexColor = rgbToHex(rgbValues[0], rgbValues[1], rgbValues[2]);
    console.log(`Created RGB color: ${hexColor}`);
    
    return {
      hexColor,
      colorName: `custom (${rgbValues[0]}% red, ${rgbValues[1]}% green, ${rgbValues[2]}% blue)`
    };
  }
  
  // 4. Check for HSL values
  const hslMatch = transcript.match(/hue (\d+)(\s*saturation (\d+))?(\s*lightness (\d+))?/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) || 0;
    const s = parseInt(hslMatch[3]) || 100;
    const l = parseInt(hslMatch[5]) || 50;
    
    console.log(`Creating HSL color: hue ${h}, saturation ${s}, lightness ${l}`);
    const hexColor = hslToHex(h, s, l);
    
    return {
      hexColor,
      colorName: `custom (hue ${h}, sat ${s}, light ${l})`
    };
  }
  
  // 5. Handle random color request
  if (transcript.includes('random color')) {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    console.log(`Generated random color: ${randomHex}`);
    
    return {
      hexColor: randomHex,
      colorName: 'random'
    };
  }
  
  // Fuzzy matching for color terms as a fallback
  // This helps with partial matches and alternative pronunciations
  for (const colorName in COLOR_DATABASE) {
    // Try to find partial matches or colors mentioned within the transcript
    if (transcript.includes(colorName)) {
      console.log(`Fuzzy match found: "${colorName}" in "${transcript}"`);
      return {
        hexColor: COLOR_DATABASE[colorName],
        colorName: colorName
      };
    }
  }
  
  console.log("No color match found for:", transcript);
  // No color found
  return null;
}

// Create UI elements for voice recognition
function createVoiceUI() {
  // Check if UI already exists
  if (document.getElementById('current-color')) {
    console.log('Voice UI already exists, skipping creation');
    return;
  }
  
  console.log('Creating voice UI elements');
  
  // Create voice control button
  const toolsContainer = document.getElementById('tools');
  
  if (toolsContainer) {
    const voiceBtn = document.createElement('button');
    voiceBtn.id = 'voice-btn';
    voiceBtn.innerHTML = '🎤 Voice';
    voiceBtn.classList.add('voice-active');
    voiceBtn.title = 'Toggle voice recognition (or press SPACE)';
    toolsContainer.appendChild(voiceBtn);
    
    // Toggle voice recognition
    voiceBtn.addEventListener('click', () => {
      const isActive = voiceBtn.classList.contains('voice-active');
      
      if (isActive) {
        // Turn off
        voiceBtn.classList.remove('voice-active');
        voiceBtn.innerHTML = '🎤 Voice (Off)';
        window.voiceRecognition?.stopListening();
      } else {
        // Turn on
        voiceBtn.classList.add('voice-active');
        voiceBtn.innerHTML = '🎤 Voice';
        window.voiceRecognition?.resumeListening();
      }
    });
  }
  
  // Create color display
  const colorDisplay = document.createElement('div');
  colorDisplay.id = 'current-color';
  
  // Style the color display with more visible styles
  Object.assign(colorDisplay.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
    zIndex: '1000',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  });
  
  // Add color swatch
  const colorSwatch = document.createElement('div');
  colorSwatch.id = 'color-swatch';
  
  // Fix: Use more specific styles with !important for the swatch
  colorSwatch.style.cssText = `
    width: 30px;
    height: 30px;
    background-color: #FF0000 !important;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    margin-right: 8px;
    box-shadow: 0 0 4px #FF0000;
  `;
  
  // Add color name
  const colorName = document.createElement('div');
  colorName.id = 'color-name';
  colorName.textContent = 'red';
  
  Object.assign(colorName.style, {
    fontFamily: 'sans-serif',
    fontSize: '14px',
    color: 'white'
  });
  
  // Add help button
  const helpButton = document.createElement('button');
  helpButton.id = 'color-help';
  helpButton.textContent = '?';
  helpButton.title = 'Show color command help';
  
  Object.assign(helpButton.style, {
    marginLeft: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  });
  
  // Add elements to color display
  colorDisplay.appendChild(colorSwatch);
  colorDisplay.appendChild(colorName);
  colorDisplay.appendChild(helpButton);
  document.body.appendChild(colorDisplay);
  
  // Create help dialog
  const helpDialog = document.createElement('div');
  helpDialog.id = 'color-help-dialog';
  helpDialog.innerHTML = `
    <h3>Voice Color Commands</h3>
    <p>Say any of these to change the pen color:</p>
    <ul>
      <li><strong>Basic colors:</strong> "red", "blue", "green", etc.</li>
      <li><strong>Modifiers:</strong> "light blue", "dark red", "bright yellow", "pale green", "deep purple", "muted orange"</li>
      <li><strong>Comparative modifiers:</strong> "lighter blue", "darker red", "brighter yellow", "paler green"</li>
      <li><strong>RGB values:</strong> "50 percent red, 30 percent green, 70 percent blue"</li>
      <li><strong>HSL values:</strong> "hue 180 saturation 50 lightness 70"</li>
      <li><strong>Random:</strong> "random color"</li>
    </ul>
    <p>Over 140 named colors are supported!</p>
    <p><small>Toggle voice recognition with the Voice button or by pressing SPACE</small></p>
    <button id="close-help">Close</button>
  `;
  
  // Style help dialog
  Object.assign(helpDialog.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: '2000',
    maxWidth: '400px',
    display: 'none'
  });
  
  document.body.appendChild(helpDialog);
  
  // Add help button functionality
  helpButton.addEventListener('click', () => {
    helpDialog.style.display = 'block';
    console.log('Color help dialog opened');
  });
  
  // Add close button functionality
  document.getElementById('close-help').addEventListener('click', () => {
    helpDialog.style.display = 'none';
    console.log('Color help dialog closed');
  });
  
  // Add CSS to head
  const style = document.createElement('style');
  style.textContent = `
    #voice-btn.voice-active {
      background-color: #4CAF50;
      color: white;
    }
    #voice-btn {
      background-color: #f1f1f1;
      color: #333;
    }
    #color-help-dialog h3 {
      margin-top: 0;
      color: #333;
    }
    #color-help-dialog ul {
      padding-left: 20px;
    }
    #color-help-dialog li {
      margin-bottom: 8px;
    }
    #close-help {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    #voice-notification {
      font-weight: 500;
    }
    #color-swatch {
      background-color: #FF0000 !important;
    }
  `;
  document.head.appendChild(style);

  // Check if debug panel is hidden initially, and hide color display too
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo && 
      (getComputedStyle(debugInfo).opacity === '0' || 
      getComputedStyle(debugInfo).display === 'none' || 
      debugInfo.style.display === 'none')) {
    colorDisplay.style.opacity = '0';
    colorDisplay.style.display = 'none';
  }
  
  console.log('Voice UI created successfully');
}

// Update color display with new color
function updateColorDisplay(hexColor, colorName) {
  const swatch = document.getElementById('color-swatch');
  const name = document.getElementById('color-name');
  
  if (swatch && name) {
    // Fix: Force the color using !important inline style
    swatch.style.cssText = `background-color: ${hexColor} !important; box-shadow: 0 0 4px ${hexColor} !important; width: 30px; height: 30px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.5); margin-right: 8px;`;
    name.textContent = colorName;
    console.log(`Color display updated: ${colorName} (${hexColor})`);
    
    // Also update the global state if available
    if (window.airdrawState) {
      window.airdrawState.penColor = hexColor;
    }
    
    // Update the pointers with the new color
    updatePointers(hexColor);
    
    // Make sure debug button text is synced after color change
    if (window.syncDebugState) {
      window.syncDebugState();
    }
  } else {
    console.warn('Color display elements not found');
  }
}

// New function to update all pointers with the current color
function updatePointers(hexColor) {
  // Update pointer circles
  const pointerCircle = document.getElementById('pointer-circle');
  const pointerCircle2 = document.getElementById('pointer-circle2');
  
  if (pointerCircle) {
    pointerCircle.style.backgroundColor = hexColor;
    pointerCircle.style.boxShadow = `0 0 6px ${hexColor}`;
  }
  
  if (pointerCircle2) {
    pointerCircle2.style.backgroundColor = hexColor;
    pointerCircle2.style.boxShadow = `0 0 6px ${hexColor}`;
  }
}

// Helper functions for color manipulation
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
}

function lightenColor(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

function darkenColor(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

function saturateColor(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, Math.min(100, s + amount), l);
}

function desaturateColor(hex, amount) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, Math.max(0, s - amount), l);
}