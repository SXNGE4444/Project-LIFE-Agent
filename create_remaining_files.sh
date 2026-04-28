#!/bin/bash

# File 12: inversion-protocol/dsar_orchestrator.py
cat > inversion-protocol/dsar_orchestrator.py << 'EOF'
"""
dsar_orchestrator.py — Project LIFE Agent
Inversion Protocol: Flip the exploit. Weaponize your data rights.
"""
import json
import os
import smtplib
import ssl
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict

@dataclass
class Company:
    name: str
    legal_name: str
    jurisdiction: str
    dpo_email: Optional[str] = None
    privacy_email: Optional[str] = None
    web_form_url: Optional[str] = None
    physical_address: Optional[str] = None
    known_data_categories: List[str] = field(default_factory=list)
    risk_score: int = 0

@dataclass
class DSARResult:
    company: str
    status: str
    request_date: str
    response_date: Optional[str] = None
    data_received: bool = False
    data_size_mb: Optional[float] = None
    discrepancies_found: List[str] = field(default_factory=list)
    follow_up_actions: List[str] = field(default_factory=list)

class DSAROrchestrator:
    def __init__(self, config_path: str = "company_database.json"):
        self.config_path = config_path
        self.companies: List[Company] = []
        self.results: List[DSARResult] = []
        self.user_data = self._load_user_profile()
        self._load_company_database()

    def _load_user_profile(self) -> Dict:
        profile_path = Path.home() / ".life-agent" / "user_profile.json"
        if profile_path.exists():
            with open(profile_path, 'r') as f:
                return json.load(f)
        return {
            "full_name": os.environ.get("LIFE_USER_NAME", ""),
            "email": os.environ.get("LIFE_USER_EMAIL", ""),
        }

    def _load_company_database(self):
        db_path = Path(__file__).parent / "company_database.json"
        if db_path.exists():
            with open(db_path, 'r') as f:
                data = json.load(f)
                self.companies = [Company(**c) for c in data.get("companies", [])]

    def scan_for_data_brokers(self) -> List[Company]:
        identified = []
        major_brokers = [
            ("Acxiom", "US"), ("Experian", "US"), ("Equifax", "US"),
            ("TransUnion", "US"), ("LexisNexis", "US"), ("Oracle Data Cloud", "US"),
            ("Epsilon", "US"), ("CoreLogic", "US"), ("Spokeo", "US"),
        ]
        for name, jurisdiction in major_brokers:
            company = Company(
                name=name, legal_name=name, jurisdiction=jurisdiction,
                risk_score=9, known_data_categories=["personal_identifiers", "financial", "behavioral"]
            )
            identified.append(company)
        return identified

    def generate_dsar_request(self, company: Company, regulation: str = "gdpr") -> str:
        template_path = Path(__file__).parent / "templates" / f"{regulation}_request.txt"
        if template_path.exists():
            with open(template_path, 'r') as f:
                template = f.read()
        else:
            template = self._default_gdpr_template()
        return template.format(
            full_name=self.user_data.get("full_name", "[YOUR NAME]"),
            email=self.user_data.get("email", "[YOUR EMAIL]"),
            date=datetime.now().strftime("%Y-%m-%d"),
            company_name=company.name,
        )

    def _default_gdpr_template(self) -> str:
        return """Subject: Data Subject Access Request — Article 15 GDPR
To: {company_name} Data Protection Officer
Date: {date}

Under Article 15 of the GDPR, I request access to all personal data you process concerning me.

My identifying information:
- Name: {full_name}
- Email: {email}

Sincerely,
{full_name}
"""

    def send_dsar(self, company: Company, regulation: str = "gdpr", method: str = "auto") -> DSARResult:
        result = DSARResult(company=company.name, status="sent", request_date=datetime.now().isoformat())
        request_text = self.generate_dsar_request(company, regulation)
        
        if method in ["email", "auto"]:
            recipient = company.dpo_email or company.privacy_email
            if recipient:
                try:
                    self._send_email(to=recipient, subject=f"DSAR — Article 15 GDPR", body=request_text)
                    print(f"[INVERSION] DSAR sent to {company.name}")
                except Exception as e:
                    print(f"[INVERSION] Failed to email {company.name}: {e}")
                    result.status = "failed"
        return result

    def _send_email(self, to: str, subject: str, body: str):
        smtp_host = os.environ.get("LIFE_SMTP_HOST", "localhost")
        smtp_port = int(os.environ.get("LIFE_SMTP_PORT", "587"))
        smtp_user = os.environ.get("LIFE_SMTP_USER", "")
        smtp_pass = os.environ.get("LIFE_SMTP_PASS", "")
        
        msg = MIMEMultipart()
        msg['From'] = self.user_data.get('email', 'dsar@life-agent.local')
        msg['To'] = to
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            if smtp_user:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)

    def orchestrate_mass_dsar(self, max_companies: int = 20):
        brokers = self.scan_for_data_brokers()
        results = []
        print(f"\n{'='*60}")
        print(f"  INVERSION PROTOCOL — Mass DSAR Campaign")
        print(f"  Target: {len(brokers[:max_companies])} data processors")
        print(f"{'='*60}\n")
        
        for company in brokers[:max_companies]:
            print(f"  Processing: {company.name}...", end=" ")
            result = self.send_dsar(company, regulation="gdpr")
            results.append(result)
            print(f"[{result.status}]")
            time.sleep(1)
        
        sent = [r for r in results if r.status == 'sent']
        print(f"\n{'='*60}")
        print(f"  CAMPAIGN COMPLETE — Successfully sent: {len(sent)}")
        print(f"{'='*60}\n")
        return results

