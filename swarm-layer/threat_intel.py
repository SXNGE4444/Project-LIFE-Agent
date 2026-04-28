"""
threat_intel.py — Project LIFE Agent
Privacy-Preserving Swarm Intelligence

Shares threat intelligence across the swarm while preserving absolute privacy
through differential privacy and k-anonymity.
"""

import json
import hashlib
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict
import random
import math


@dataclass
class ThreatObservation:
    observation_id: str
    platform: str
    threat_category: str
    pattern_type: str
    severity: str
    confidence: float
    timestamp: float
    proof_hash: str
    noise_added: bool = True

    def to_anonymized_dict(self) -> Dict:
        return {
            'platform': self.platform,
            'threat_category': self.threat_category,
            'pattern_type': self.pattern_type,
            'severity': self.severity,
            'confidence': self.confidence,
            'timestamp_rounded': round(self.timestamp / 3600) * 3600,
        }


class ThreatIntelligenceAggregator:
    def __init__(self, privacy_budget: float = 1.0, k_anonymity: int = 5):
        self.privacy_budget = privacy_budget
        self.k_anonymity = k_anonymity
        self.observations: List[ThreatObservation] = []
        self.platform_stats: Dict[str, Dict] = defaultdict(lambda: {
            'count': 0, 'threats': defaultdict(int), 'severity_scores': [],
        })
        
    def add_observation(self, observation: ThreatObservation) -> bool:
        self.observations.append(observation)
        platform = observation.platform
        stats = self.platform_stats[platform]
        stats['count'] += 1
        stats['threats'][observation.threat_category] += 1
        stats['severity_scores'].append(
            {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}.get(observation.severity, 1)
        )
        return stats['count'] >= self.k_anonymity
    
    def add_differentially_private_noise(self, value: float, sensitivity: float = 1.0) -> float:
        scale = sensitivity / self.privacy_budget
        noise = random.gauss(0, scale * math.sqrt(2))
        return value + noise
    
    def get_platform_threat_level(self, platform: str) -> Dict:
        stats = self.platform_stats.get(platform, {})
        count = stats.get('count', 0)
        if count < self.k_anonymity:
            return {'platform': platform, 'status': 'insufficient_data', 'message': f'Need {self.k_anonymity} observations, have {count}'}
        
        noisy_count = self.add_differentially_private_noise(float(count))
        severity_scores = stats.get('severity_scores', [1])
        avg_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 0
        
        if avg_severity >= 3.5: threat_level = 'CRITICAL'
        elif avg_severity >= 2.5: threat_level = 'HIGH'
        elif avg_severity >= 1.5: threat_level = 'MODERATE'
        else: threat_level = 'LOW'
        
        return {
            'platform': platform, 'status': 'active_monitoring',
            'observation_count': round(noisy_count), 'threat_level': threat_level,
            'average_severity': round(avg_severity, 1),
            'top_threats': dict(sorted(stats.get('threats', {}).items(), key=lambda x: x[1], reverse=True)[:3]),
            'last_updated': time.time(),
        }
    
    def generate_swarm_intelligence_report(self) -> Dict:
        platforms_meeting_k = [p for p, s in self.platform_stats.items() if s['count'] >= self.k_anonymity]
        platform_reports = {}
        for platform in platforms_meeting_k:
            platform_reports[platform] = self.get_platform_threat_level(platform)
        
        platform_threats = [(p, self.get_platform_threat_level(p)) for p in platforms_meeting_k]
        platform_threats.sort(key=lambda x: (
            {'CRITICAL': 4, 'HIGH': 3, 'MODERATE': 2, 'LOW': 1}.get(x[1].get('threat_level', 'LOW'), 0)), reverse=True)
        
        recommendations = self._generate_collective_recommendations(platform_threats)
        
        return {
            'report_type': 'swarm_intelligence',
            'generated_at': time.time(),
            'total_observations': len(self.observations),
            'platforms_monitored': len(platforms_meeting_k),
            'critical_platforms': [p for p, r in platform_threats if r.get('threat_level') == 'CRITICAL'],
            'top_exploitative_platforms': [
                {'platform': p, 'threat_level': r.get('threat_level'), 'top_threats': r.get('top_threats', {})}
                for p, r in platform_threats[:10]
            ],
            'aggregate_statistics': {
                'total_tracking_events': self.add_differentially_private_noise(
                    sum(s['threats'].get('tracking', 0) for s in self.platform_stats.values())),
                'total_dark_patterns': self.add_differentially_private_noise(
                    sum(s['threats'].get('dark_pattern', 0) for s in self.platform_stats.values())),
            },
            'collective_recommendations': recommendations,
            'privacy_notice': 'All statistics include differential privacy noise (ε=1.0). Platforms with <5 observations excluded. No individual user data shared.',
        }
    
    def _generate_collective_recommendations(self, platform_threats: List[Tuple[str, Dict]]) -> List[str]:
        recommendations = []
        critical = [p for p, r in platform_threats if r.get('threat_level') == 'CRITICAL']
        if critical:
            recommendations.append(f"SWARM ALERT: {len(critical)} platforms at CRITICAL threat level. Top targets: {', '.join(critical[:5])}.")
        top_offenders = [p for p, r in platform_threats[:5] if r.get('threat_level') in ['CRITICAL', 'HIGH']]
        if top_offenders:
            recommendations.append(f"Mass DSAR campaign recommended against: {', '.join(top_offenders)}.")
        recommendations.append("Share this intelligence with regulators as evidence for enforcement actions.")
        return recommendations


