// tracker-analyzer.js — Project LIFE Agent
// Network traffic analysis for tracker detection

class TrackerAnalyzer {
  constructor() {
    this.knownTrackers = [
      'google-analytics.com',
      'doubleclick.net',
      'facebook.com/tr',
      'hotjar.com',
      'mixpanel.com',
      'amplitude.com',
      'segment.io',
      'fullstory.com',
      'mouseflow.com',
      'crazyegg.com'
    ];
  }

  analyzeRequest(url) {
    for (const tracker of this.knownTrackers) {
      if (url.includes(tracker)) {
        return {
          isTracker: true,
          tracker: tracker,
          url: url
        };
      }
    }
    return { isTracker: false };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrackerAnalyzer;
}
