// background.js — LIFE Agent Central Controller
// Manages scan frequency across all tabs to prevent crashes

console.log('[LIFE BG] Service worker started');

// Track active scans globally
let activeScans = 0;
const MAX_CONCURRENT_SCANS = 2;
const scanQueue = [];

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scanRequest') {
    if (activeScans < MAX_CONCURRENT_SCANS) {
      activeScans++;
      sendResponse({ allowed: true });
      
      // Auto-release after 10 seconds
      setTimeout(() => {
        activeScans = Math.max(0, activeScans - 1);
        processQueue();
      }, 10000);
    } else {
      scanQueue.push(sendResponse);
      console.debug('[LIFE BG] Scan queued. Active:', activeScans, 'Queue:', scanQueue.length);
    }
    return true;
  }
  
  if (message.action === 'scanComplete') {
    activeScans = Math.max(0, activeScans - 1);
    processQueue();
  }
});

function processQueue() {
  if (scanQueue.length > 0 && activeScans < MAX_CONCURRENT_SCANS) {
    const next = scanQueue.shift();
    activeScans++;
    next({ allowed: true });
  }
}

// Clean old storage entries hourly (prevent storage bloat)
setInterval(() => {
  chrome.storage.local.get(null, (items) => {
    const keys = Object.keys(items);
    const now = Date.now();
    let removedCount = 0;
    
    keys.forEach(key => {
      const item = items[key];
      if (item && item.timestamp && (now - item.timestamp) > 3600000) {
        chrome.storage.local.remove(key);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.debug('[LIFE BG] Cleaned', removedCount, 'old storage entries');
    }
  });
}, 3600000); // Every hour

// Extension installed/updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('[LIFE] Extension installed/updated');
});

console.log('[LIFE BG] Controller ready');
