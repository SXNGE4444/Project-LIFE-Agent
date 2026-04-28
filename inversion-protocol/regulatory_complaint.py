"""
regulatory_complaint.py — Project LIFE Agent
Automated Regulatory Complaint Generation

Turns corporate non-compliance into regulatory liability.
"""

import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class RegulatoryAuthority:
    name: str
    country: str
    jurisdiction: str
    complaint_portal_url: str
    email: Optional[str] = None
    average_response_time_days: int = 90
    has_online_complaint_form: bool = True


@dataclass
class ViolationEvidence:
    violation_type: str
    company_name: str
    company_jurisdiction: str
    date_first_observed: str
    date_last_observed: str
    description: str
    evidence_urls: List[str] = field(default_factory=list)
    screenshots: List[str] = field(default_factory=list)
    network_logs: List[str] = field(default_factory=list)
    communication_history: List[Dict] = field(default_factory=list)
    relevant_law_violations: List[str] = field(default_factory=list)


class RegulatoryComplaintGenerator:
    def __init__(self):
        self.authorities = self._load_authorities()
        self.complaint_templates = self._load_templates()
        
    def _load_authorities(self) -> Dict[str, RegulatoryAuthority]:
        return {
            'ico_uk': RegulatoryAuthority(name="Information Commissioner's Office", country='United Kingdom', jurisdiction='UK GDPR', complaint_portal_url='https://ico.org.uk/make-a-complaint/', email='casework@ico.org.uk'),
            'cnil_fr': RegulatoryAuthority(name='CNIL', country='France', jurisdiction='GDPR', complaint_portal_url='https://www.cnil.fr/fr/plaintes'),
            'bdsg_de': RegulatoryAuthority(name='BfDI', country='Germany', jurisdiction='GDPR', complaint_portal_url='https://www.bfdi.bund.de/'),
            'ag_ca': RegulatoryAuthority(name='California Attorney General', country='United States', jurisdiction='CCPA', complaint_portal_url='https://oag.ca.gov/privacy/ccpa'),
            'ap_netherlands': RegulatoryAuthority(name='Autoriteit Persoonsgegevens', country='Netherlands', jurisdiction='GDPR', complaint_portal_url='https://autoriteitpersoonsgegevens.nl/'),
            'edpb_eu': RegulatoryAuthority(name='European Data Protection Board', country='European Union', jurisdiction='GDPR', complaint_portal_url='https://edpb.europa.eu/'),
        }
    
    def _load_templates(self) -> Dict[str, str]:
        return {
            'dsar_non_compliance': """
COMPLAINT REGARDING DATA SUBJECT ACCESS REQUEST NON-COMPLIANCE

To: {authority_name}
Date: {date}
Re: Violation of {regulation} by {company_name}

I. SUMMARY
I submitted a DSAR to {company_name} on {dsar_date} pursuant to {regulation_article}.
As of {current_date}, {days_elapsed} days have elapsed without satisfactory response.
Under {regulation}, the controller must respond within {deadline_days} days.
{company_name} has failed to comply.

II. CHRONOLOGY
{chronology}

III. EVIDENCE
{evidence_list}

IV. REQUESTED REMEDIES
1. Investigate {company_name}'s non-compliance
2. Order immediate fulfillment of my DSAR
3. Impose appropriate fines
4. Order compliant DSAR procedures

Signed,
{complainant_name}
{complainant_email}
""",
            'dark_pattern_violation': """
COMPLAINT REGARDING DECEPTIVE DESIGN PATTERNS

To: {authority_name}
Date: {date}
Re: Violation by {company_name} — Deceptive Design

I. SUMMARY
{company_name} deploys dark patterns manipulating users against their interests,
violating: {violations_list}

II. DETECTED PATTERNS
{patterns_detected}

III. HARM
{harm_description}

IV. EVIDENCE
{evidence_list}

V. REQUESTED ACTION
1. Investigate illegal dark patterns
2. Order removal of manipulative patterns
3. Impose penalties
4. Require UX audits

Signed,
{complainant_name}
""",
        }
    
    def generate_dsar_non_compliance_complaint(self, company_name: str, dsar_date: str, authority_id: str, complainant_name: str, complainant_email: str, evidence: ViolationEvidence) -> str:
        authority = self.authorities.get(authority_id, self.authorities['ico_uk'])
        template = self.complaint_templates['dsar_non_compliance']
        dsar_datetime = datetime.fromisoformat(dsar_date)
        days_elapsed = (datetime.now() - dsar_datetime).days
        return template.format(
            authority_name=authority.name, date=datetime.now().strftime('%Y-%m-%d'),
            regulation=authority.jurisdiction, regulation_article='Article 15 GDPR' if 'GDPR' in authority.jurisdiction else authority.jurisdiction,
            company_name=company_name, dsar_date=dsar_date, current_date=datetime.now().strftime('%Y-%m-%d'),
            days_elapsed=days_elapsed, deadline_days=30,
            chronology=self._format_chronology(evidence.communication_history),
            evidence_list=self._format_evidence(evidence),
            complainant_name=complainant_name, complainant_email=complainant_email,
        )
    
    def generate_dark_pattern_complaint(self, company_name: str, authority_id: str, patterns_detected: List[Dict], complainant_name: str, complainant_email: str, evidence: ViolationEvidence) -> str:
        authority = self.authorities.get(authority_id, self.authorities['ico_uk'])
        template = self.complaint_templates['dark_pattern_violation']
        legal_mapping = {
            'urgency': 'FTC Act Section 5 — Unfair practices',
            'misdirection': 'GDPR Article 25 — Data protection by design',
            'confirmshaming': 'GDPR Article 7 — Conditions for consent',
            'sneaking': 'GDPR Article 5(1)(a) — Lawfulness',
            'obstruction': 'GDPR Article 12 — Transparent information',
            'forced_action': 'GDPR Article 7(4) — Freely given consent',
            'hidden_information': 'GDPR Article 5(1)(a) — Transparency',
        }
        violations = set()
        for pattern in patterns_detected:
            category = pattern.get('category', '')
            if category in legal_mapping: violations.add(legal_mapping[category])
        harm_list = []
        for pattern in patterns_detected:
            category = pattern.get('category', '')
            if category in ['obstruction']: harm_list.append(f"- {pattern.get('type', category)}: Users prevented from exercising legal rights")
            elif category in ['confirmshaming']: harm_list.append(f"- {pattern.get('type', category)}: Emotional manipulation")
        return template.format(
            authority_name=authority.name, date=datetime.now().strftime('%Y-%m-%d'),
            regulation=authority.jurisdiction, company_name=company_name,
            violations_list='\n'.join([f'- {v}' for v in violations]) if violations else '- GDPR Article 25',
            patterns_detected='\n'.join([f"  • {p.get('type', p.get('category', 'unknown'))}: {p.get('description', p.get('harm', 'Manipulative design'))}" for p in patterns_detected]),
            harm_description='\n'.join(harm_list) if harm_list else 'Users systematically manipulated.',
            evidence_list=self._format_evidence(evidence),
            complainant_name=complainant_name,
        )
    
    def _format_chronology(self, communications: List[Dict]) -> str:
        if not communications: return "No communications to report."
        return '\n'.join([f"  {c.get('date', 'Unknown')}: {c.get('action', 'Unknown')} — {c.get('details', '')}" for c in sorted(communications, key=lambda x: x.get('date', ''))])
    
    def _format_evidence(self, evidence: ViolationEvidence) -> str:
        items = []
        if evidence.evidence_urls: items.extend(["URLs where violations observed:"] + [f"  - {url}" for url in evidence.evidence_urls])
        if evidence.screenshots: items.append(f"Screenshots: {len(evidence.screenshots)} files")
        if evidence.network_logs: items.append("Network analysis available")
        if evidence.communication_history: items.append(f"Communication history: {len(evidence.communication_history)} exchanges")
        return '\n'.join(items) if items else "Evidence available upon request"
    
    def file_complaint(self, complaint_text: str, authority_id: str) -> bool:
        authority = self.authorities.get(authority_id)
        if not authority:
            print(f"[COMPLAINT] Unknown authority: {authority_id}")
            return False
        print(f"\n{'='*60}")
        print(f"REGULATORY COMPLAINT FILED")
        print(f"To: {authority.name}")
        print(f"Jurisdiction: {authority.jurisdiction}")
        print(f"Submit via: {authority.complaint_portal_url}")
        print(f"{'='*60}\n")
        complaints_dir = Path.home() / ".life-agent" / "complaints"
        complaints_dir.mkdir(parents=True, exist_ok=True)
        filename = f"complaint_{authority_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(complaints_dir / filename, 'w') as f:
            f.write(complaint_text)
        print(f"[COMPLAINT] Saved to: {complaints_dir / filename}")
        return True


