// pattern-detector.js — Project LIFE Agent
// Structural Transparency: The architecture IS the confession.
// We ignore press releases. We read the code.

class DarkPatternDetector {
  constructor() {
    this.taxonomy = null;
    this.detections = [];
  }

  async loadTaxonomy() {
    try {
      const url = chrome.runtime.getURL('config/dark-patterns.yaml');
      const response = await fetch(url);
      const yamlText = await response.text();
      this.taxonomy = this.parseYAML(yamlText);
      console.log(`[LIFE] Taxonomy loaded: ${this.taxonomy.categories.length} categories`);
    } catch (error) {
      console.error('[LIFE] Failed to load taxonomy:', error);
    }
  }

  parseYAML(yamlText) {
    const categories = [];
    let currentCategory = null;
    let currentSignature = null;

    const lines = yamlText.split('\n');
    for (const line of lines) {
      if (line.startsWith('  - id:')) {
        currentCategory = { id: line.split(':')[1].trim(), signatures: [] };
        categories.push(currentCategory);
      } else if (currentCategory && line.includes('name:')) {
        currentCategory.name = line.split('name:')[1].trim();
      } else if (currentCategory && line.includes('severity:')) {
        currentCategory.severity = line.split('severity:')[1].trim();
      } else if (currentCategory && line.includes('pattern:')) {
        currentSignature = {
          pattern: line.split('pattern:')[1].trim().replace(/^"|"$/g, '').replace('{N}', '\\\\d+'),
          severity: currentCategory.severity
        };
        currentCategory.signatures.push(currentSignature);
      } else if (currentSignature && line.includes('check:')) {
        currentSignature.check = line.split('check:')[1].trim();
      } else if (currentCategory && line.includes('harm_report:')) {
        currentCategory.harmReport = line.split('harm_report:')[1].trim().replace(/^"|"$/g, '');
      }
    }
    return { categories };
  }

  scan(document) {
    if (!this.taxonomy) {
      console.error('[LIFE] Taxonomy not loaded. Call loadTaxonomy() first.');
      return [];
    }

    this.detections = [];
    const pageText = document.body.innerText;
    const pageHTML = document.documentElement.outerHTML;

    for (const category of this.taxonomy.categories) {
      for (const signature of category.signatures) {
        const regex = new RegExp(signature.pattern.replace('{N}', '\\d+'), 'gi');
        const textMatch = regex.test(pageText);
        const htmlMatch = regex.test(pageHTML);

        if (textMatch || htmlMatch) {
          const detectionResult = this.applyCheck(signature, category, document);

          if (detectionResult) {
            this.detections.push({
              categoryId: category.id,
              categoryName: category.name,
              pattern: signature.pattern,
              severity: signature.severity,
              checkDescription: signature.check,
              harmReport: category.harmReport,
              element: detectionResult.element,
              confidence: detectionResult.confidence
            });
          }
        }
      }
    }

    return this.detections;
  }

  applyCheck(signature, category, document) {
    const check = signature.check;
    let element = null;
    let confidence = 0.5;

    if (check.includes('default-checked') || check.includes('pre-checked')) {
      const checkedInputs = document.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
      for (const input of checkedInputs) {
        if (input.closest('form') && !input.hasAttribute('data-user-explicit')) {
          element = input;
          confidence = 0.9;
          break;
        }
      }
    }

    if (check.includes('Compare visual prominence') || check.includes('size, color contrast')) {
      const prominentButtons = document.querySelectorAll('button, a.button, .btn');
      for (const button of prominentButtons) {
        const styles = window.getComputedStyle(button);
        const fontSize = parseFloat(styles.fontSize);
        if (fontSize > 20) {
          const sibling = button.parentElement?.querySelector('button:not(:first-child), a:not(:first-child)');
          if (sibling) {
            const siblingStyles = window.getComputedStyle(sibling);
            const siblingFontSize = parseFloat(siblingStyles.fontSize);
            if (siblingFontSize < fontSize * 0.6) {
              element = button;
              confidence = 0.8;
              break;
            }
          }
        }
      }
    }

    if (check.includes('Monitor timer') || check.includes('countdown')) {
      const timers = document.querySelectorAll('[class*="countdown"], [class*="timer"], [id*="countdown"], [id*="timer"]');
      if (timers.length > 0) {
        element = timers[0];
        confidence = 0.7;
      }
    }

    if (check.includes('guilt-inducing') || check.includes('emotionally loaded')) {
      const guiltPhrases = ['I don\'t want', 'I don\'t care about', 'No thanks, I prefer'];
      const allText = document.querySelectorAll('button, a, span, p');
      for (const el of allText) {
        for (const phrase of guiltPhrases) {
          if (el.textContent?.toLowerCase().includes(phrase.toLowerCase())) {
            element = el;
            confidence = 0.85;
            break;
          }
        }
        if (element) break;
      }
    }

    return element ? { element, confidence } : null;
  }

  generateHarmReport() {
    const critical = this.detections.filter(d => d.severity === 'critical');
    const high = this.detections.filter(d => d.severity === 'high');
    const medium = this.detections.filter(d => d.severity === 'medium');

    const report = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      totalDetections: this.detections.length,
      summary: '',
      criticalIssues: critical.map(d => ({
        pattern: d.categoryName,
        harm: d.harmReport,
        confidence: d.confidence
      })),
      highIssues: high.map(d => ({
        pattern: d.categoryName,
        harm: d.harmReport,
        confidence: d.confidence
      })),
      mediumIssues: medium.map(d => ({
        pattern: d.categoryName,
        harm: d.harmReport,
        confidence: d.confidence
      })),
      recommendations: []
    };

    if (critical.length > 0) {
      report.summary = `CRITICAL: This site deploys ${critical.length} critically deceptive patterns. ${critical.map(d => d.harmReport).join(' ')}`;
      report.recommendations.push('Consider abandoning this service entirely.');
    } else if (high.length > 0) {
      report.summary = `WARNING: ${high.length} high-severity manipulative patterns detected. This site is actively working against your interests.`;
      report.recommendations.push('Proceed with extreme caution. Your choices are being engineered.');
    } else if (medium.length > 0) {
      report.summary = `NOTICE: ${medium.length} manipulative design patterns found. Your autonomy is being subtly undermined.`;
    } else {
      report.summary = 'No dark patterns detected. This site appears to respect your autonomy.';
    }

    return report;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkPatternDetector;
}
