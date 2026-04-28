/**
 * advanced-pattern-detector.js — Project LIFE Agent
 * Layer 2: Behavioral Dark Pattern Detection
 * This module observes behavior over time and detects psychological manipulation sequences.
 */

class AdvancedPatternDetector {
  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      pageVisits: [],
      interactions: [],
      detectedSequences: [],
      manipulationScore: 0
    };
    
    this.manipulationSequences = {
      scarcityTrap: {
        name: "Scarcity Trap Sequence",
        description: "Creates artificial scarcity, then offers a 'solution' to the manufactured problem",
        phases: [
          { trigger: 'false_scarcity', action: 'Create urgency through fake limited availability' },
          { trigger: 'anxiety_peak', action: 'Increase pressure with countdown or stock depletion' },
          { trigger: 'relief_offer', action: 'Present purchase as the escape from manufactured anxiety' }
        ],
        severity: 'critical'
      },
      sunkCostFunnel: {
        name: "Sunk Cost Exploitation",
        description: "Gradually increases investment to make abandonment psychologically painful",
        phases: [
          { trigger: 'free_entry', action: 'Hook with zero-cost engagement' },
          { trigger: 'investment_build', action: 'Encourage time/data/customization investment' },
          { trigger: 'exit_barrier', action: 'Make leaving mean losing accumulated value' }
        ],
        severity: 'high'
      },
      emotionalRollercoaster: {
        name: "Emotional Manipulation Loop",
        description: "Alternates between validation and anxiety to create dependency",
        phases: [
          { trigger: 'dopamine_hit', action: 'Provide unexpected validation or reward' },
          { trigger: 'withdrawal_cue', action: 'Create FOMO or social anxiety' },
          { trigger: 'variable_reward', action: 'Unpredictable reward schedule to maintain engagement' },
          { trigger: 'repeat_cycle', action: 'Loop continues indefinitely' }
        ],
        severity: 'critical'
      },
      privacyZuckering: {
        name: "Privacy Erosion Sequence",
        description: "Gradually normalizes invasive data collection through incremental asks",
        phases: [
          { trigger: 'innocent_ask', action: 'Request seemingly harmless permission' },
          { trigger: 'normalization', action: 'Make data sharing feel standard' },
          { trigger: 'scope_creep', action: 'Expand data collection beyond original context' },
          { trigger: 'full_surveillance', action: 'Complete behavioral and personal data harvesting' }
        ],
        severity: 'critical'
      }
    };
    
    this.activeSequences = new Map();
    this.userVulnerabilityMarkers = new Set();
  }

  initialize(document) {
    this.document = document;
    this.setupInteractionTracking();
    this.setupDOMMutationTracking();
    this.setupTimingAnalysis();
    this.detectVulnerabilityMarkers();
    console.log('[LIFE Advanced] Behavioral analysis initialized');
  }

  setupInteractionTracking() {
    const events = ['click', 'scroll', 'input', 'mouseover', 'focus'];
    events.forEach(eventType => {
      this.document.addEventListener(eventType, (e) => {
        this.sessionData.interactions.push({
          type: eventType,
          target: this.getElementSignature(e.target),
          timestamp: Date.now(),
          coordinates: eventType === 'click' ? { x: e.clientX, y: e.clientY } : null,
          forcedInteraction: this.isForcedInteraction(e)
        });
        this.analyzeInteractionPattern(e);
      }, { passive: true });
    });
  }

  getElementSignature(element) {
    if (!element || !element.tagName) return 'unknown';
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className && typeof element.className === 'string' 
      ? `.${element.className.split(' ').slice(0, 3).join('.')}` : '';
    const text = element.textContent ? element.textContent.trim().substring(0, 50) : '';
    const role = element.getAttribute('role') || '';
    return `${tag}${id}${classes}[${role}]:${text}`;
  }

  isForcedInteraction(event) {
    const target = event.target;
    const computedStyle = window.getComputedStyle(target);
    if (parseFloat(computedStyle.opacity) < 0.1) {
      return { forced: true, method: 'transparent_overlay' };
    }
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = this.document.elementFromPoint(centerX, centerY);
    if (topElement && topElement !== target && !target.contains(topElement)) {
      return { forced: true, method: 'element_layering' };
    }
    if (rect.width < 20 && rect.height < 20 && target.tagName === 'BUTTON') {
      return { forced: true, method: 'tiny_target' };
    }
    return { forced: false };
  }

  setupDOMMutationTracking() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) this.analyzeNewElement(node);
          });
        }
        if (mutation.type === 'characterData') {
          this.analyzeTextChange(mutation.target);
        }
      });
    });
    observer.observe(this.document.body, {
      childList: true, subtree: true, characterData: true, characterDataOldValue: true
    });
  }

  analyzeNewElement(element) {
    const text = element.textContent?.toLowerCase() || '';
    const tagName = element.tagName?.toLowerCase() || '';
    if (tagName === 'div' && (text.includes('min') || text.includes('sec')) && /\d+:\d+/.test(text)) {
      this.detectSequencePhase('scarcityTrap', 'anxiety_peak', element);
    }
    if (text.includes('just added') || text.includes('just purchased') || 
        (text.includes('from') && text.includes('bought'))) {
      this.detectSequencePhase('scarcityTrap', 'false_scarcity', element);
    }
    if ((text.includes('wait') && text.includes('before you go')) || text.includes('don\'t leave')) {
      this.detectSequencePhase('sunkCostFunnel', 'exit_barrier', element);
    }
    if ((text.includes('allow') && text.includes('notification')) ||
        (text.includes('share') && text.includes('data'))) {
      this.detectSequencePhase('privacyZuckering', 'scope_creep', element);
    }
  }

  detectSequencePhase(sequenceName, phaseTrigger, element) {
    if (!this.activeSequences.has(sequenceName)) {
      this.activeSequences.set(sequenceName, {
        sequence: this.manipulationSequences[sequenceName],
        detectedPhases: [],
        startTime: Date.now(),
        elements: [],
        completed: false
      });
    }
    const active = this.activeSequences.get(sequenceName);
    if (!active.detectedPhases.includes(phaseTrigger)) {
      active.detectedPhases.push(phaseTrigger);
      active.elements.push(this.getElementSignature(element));
      const sequence = this.manipulationSequences[sequenceName];
      if (active.detectedPhases.length >= sequence.phases.length * 0.7) {
        active.completed = true;
        this.sessionData.manipulationScore += sequence.severity === 'critical' ? 30 : 15;
        this.sessionData.detectedSequences.push({
          sequence: sequence.name,
          severity: sequence.severity,
          detectedAt: Date.now(),
          duration: Date.now() - active.startTime
        });
        console.warn(`[LIFE Advanced] Manipulation sequence detected: ${sequence.name}`);
      }
    }
  }

  detectVulnerabilityMarkers() {
    const bodyText = this.document.body.innerText.toLowerCase();
    const vulnerabilityIndicators = {
      financialDistress: ['debt', 'consolidation', 'bad credit', 'overdue', 'collections'],
      healthAnxiety: ['symptom', 'condition', 'treatment', 'diagnosis', 'chronic'],
      emotionalVulnerability: ['lonely', 'depressed', 'anxious', 'stressed', 'overwhelmed'],
      addictionSusceptibility: ['limited time', 'exclusive offer', 'last chance', 'act now'],
      cognitiveOverload: ['confusing', 'overwhelming', 'too many options', 'simplify']
    };
    for (const [category, markers] of Object.entries(vulnerabilityIndicators)) {
      const matchCount = markers.filter(m => bodyText.includes(m)).length;
      if (matchCount / markers.length > 0.3) {
        this.userVulnerabilityMarkers.add(category);
      }
    }
    if (this.userVulnerabilityMarkers.size > 0) {
      console.warn('[LIFE Advanced] Vulnerability markers detected:', Array.from(this.userVulnerabilityMarkers));
    }
  }

  analyzeInteractionPattern(event) {
    const recentInteractions = this.sessionData.interactions
      .filter(i => i.timestamp > Date.now() - 5000);
    if (recentInteractions.length > 10) {
      const clicks = recentInteractions.filter(i => i.type === 'click');
      if (clicks.length > 5) {
        this.detectSequencePhase('scarcityTrap', 'anxiety_peak', event.target);
      }
    }
  }

  generateBehavioralReport() {
    return {
      sessionDuration: Date.now() - this.sessionData.startTime,
      interactionCount: this.sessionData.interactions.length,
      forcedInteractions: this.sessionData.interactions.filter(i => i.forcedInteraction?.forced).length,
      detectedSequences: this.sessionData.detectedSequences,
      manipulationScore: this.sessionData.manipulationScore,
      vulnerabilityMarkers: Array.from(this.userVulnerabilityMarkers),
      manipulationAssessment: this.getManipulationAssessment(),
      predatoryScore: this.calculatePredatoryScore()
    };
  }

  calculatePredatoryScore() {
    let score = this.sessionData.manipulationScore;
    score += this.userVulnerabilityMarkers.size * 10;
    const forcedCount = this.sessionData.interactions.filter(i => i.forcedInteraction?.forced).length;
    score += Math.min(forcedCount * 2, 20);
    return Math.min(score, 100);
  }

  getManipulationAssessment() {
    const score = this.calculatePredatoryScore();
    const sequences = this.sessionData.detectedSequences;
    if (score >= 80) {
      return {
        level: 'EXTREME PREDATION',
        description: `This site is actively predatory. ${sequences.length} manipulation sequences detected.`,
        recommendation: 'IMMEDIATE EXIT RECOMMENDED.'
      };
    } else if (score >= 50) {
      return {
        level: 'HIGH EXPLOITATION',
        description: `Significant manipulation detected. ${sequences.length} exploitation sequences identified.`,
        recommendation: 'Proceed with extreme caution.'
      };
    }
    return { level: 'MODERATE', description: 'Some manipulation detected.', recommendation: 'Remain vigilant.' };
  }

  setupTimingAnalysis() {
    this.timingData = { beneficialActions: [], exploitativeActions: [], measurements: [] };
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.recordAPITiming(args[0], performance.now() - startTime);
        return response;
      } catch (error) {
        this.recordAPITiming(args[0], performance.now() - startTime, true);
        throw error;
      }
    };
  }

  recordAPITiming(url, duration, failed = false) {
    const category = this.categorizeAPICall(url);
    this.timingData.measurements.push({ url, duration, failed, category, timestamp: Date.now() });
  }

  categorizeAPICall(url) {
    const urlLower = url.toLowerCase();
    if (['cancel', 'delete', 'unsubscribe', 'opt-out', 'reject'].some(p => urlLower.includes(p))) {
      return 'user_beneficial';
    }
    if (['subscribe', 'accept', 'upgrade', 'purchase', 'checkout'].some(p => urlLower.includes(p))) {
      return 'platform_beneficial';
    }
    return 'neutral';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedPatternDetector;
}
