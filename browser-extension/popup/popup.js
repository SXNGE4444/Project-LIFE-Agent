// popup.js — LIFE Agent Popup (Lightweight)
document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('report-content');
  const summary = document.getElementById('summary');
  const criticalList = document.getElementById('critical-list');
  const highList = document.getElementById('high-list');
  const recList = document.getElementById('recommendations-list');

  function showMsg(msg, isError) {
    loading.innerHTML = `<p style="color:${isError ? '#ff3333' : '#888'};">${msg}</p>`;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url?.startsWith('http')) {
      showMsg('Visit any website to scan for dark patterns.\n\nTry: amazon.com, facebook.com', false);
      return;
    }

    const hostname = new URL(tab.url).hostname;
    const stored = await chrome.storage.local.get(hostname);
    const hostData = stored[hostname];
    
    let report;
    if (hostData?.report && (Date.now() - hostData.timestamp < 120000)) {
      report = hostData.report;
    } else {
      try {
        report = await chrome.tabs.sendMessage(tab.id, { action: 'getReport' });
      } catch(e) {
        report = {
          totalDetections: 0,
          summary: 'Scan in progress. Refresh the page and try again.',
          criticalIssues: [], highIssues: [], mediumIssues: [],
          recommendations: ['Refresh the page to trigger a fresh scan.']
        };
      }
    }

    renderReport(report);
  } catch (error) {
    showMsg('Open a website first, then click here to scan.', false);
  }

  function renderReport(report) {
    loading.style.display = 'none';
    content.style.display = 'block';
    summary.innerHTML = `<strong>${report.totalDetections} patterns found</strong><br>${report.summary || ''}`;

    if (report.criticalIssues?.length) {
      document.getElementById('critical-section').style.display = 'block';
      report.criticalIssues.slice(0, 5).forEach(i => {
        const li = document.createElement('li');
        li.textContent = `[${Math.round(i.confidence * 100)}%] ${i.pattern}: ${i.harm}`;
        criticalList.appendChild(li);
      });
    } else {
      document.getElementById('critical-section').style.display = 'none';
    }

    if (report.highIssues?.length) {
      document.getElementById('high-section').style.display = 'block';
      report.highIssues.slice(0, 3).forEach(i => {
        const li = document.createElement('li');
        li.textContent = `${i.pattern}: ${i.harm}`;
        highList.appendChild(li);
      });
    } else {
      document.getElementById('high-section').style.display = 'none';
    }

    if (report.recommendations?.length) {
      document.getElementById('recommendations-section').style.display = 'block';
      report.recommendations.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r;
        recList.appendChild(li);
      });
    } else {
      document.getElementById('recommendations-section').style.display = 'none';
    }
  }

  document.getElementById('rescan-btn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.reload(tab.id);
    window.close();
  });
});
