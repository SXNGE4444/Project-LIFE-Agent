// pattern-detector.js — Project LIFE Agent (Memory-Safe)
// Hard limits prevent browser crash on heavy pages

class DarkPatternDetector {
  constructor() {
    this.taxonomy = null;
    this.detections = [];
    this.MAX_DETECTIONS = 20;    // Never store more than 20
    this.MAX_DOM_NODES = 5000;   // Skip pages with 5000+ elements
    this.MAX_TEXT_LENGTH = 50000; // Only check first 50KB of text
  }

  async loadTaxonomy() {
    // Built-in taxonomy (no external fetch = no crash risk)
    this.taxonomy = {
      "categories": [
        {
          "id": "urgency", "name": "False Urgency", "severity": "high",
          "signatures": [
            { "pattern": "only \\d+ left", "severity": "high", "check": "stock_claim" },
            { "pattern": "sale ends in", "severity": "critical", "check": "countdown" },
            { "pattern": "\\d+ people.*viewing", "severity": "high", "check": "social_pressure" },
            { "pattern": "just (bought|purchased)", "severity": "high", "check": "fake_activity" },
            { "pattern": "limited time", "severity": "medium", "check": "time_pressure" },
            { "pattern": "selling fast", "severity": "high", "check": "scarcity" },
            { "pattern": "act now", "severity": "medium", "check": "urgency_cta" }
          ],
          "harmReport": "This site fabricates scarcity to force impulsive purchases."
        },
        {
          "id": "misdirection", "name": "Visual Misdirection", "severity": "medium",
          "signatures": [
            { "pattern": "accept all cookies", "severity": "medium", "check": "cookie_accept" },
            { "pattern": "subscribe", "severity": "medium", "check": "subscribe_btn" },
            { "pattern": "recommended", "severity": "medium", "check": "recommended_highlight" }
          ],
          "harmReport": "This interface tricks your visual perception."
        },
        {
          "id": "forced_action", "name": "Forced Action", "severity": "high",
          "signatures": [
            { "pattern": "sign.*up.*to.*continue", "severity": "high", "check": "forced_registration" },
            { "pattern": "create.*account.*to", "severity": "high", "check": "forced_account" },
            { "pattern": "subscribe.*to.*read", "severity": "high", "check": "forced_subscription" }
          ],
          "harmReport": "Your access is held hostage for your data."
        },
        {
          "id": "sneaking", "name": "Sneaking", "severity": "critical",
          "signatures": [
            { "pattern": "pre.?checked", "severity": "critical", "check": "prechecked_input" },
            { "pattern": "auto.?renew", "severity": "high", "check": "auto_renewal" },
            { "pattern": "service fee", "severity": "critical", "check": "hidden_fee" },
            { "pattern": "processing fee", "severity": "critical", "check": "hidden_fee" }
          ],
          "harmReport": "Costs added without your explicit consent."
        },
        {
          "id": "obstruction", "name": "Obstruction", "severity": "critical",
          "signatures": [
            { "pattern": "call.*to.*cancel", "severity": "critical", "check": "phone_cancel" },
            { "pattern": "delete.*account", "severity": "high", "check": "delete_hidden" }
          ],
          "harmReport": "This company makes it hard to leave."
        },
        {
          "id": "confirmshaming", "name": "Confirmshaming", "severity": "medium",
          "signatures": [
            { "pattern": "i don'?t want to save", "severity": "medium", "check": "guilt_saving" },
            { "pattern": "i don'?t care about", "severity": "high", "check": "guilt_care" }
          ],
          "harmReport": "This manipulates your emotions through shame."
        },
        {
          "id": "social_proof_fabrication", "name": "Fake Social Proof", "severity": "high",
          "signatures": [
            { "pattern": "\\w+ from \\w+ just", "severity": "high", "check": "fake_location" },
            { "pattern": "verified purchase", "severity": "medium", "check": "verify_badge" }
          ],
          "harmReport": "Social proof may be fabricated."
        },
        {
          "id": "hidden_information", "name": "Hidden Information", "severity": "high",
          "signatures": [
            { "pattern": "\\+ tax", "severity": "critical", "check": "hidden_tax" },
            { "pattern": "additional fees", "severity": "critical", "check": "hidden_fees" },
            { "pattern": "terms.*conditions", "severity": "medium", "check": "hidden_terms" }
          ],
          "harmReport": "Material information deliberately hidden."
        },
        {
          "id": "nagging", "name": "Nagging", "severity": "medium",
          "signatures": [
            { "pattern": "open in app", "severity": "high", "check": "app_nag" },
            { "pattern": "turn on notification", "severity": "high", "check": "notif_nag" }
          ],
          "harmReport": "This site repeatedly interrupts you."
        }
      ]
    };
    console.log('[LIFE] Taxonomy ready (' + this.taxonomy.categories.length + ' categories)');
  }