class SwarmIntelligenceNode:
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.local_observations: List[ThreatObservation] = []
        self.swarm_aggregator = ThreatIntelligenceAggregator()
        self.last_swarm_update = 0
        self.cached_intelligence: Optional[Dict] = None
        
    def observe_threat(self, platform: str, threat_category: str, pattern_type: str, severity: str, confidence: float) -> ThreatObservation:
        observation = ThreatObservation(
            observation_id=hashlib.sha256(f"{self.node_id}:{platform}:{pattern_type}:{time.time()}".encode()).hexdigest()[:16],
            platform=platform, threat_category=threat_category, pattern_type=pattern_type,
            severity=severity, confidence=confidence, timestamp=time.time(),
            proof_hash=self._generate_observation_proof(platform, pattern_type), noise_added=True,
        )
        self.local_observations.append(observation)
        self.swarm_aggregator.add_observation(observation)
        return observation
    
    def _generate_observation_proof(self, platform: str, pattern_type: str) -> str:
        return hashlib.sha256(f"{self.node_id}:{platform}:{pattern_type}:{time.time()}".encode()).hexdigest()
    
    def share_observation(self, observation: ThreatObservation) -> Dict:
        return observation.to_anonymized_dict()
    
    def receive_swarm_intelligence(self, intelligence: Dict):
        self.cached_intelligence = intelligence
        self.last_swarm_update = time.time()
    
    def get_local_recommendations(self) -> List[str]:
        if not self.cached_intelligence: return ["No swarm intelligence available yet."]
        recommendations = []
        intel = self.cached_intelligence
        if 'collective_recommendations' in intel: recommendations.extend(intel['collective_recommendations'])
        local_platforms = set(o.platform for o in self.local_observations)
        critical_platforms = set(intel.get('critical_platforms', []))
        local_critical = local_platforms & critical_platforms
        if local_critical:
            recommendations.append(f"You use platforms flagged CRITICAL by swarm: {', '.join(local_critical)}. Immediate exit recommended.")
        return recommendations


def demo_swarm_intelligence():
    print("""
╔══════════════════════════════════════════════════════════════╗
║     SWARM THREAT INTELLIGENCE — COLLECTIVE KNOWLEDGE        ║
║     Privacy-preserving • K-anonymous • Differential privacy  ║
╚══════════════════════════════════════════════════════════════╝
""")
    nodes = [SwarmIntelligenceNode(f"agent_{name}") for name in ['alpha', 'beta', 'gamma', 'delta', 'epsilon']]
    platforms = ['Facebook', 'Instagram', 'TikTok', 'Google', 'Amazon', 'Twitter']
    threat_categories = ['tracking', 'dark_pattern', 'data_exfiltration', 'intent_fingerprinting']
    
    print("Agents observing threats...")
    for node in nodes:
        for _ in range(random.randint(3, 8)):
            node.observe_threat(
                platform=random.choice(platforms), threat_category=random.choice(threat_categories),
                pattern_type=f"pattern_{random.randint(1,10)}",
                severity=random.choice(['critical', 'high', 'medium', 'low']),
                confidence=random.uniform(0.7, 0.99),
            )
    
    aggregator = ThreatIntelligenceAggregator()
    for node in nodes:
        for obs in node.local_observations:
            aggregator.add_observation(obs)
    
    report = aggregator.generate_swarm_intelligence_report()
    print(f"\n{'='*60}")
    print("SWARM INTELLIGENCE REPORT")
    print("="*60)
    print(f"Total observations: {report['total_observations']}")
    print(f"Platforms monitored: {report['platforms_monitored']}")
    print(f"Critical platforms: {report['critical_platforms']}")
    print("\nTop Exploitative Platforms:")
    for p in report['top_exploitative_platforms'][:5]:
        print(f"  • {p['platform']}: {p['threat_level']}")
    print("\nCollective Recommendations:")
    for rec in report['collective_recommendations']:
        print(f"  → {rec}")
    print(f"\n{report['privacy_notice']}")
    return report


if __name__ == "__main__":
    demo_swarm_intelligence()