def demonstrate_complaint_generation():
    generator = RegulatoryComplaintGenerator()
    print("\n╔══════════════════════════════════════════╗")
    print("║   REGULATORY COMPLAINT AUTOMATION       ║")
    print("╚══════════════════════════════════════════╝\n")
    
    evidence = ViolationEvidence(
        violation_type='dsar_non_compliance', company_name='Meta Platforms Inc.',
        company_jurisdiction='EU', date_first_observed='2024-03-01',
        date_last_observed=datetime.now().strftime('%Y-%m-%d'),
        description='Meta failed to respond to DSAR within 30-day deadline',
        evidence_urls=['https://facebook.com', 'https://instagram.com'],
        communication_history=[
            {'date': '2024-03-01', 'action': 'DSAR Submitted', 'details': 'Article 15 request sent to dpo@meta.com'},
            {'date': '2024-03-03', 'action': 'Automated Response', 'details': 'Identity verification requested'},
            {'date': '2024-03-31', 'action': 'Deadline Expired', 'details': '30-day deadline passed'},
        ]
    )
    complaint = generator.generate_dsar_non_compliance_complaint(
        company_name='Meta Platforms Inc.', dsar_date='2024-03-01',
        authority_id='ico_uk', complainant_name='John Doe',
        complainant_email='john@example.com', evidence=evidence,
    )
    print(complaint[:500] + "...\n")
    generator.file_complaint(complaint, 'ico_uk')


if __name__ == "__main__":
    demonstrate_complaint_generation()
