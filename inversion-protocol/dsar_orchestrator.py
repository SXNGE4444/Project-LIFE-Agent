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