  scan(document) {
    // MEMORY GUARDS
    if (!document.body) return [];
    
    // Skip huge pages
    if (document.querySelectorAll('*').length > this.MAX_DOM_NODES) {
      console.debug('[LIFE] Skip: too many DOM nodes');
      return [];
    }
    
    if (!this.taxonomy) {
      console.debug('[LIFE] Taxonomy not loaded');
      return [];
    }
    
    this.detections = [];
    
    // Only check first 50KB of text
    const bodyText = (document.body.innerText || '').substring(0, this.MAX_TEXT_LENGTH).toLowerCase();
    
    for (const category of this.taxonomy.categories) {
      if (this.detections.length >= this.MAX_DETECTIONS) break;
      
      for (const signature of category.signatures) {
        if (this.detections.length >= this.MAX_DETECTIONS) break;
        
        try {
          const regex = new RegExp(signature.pattern, 'gi');
          if (regex.test(bodyText)) {
            this.detections.push({
              categoryId: category.id,
              categoryName: category.name,
              pattern: signature.pattern,
              severity: signature.severity,
              checkDescription: signature.check,
              harmReport: category.harmReport,
              element: null,
              confidence: 0.7
            });
          }
        } catch(e) {
          continue;
        }
      }
    }
    
    return this.detections;
  }

  generateHarmReport() {
    if (this.detections.length === 0) {
      return {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        totalDetections: 0,
        summary: '✅ No dark patterns detected.',
        criticalIssues: [], highIssues: [], mediumIssues: [],
        recommendations: []
      };
    }

    const critical = this.detections.filter(d => d.severity === 'critical');
    const high = this.detections.filter(d => d.severity === 'high');
    const medium = this.detections.filter(d => d.severity === 'medium');

    const report = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      totalDetections: this.detections.length,
      summary: '',
      criticalIssues: critical.map(d => ({ pattern: d.categoryName, harm: d.harmReport, confidence: d.confidence })),
      highIssues: high.map(d => ({ pattern: d.categoryName, harm: d.harmReport, confidence: d.confidence })),
      mediumIssues: medium.map(d => ({ pattern: d.categoryName, harm: d.harmReport, confidence: d.confidence })),
      recommendations: []
    };

    if (critical.length > 0) {
      report.summary = `🚨 ${critical.length} critically deceptive patterns detected!`;
      report.recommendations.push('Consider abandoning this service.');
    } else if (high.length > 0) {
      report.summary = `⚠️ ${high.length} manipulative patterns found.`;
      report.recommendations.push('Proceed with extreme caution.');
    } else if (medium.length > 0) {
      report.summary = `📋 ${medium.length} subtle manipulative patterns.`;
    }

    return report;
  }
}

// Make available globally
if (typeof window !== 'undefined') window.DarkPatternDetector = DarkPatternDetector;
if (typeof module !== 'undefined' && module.exports) module.exports = DarkPatternDetector;
console.log('[LIFE] Pattern Detector ready (Memory-Safe)');
