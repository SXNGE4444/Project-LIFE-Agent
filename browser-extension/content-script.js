// content-script.js — Project LIFE Agent
// Adversarial Empathy in action: we see the page through the predator's eyes.

(async function() {
  if (typeof DarkPatternDetector === 'undefined') {
    console.warn('[LIFE] Pattern detector not loaded yet. Retrying...');
    return;
  }

  const detector = new DarkPatternDetector();
  await detector.loadTaxonomy();

  const detections = detector.scan(document);

  if (detections.length > 0) {
    const report = detector.generateHarmReport();
    console.log('[LIFE] Harm Report:', report);

    chrome.storage.local.set({ 
      [window.location.hostname]: {
        report: report,
        timestamp: Date.now(),
        detections: detections
      }
    });

    injectVisualWarnings(detections, report);
  }
})();

function injectVisualWarnings(detections, report) {
  const criticalDetections = detections.filter(d => d.severity === 'critical');

  for (const detection of criticalDetections) {
    if (detection.element) {
      detection.element.style.border = '2px dashed #ff3333';
      detection.element.style.position = 'relative';

      const tooltip = document.createElement('div');
      tooltip.className = 'life-agent-tooltip';
      tooltip.textContent = `⚠️ ${detection.harmReport}`;
      tooltip.style.cssText = `
        position: absolute;
        top: -30px;
        left: 0;
        background: #ff3333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        z-index: 99999;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      detection.element.appendChild(tooltip);

      detection.element.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
      });
      detection.element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    }
  }

  if (criticalDetections.length > 3) {
    const banner = document.createElement('div');
    banner.id = 'life-agent-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(90deg, #ff3333, #cc0000);
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 13px;
        font-family: system-ui, sans-serif;
        z-index: 2147483647;
        cursor: pointer;
      ">
        ⚠️ LIFE Agent detected ${criticalDetections.length} critical dark patterns on this page. 
        Click for details.
      </div>
    `;
    banner.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    document.body.prepend(banner);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getReport') {
    const report = detector.generateHarmReport();
    sendResponse(report);
  }
  if (message.action === 'rescan') {
    location.reload();
  }
});
