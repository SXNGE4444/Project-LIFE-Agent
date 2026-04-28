// popup.js — LIFE Agent Popup Controller

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const reportContent = document.getElementById('report-content');
  const summaryEl = document.getElementById('summary');
  const criticalList = document.getElementById('critical-list');
  const highList = document.getElementById('high-list');
  const recList = document.getElementById('recommendations-list');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    loadingEl.textContent = 'No active tab detected.';
    return;
  }

  const stored = await chrome.storage.local.get(tab.url ? new URL(tab.url).hostname : null);
  const hostname = tab.url ? new URL(tab.url).hostname : null;
  const hostData = stored[hostname];

  let report;

  if (hostData && hostData.report && (Date.now() - hostData.timestamp < 60000)) {
    report = hostData.report;
    renderReport(report);
  } else {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getReport' });
      if (response) {
        report = response;
        renderReport(report);
      } else {
        loadingEl.textContent = 'Could not scan this page. Try refreshing.';
      }
    } catch (error) {
      loadingEl.textContent = 'LIFE Agent cannot scan this page type (chrome:// pages, etc.)';
    }
  }

  function renderReport(report) {
    loadingEl.style.display = 'none';
    reportContent.style.display = 'block';

    summaryEl.innerHTML = `<strong>${report.totalDetections} dark patterns found.</strong><br>${report.summary}`;

    if (report.criticalIssues.length > 0) {
      report.criticalIssues.forEach(issue => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${issue.pattern}</strong> (${Math.round(issue.confidence * 100)}% confidence)<br>${issue.harm}`;
        criticalList.appendChild(li);
      });
    } else {
      document.getElementById('critical-section').style.display = 'none';
    }

    if (report.highIssues.length > 0) {
      report.highIssues.forEach(issue => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${issue.pattern}</strong> (${Math.round(issue.confidence * 100)}% confidence)<br>${issue.harm}`;
        highList.appendChild(li);
      });
    } else {
      document.getElementById('high-section').style.display = 'none';
    }

    if (report.recommendations.length > 0) {
      report.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recList.appendChild(li);
      });
    } else {
      document.getElementById('recommendations-section').style.display = 'none';
    }
  }

  document.getElementById('rescan-btn').addEventListener('click', async () => {
    await chrome.tabs.sendMessage(tab.id, { action: 'rescan' });
    window.close();
  });
});
