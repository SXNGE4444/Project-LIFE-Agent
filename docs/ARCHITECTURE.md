# Architecture Overview

## System Components

1. **Browser Extension** (Legibility Engine)
   - Content script for DOM analysis
   - Background service worker
   - Popup UI for harm reports

2. **Inversion Protocol** (Python)
   - DSAR orchestrator
   - Template system
   - Company database

3. **Intent Vault** (Python + Ollama)
   - Local LLM integration
   - Intent database
   - Fingerprint detection

4. **Swarm Layer** (Node.js + libp2p)
   - P2P coordination
   - Exit signaling
   - Privacy-preserving proofs

## Data Flow
User → Browser Extension → Pattern Detection → Harm Report
User → DSAR Orchestrator → Email/Web Form → Corporate DPO
User → Intent Vault → Local LLM → Fingerprint Alerts
User → Swarm Node → P2P Network → Coordinated Exit
