// content-script.js — Project LIFE Agent (Cross-Browser)
// Works on Chrome, Firefox, Brave, Edge, Opera, and any Chromium-based browser
(function() {
  'use strict';
  
  // Detect browser API
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  console.log('[LIFE] Content script loaded on:', window.location.href);
  console.log('[LIFE] Browser detected:', navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Chromium-based');

  async function init() {
    if (typeof DarkPatternDetector === 'undefined') {
      console.error('[LIFE] Pattern detector not loaded!');
      return;
    }

    const detector = new DarkPatternDetector();
    
    // Load taxonomy (works offline with built-in fallback)
    await detector.loadTaxonomy();
    
    // Scan the page
    const detections = detector.scan(document);
    const report = detector.generateHarmReport();
    
    console.log('[LIFE] Scan result:', report.summary);

    if (detections.length > 0) {
      // Save to storage for popup access
      const storageData = {};
      storageData[window.location.hostname] = {
        report: report,
        timestamp: Date.now(),
        detections: detections
      };
      
      browserAPI.storage.local.set(storageData, () => {
        if (browserAPI.runtime.lastError) {
          console.debug('[LIFE] Storage error:', browserAPI.runtime.lastError);
        }
      });

      // Highlight critical patterns on the page
      highlightPatterns(detections);
      
      // Show notification badge
      updateBadge(detections.length);
    }
  }

  function highlightPatterns(detections) {
    const critical = detections.filter(d => d.severity === 'critical');
    
    for (const d of critical) {
      if (d.element && d.element.isConnected) {
        try {
          d.element.style.outline = '2px dashed #ff3333';
          d.element.style.outlineOffset = '2px';
          d.element.title = '⚠️ LIFE Agent: ' + d.harmReport;
          
          // Add hover tooltip
          d.element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'life-tooltip';
            tooltip.textContent = '⚠️ ' + d.harmReport;
            tooltip.style.cssText = `
              position:fixed;top:${e.clientY - 30}px;left:${e.clientX}px;
              background:#ff3333;color:white;padding:4px 8px;border-radius:4px;
              font-size:11px;z-index:999999;pointer-events:none;
              font-family:system-ui,sans-serif;white-space:nowrap;
            `;
            document.body.appendChild(tooltip);
            
            d.element.addEventListener('mouseleave', function() {
              tooltip.remove();
            }, { once: true });
          });
        } catch (e) {
          console.debug('[LIFE] Could not highlight element:', e.message);
        }
      }
    }

    // Show banner for pages with many dark patterns
    if (critical.length >= 2 || detections.length >= 5) {
      try {
        const banner = document.createElement('div');
        banner.id = 'life-agent-banner';
        banner.innerHTML = `
          <div style="
            position:fixed;top:0;left:0;width:100%;
            background:linear-gradient(90deg,#cc0000,#ff3333);
            color:white;text-align:center;padding:10px;
            z-index:2147483647;cursor:pointer;
            font-family:system-ui,-apple-system,sans-serif;
            font-size:13px;box-shadow:0 2px 10px rgba(255,0,0,0.3);
          ">
            ⚠️ LIFE Agent detected ${critical.length} critical and ${detections.length} total dark patterns
            <span style="text-decoration:underline;margin-left:8px;">Click for details</span>
          </div>
        `;
        banner.onclick = function() {
          browserAPI.runtime.sendMessage({ action: 'openPopup' });
        };
        document.body.prepend(banner);
      } catch (e) {
        console.debug('[LIFE] Could not inject banner');
      }
    }
  }

  function updateBadge(count) {
    try {
      const text = count > 99 ? '99+' : String(count);
      const color = count > 10 ? '#ff3333' : count > 5 ? '#ff6b35' : '#ffd700';
      
      browserAPI.action?.setBadgeText({ text: text });
      browserAPI.action?.setBadgeBackgroundColor({ color: color });
      
      // Firefox uses browserAction
      if (!browserAPI.action) {
        browserAPI.browserAction?.setBadgeText({ text: text });
        browserAPI.browserAction?.setBadgeBackgroundColor({ color: color });
      }
    } catch (e) {
      console.debug('[LIFE] Badge update not available');
    }
  }

  // Handle messages from popup
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getReport') {
      const detector = new DarkPatternDetector();
      detector.loadTaxonomy().then(() => {
        detector.scan(document);
        sendResponse(detector.generateHarmReport());
      });
      return true; // Keep channel open for async
    }
    
    if (message.action === 'rescan') {
      window.location.reload();
      sendResponse({ success: true });
    }
    
    return true;
  });

  // Start scanning when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
