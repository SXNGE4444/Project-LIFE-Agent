// background.js — Project LIFE Agent
// Service worker for the Legibility Engine

chrome.runtime.onInstalled.addListener(() => {
  console.log('[LIFE] Legibility Engine installed');
  
  // Initialize default settings
  chrome.storage.local.set({
    settings: {
      scanEnabled: true,
      showWarnings: true,
      notifyOnCritical: true
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    chrome.action.openPopup();
  }
});