def main():
    import argparse
    parser = argparse.ArgumentParser(description="LIFE Agent — Inversion Protocol")
    parser.add_argument("--scan-all", action="store_true", help="Scan for data brokers and send DSARs")
    parser.add_argument("--target", type=str, help="Send DSAR to specific company")
    parser.add_argument("--max-companies", type=int, default=20)
    args = parser.parse_args()
    
    orchestrator = DSAROrchestrator()
    if args.scan_all:
        orchestrator.orchestrate_mass_dsar(max_companies=args.max_companies)
    elif args.target:
        company = Company(name=args.target, legal_name=args.target, jurisdiction="EU")
        result = orchestrator.send_dsar(company)
        print(json.dumps(asdict(result), indent=2))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
EOF

# File 13: inversion-protocol/requirements.txt
cat > inversion-protocol/requirements.txt << 'EOF'
requests>=2.31.0
pyyaml>=6.0.1
dataclasses>=0.6; python_version < '3.7'
EOF

# File 14: inversion-protocol/company_database.json
cat > inversion-protocol/company_database.json << 'EOF'
{
  "companies": [
    {
      "name": "Google",
      "legal_name": "Google LLC",
      "jurisdiction": "US",
      "dpo_email": "data-protection-office@google.com",
      "privacy_email": "privacy@google.com",
      "risk_score": 10,
      "known_data_categories": ["search", "location", "browsing", "email", "video", "social"]
    },
    {
      "name": "Meta",
      "legal_name": "Meta Platforms, Inc.",
      "jurisdiction": "US",
      "dpo_email": "dpo@meta.com",
      "privacy_email": "privacy@meta.com",
      "risk_score": 10,
      "known_data_categories": ["social", "browsing", "location", "biometric"]
    }
  ]
}
EOF

# File 15-17: Templates
cat > inversion-protocol/templates/gdpr_request.txt << 'EOF'
Subject: Data Subject Access Request — Article 15 GDPR

To: {company_name} Data Protection Officer

Date: {date}

Dear Data Protection Officer,

Under Article 15 of the General Data Protection Regulation (GDPR), I hereby
request access to all personal data you process concerning me. This request
covers, but is not limited to:

1. A copy of all personal data you hold about me, including inferred,
   derived, and observed data, across ALL systems and databases.
2. The purposes of the processing for EACH category of data.
3. The categories of personal data concerned.
4. The recipients or categories of recipients to whom the personal data
   has been or will be disclosed, including recipients in third countries.
5. Where possible, the envisaged period for which the data will be stored.
6. The existence of automated decision-making, including profiling, and
   meaningful information about the logic involved.
7. The source of the data if not collected directly from me.
8. Whether my data has been used for any form of testing, training, or
   model development, including machine learning models.

My identifying information:
- Name: {full_name}
- Email: {email}

I request this information in a structured, commonly used, and machine-
readable format (JSON preferred) as per Article 20.

Please confirm receipt within 48 hours. Under GDPR, you must respond
without undue delay and within one month.

Sincerely,
{full_name}
EOF

cat > inversion-protocol/templates/ccpa_request.txt << 'EOF'
Subject: California Consumer Privacy Act — Request to Know

To: {company_name}

Date: {date}

Under the California Consumer Privacy Act (CCPA), I request that you
disclose the following:

1. The categories of personal information you have collected about me.
2. The sources from which my personal information is collected.
3. The business purpose for collecting my personal information.
4. The categories of third parties with whom you share my information.
5. The specific pieces of personal information you hold about me.

Name: {full_name}
Email: {email}

Sincerely,
{full_name}
EOF

cat > inversion-protocol/templates/dispute_letter.txt << 'EOF'
Subject: Formal Dispute — Incorrect Personal Data

To: {company_name}

Date: {date}

I am writing to formally dispute the accuracy of personal data held
by your organization.

Disputed Information: {disputed_info}
Correct Information: {correct_info}
Evidence Attached: {evidence_summary}

Under applicable data protection regulations, you are required to
rectify inaccurate personal data without undue delay.

Sincerely,
{full_name}
EOF

echo "All remaining files created successfully!"
