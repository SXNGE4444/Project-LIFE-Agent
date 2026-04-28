/**
 * tracker-analyzer-enhanced.js — Project LIFE Agent
 * Network-Level Counter-Surveillance with behavioral analysis
 */
class TrackerAnalyzerEnhanced {
  constructor() {
    this.observedTrackers = new Map();
    this.dataExfiltrationEvents = [];
    this.fingerprintingAttempts = [];
    this.trackerDatabase = this.loadTrackerDatabase();
  }

  loadTrackerDatabase() {
    return {
      domains: {
        'doubleclick.net': { owner: 'Google', category: 'advertising', risk: 'high' },
        'facebook.com': { owner: 'Meta', category: 'social_graph', risk: 'critical', note: 'Builds shadow profiles' },
        'google-analytics.com': { owner: 'Google', category: 'analytics', risk: 'high' },
        'hotjar.com': { owner: 'Hotjar', category: 'session_recording', risk: 'critical', note: 'Records all mouse movements' },
        'fullstory.com': { owner: 'FullStory', category: 'session_recording', risk: 'critical', note: 'Complete session replay' },
        'mixpanel.com': { owner: 'Mixpanel', category: 'product_analytics', risk: 'high' },
        'amplitude.com': { owner: 'Amplitude', category: 'behavioral_analytics', risk: 'high' },
        'segment.io': { owner: 'Twilio', category: 'data_pipeline', risk: 'critical', note: 'Routes data to hundreds of services' },
        'criteo.com': { owner: 'Criteo', category: 'retargeting', risk: 'high' },
        'addthis.com': { owner: 'Oracle', category: 'social_tracking', risk: 'critical' }
      },
      fingerprintingScripts: [
        { pattern: 'navigator.deviceMemory', method: 'device_memory_fingerprinting' },
        { pattern: 'navigator.hardwareConcurrency', method: 'cpu_fingerprinting' },
        { pattern: 'canvas.toDataURL', method: 'canvas_fingerprinting' },
        { pattern: 'webgl.getParameter', method: 'webgl_fingerprinting' },
        { pattern: 'audioContext.createOscillator', method: 'audio_fingerprinting' }
      ]
    };
  }

  analyzeRequest(details) {
    const url = new URL(details.url);
    const domain = url.hostname.replace('www.', '');
    const trackerInfo = this.identifyTracker(domain);
    if (trackerInfo) this.recordTrackerObservation(domain, trackerInfo, details);
    this.analyzeQueryParameters(url, details);
    return trackerInfo;
  }

  identifyTracker(domain) {
    if (this.trackerDatabase.domains[domain]) return this.trackerDatabase.domains[domain];
    for (const [trackerDomain, info] of Object.entries(this.trackerDatabase.domains)) {
      if (domain.endsWith('.' + trackerDomain)) return info;
    }
    return null;
  }

  recordTrackerObservation(domain, info, details) {
    if (!this.observedTrackers.has(domain)) {
      this.observedTrackers.set(domain, { info, count: 0, firstSeen: Date.now(), lastSeen: Date.now(), urls: [] });
    }
    const tracker = this.observedTrackers.get(domain);
    tracker.count++;
    tracker.lastSeen = Date.now();
  }

  analyzeQueryParameters(url, details) {
    const suspiciousParams = ['email', 'user_id', 'uid', 'device_id', 'fingerprint', 'location', 'lat', 'lon'];
    const foundParams = [];
    for (const [key, value] of url.searchParams) {
      if (suspiciousParams.some(sp => key.toLowerCase().includes(sp))) {
        foundParams.push({ param: key, valuePreview: value.substring(0, 50) });
      }
    }
    if (foundParams.length > 0) {
      this.dataExfiltrationEvents.push({
        timestamp: Date.now(),
        source: url.hostname,
        params: foundParams,
        severity: foundParams.some(p => ['email', 'user_id', 'device_id'].includes(p.param.toLowerCase())) ? 'critical' : 'high'
      });
    }
  }

  monitorFingerprinting() {
    const scripts = document.getElementsByTagName('script');
    const detectedMethods = [];
    for (const { pattern, method } of this.trackerDatabase.fingerprintingScripts) {
      for (const script of scripts) {
        if (script.textContent?.includes(pattern)) {
          detectedMethods.push(method);
          break;
        }
      }
    }
    if (detectedMethods.length > 0) {
      this.fingerprintingAttempts.push({
        timestamp: Date.now(),
        methods: detectedMethods,
        severity: detectedMethods.length > 3 ? 'critical' : 'high'
      });
    }
    return detectedMethods;
  }

  generateTrackerReport() {
    const uniqueTrackers = this.observedTrackers.size;
    const totalRequests = Array.from(this.observedTrackers.values()).reduce((sum, t) => sum + t.count, 0);
    const criticalTrackers = Array.from(this.observedTrackers.values()).filter(t => t.info.risk === 'critical');
    return {
      summary: { uniqueTrackers, totalTrackingRequests: totalRequests, criticalTrackers: criticalTrackers.length, dataExfiltrationEvents: this.dataExfiltrationEvents.length, fingerprintingAttempts: this.fingerprintingAttempts.length },
      trackers: Array.from(this.observedTrackers.entries()).map(([domain, data]) => ({ domain, owner: data.info.owner, category: data.info.category, risk: data.info.risk, requests: data.count })),
      exfiltrationEvents: this.dataExfiltrationEvents.slice(-20),
      fingerprinting: this.fingerprintingAttempts,
      harmStatement: this.generateHarmStatement()
    };
  }

  generateHarmStatement() {
    const report = this.generateTrackerReport();
    const sessionRecorders = report.trackers.filter(t => t.category === 'session_recording');
    const dataBrokers = report.trackers.filter(t => t.category === 'data_marketplace' || t.category === 'data_pipeline');
    let harm = '';
    if (sessionRecorders.length > 0) harm += `⚠️ YOUR BEHAVIOR IS BEING RECORDED by ${sessionRecorders.map(t => t.owner).join(', ')}. `;
    if (dataBrokers.length > 0) harm += `⚠️ YOUR DATA IS BEING ROUTED TO MULTIPLE SERVICES. `;
    if (!harm) harm = `${report.summary.uniqueTrackers} trackers detected extracting value from your presence.`;
    return harm;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrackerAnalyzerEnhanced;
}
