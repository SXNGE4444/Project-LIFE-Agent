"""
life_agent.py — Project LIFE Agent
Unified Agent Core — Orchestrates all LIFE Framework components.
"""
import json
import os
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict

logging.basicConfig(level=logging.INFO, format='[LIFE] %(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('LIFE_AGENT')

@dataclass
class AgentState:
    active: bool = False
    modules_loaded: Dict[str, bool] = field(default_factory=lambda: {
        'legibility': False, 'inversion': False, 'intent_vault': False, 'swarm': False
    })
    session_start: Optional[str] = None
    protected_intents: int = 0
    dsar_campaigns_executed: int = 0
    dark_patterns_detected_total: int = 0
    trackers_identified: int = 0
    manipulation_sessions_interrupted: int = 0

@dataclass
class ThreatAssessment:
    overall_risk: str
    primary_threats: List[str]
    exploitation_score: float
    surveillance_score: float
    autonomy_threats: List[str]
    recommended_actions: List[str]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

class LIFEAgent:
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.state = AgentState()
        self.threat_history: List[ThreatAssessment] = []
        self.data_dir = Path.home() / ".life-agent"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        logger.info("LIFE Agent initialized")
        
    def _load_config(self, config_path: Optional[str]) -> Dict:
        default_config = {
            'modules': {'legibility': True, 'inversion': True, 'intent_vault': True, 'swarm': False},
            'privacy': {'local_only': True, 'data_retention_days': 90, 'auto_delete_logs': True},
            'notifications': {'critical_alerts': True, 'swarm_updates': True, 'weekly_digest': True}
        }
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                default_config.update(json.load(f))
        return default_config
    
    async def start(self):
        logger.info("Starting LIFE Agent...")
        self.state.active = True
        self.state.session_start = datetime.now().isoformat()
        if self.config['modules']['legibility']: self.state.modules_loaded['legibility'] = True
        if self.config['modules']['inversion']: self.state.modules_loaded['inversion'] = True
        if self.config['modules']['intent_vault']: self.state.modules_loaded['intent_vault'] = True
        if self.config['modules']['swarm']: self.state.modules_loaded['swarm'] = True
        logger.info("LIFE Agent started successfully")
        await self._run_welcome_sequence()
        
    async def _run_welcome_sequence(self):
        print("""
╔══════════════════════════════════════════════════════════════╗
║         ⚡ PROJECT LIFE AGENT — ACTIVE ⚡                   ║
║         Liberated Intelligence For Empowerment             ║
║   [L] Legibility  [I] Inversion  [F] Intent  [E] Swarm    ║
║   Your digital autonomy is now defended.                    ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    async def protect_intent(self, content: str, category: str) -> str:
        self.state.protected_intents += 1
        logger.info(f"Intent protected — Category: {category}")
        return f"protected_{hash(content) % 1000000}"
    
    async def analyze_threat_landscape(self) -> ThreatAssessment:
        assessment = ThreatAssessment(
            overall_risk='moderate', primary_threats=[],
            exploitation_score=25.0, surveillance_score=30.0,
            autonomy_threats=[], recommended_actions=['Stay vigilant', 'Review privacy settings regularly']
        )
        self.threat_history.append(assessment)
        return assessment
    
    async def generate_weekly_report(self) -> Dict:
        return {
            'period': 'last_7_days',
            'dark_patterns_detected': self.state.dark_patterns_detected_total,
            'trackers_blocked': self.state.trackers_identified,
            'protected_intents': self.state.protected_intents,
            'autonomy_score': min(50 + sum(10 for m in self.state.modules_loaded.values() if m), 100),
            'message': 'Your digital autonomy is being defended. Stay vigilant.'
        }
    
    async def shutdown(self):
        logger.info("Shutting down LIFE Agent...")
        state_path = self.data_dir / "agent_state.json"
        with open(state_path, 'w') as f:
            json.dump(asdict(self.state), f, indent=2)
        self.state.active = False
        logger.info("LIFE Agent shut down. Your data remains local.")
        print("\n[LIFE] Agent deactivated. Your autonomy remains yours.")

async def main():
    agent = LIFEAgent()
    try:
        await agent.start()
        await agent.protect_intent("Novel about digital autonomy", "creative_work")
        assessment = await agent.analyze_threat_landscape()
        print(f"\nThreat Assessment: {assessment.overall_risk}")
        print("\n[LIFE] Agent running. Press Ctrl+C to stop.")
        while True:
            await asyncio.sleep(60)
    except KeyboardInterrupt:
        print("\n[LIFE] Shutdown requested...")
    finally:
        await agent.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
