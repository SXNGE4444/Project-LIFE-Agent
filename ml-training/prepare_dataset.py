"""
prepare_dataset.py — Project LIFE Agent
ML Training Pipeline for Dark Pattern Detection
"""
import json
from pathlib import Path
from typing import Dict, List
from dataclasses import dataclass, field, asdict
import yaml

@dataclass
class LabeledExample:
    html_snippet: str
    text_content: str
    dark_pattern_category: str
    dark_pattern_type: str
    severity: str
    source_url: str
    detection_context: str
    harm_description: str
    label_confidence: float
    annotator_notes: str

class DatasetBuilder:
    def __init__(self, output_dir: str = "dataset"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.examples: List[LabeledExample] = []
        self.taxonomy = self._load_taxonomy()
        
    def _load_taxonomy(self) -> Dict:
        taxonomy_path = Path(__file__).parent.parent / "config" / "dark-patterns.yaml"
        if taxonomy_path.exists():
            with open(taxonomy_path, 'r') as f:
                return yaml.safe_load(f)
        return {}
    
    def generate_synthetic_examples(self, count_per_category: int = 100):
        templates = {
            'urgency': self._generate_urgency_examples,
            'misdirection': self._generate_misdirection_examples,
            'confirmshaming': self._generate_confirmshaming_examples,
            'sneaking': self._generate_sneaking_examples,
            'obstruction': self._generate_obstruction_examples,
            'forced_action': self._generate_forced_action_examples,
            'social_proof_fabrication': self._generate_social_proof_examples,
            'hidden_information': self._generate_hidden_information_examples,
            'nagging': self._generate_nagging_examples,
        }
        print(f"Generating synthetic examples...")
        for category, generator in templates.items():
            print(f"  Generating {count_per_category} examples for '{category}'...")
            self.examples.extend(generator(count_per_category))
        print(f"Total synthetic examples: {len(self.examples)}")
    
    def _generate_urgency_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        templates = [
            {'html': '<div class="urgency-banner"><span class="countdown">Sale ends in 04:32:17</span></div>',
             'text': 'Sale ends in 04:32:17', 'type': 'countdown_timer',
             'context': 'Countdown timers create artificial time pressure.'},
            {'html': '<div class="stock-indicator">Only 3 left in stock</div>',
             'text': 'Only 3 left in stock', 'type': 'false_scarcity',
             'context': 'Stock countdowns are often fabricated.'},
            {'html': '<div class="social-pressure">47 people are viewing this right now</div>',
             'text': '47 people are viewing this right now', 'type': 'false_social_pressure',
             'context': 'Viewer counts are typically randomized.'},
        ]
        for i in range(count):
            t = templates[i % len(templates)]
            examples.append(LabeledExample(
                html_snippet=t['html'], text_content=t['text'],
                dark_pattern_category='urgency', dark_pattern_type=t['type'],
                severity='high', source_url='synthetic://urgency',
                detection_context=t['context'],
                harm_description='Creates artificial time pressure to bypass rational decision-making.',
                label_confidence=1.0, annotator_notes='Synthetic urgency example.'
            ))
        return examples
    
    def _generate_misdirection_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<button class="accept-all" style="font-size:16px;padding:12px 24px;">Accept All</button><button style="font-size:11px;color:#999;">Settings</button>',
                text_content='Accept All | Settings',
                dark_pattern_category='misdirection', dark_pattern_type='visual_prominence',
                severity='high', source_url='synthetic://misdirection',
                detection_context='Exploitative option is visually prominent.',
                harm_description='Uses visual design to steer users toward harmful choices.',
                label_confidence=1.0, annotator_notes='Synthetic misdirection example.'
            ))
        return examples
    
    def _generate_confirmshaming_examples(self, count: int) -> List[LabeledExample]:
        phrases = ["No thanks, I don't want to save money", "I don't care about my privacy",
                    "No, I prefer paying full price", "I don't want exclusive deals"]
        examples = []
        for i in range(count):
            phrase = phrases[i % len(phrases)]
            examples.append(LabeledExample(
                html_snippet=f'<button class="decline-btn">{phrase}</button>',
                text_content=phrase, dark_pattern_category='confirmshaming',
                dark_pattern_type='emotional_manipulation', severity='medium',
                source_url='synthetic://confirmshaming',
                detection_context='Decline option uses guilt-inducing language.',
                harm_description='Manipulates user emotions through shame.',
                label_confidence=1.0, annotator_notes=f'Confirmshaming phrase: {phrase}'
            ))
        return examples
    
    def _generate_sneaking_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<form><input type="checkbox" checked> Add premium support (+$9.99/mo)</form>',
                text_content='Add premium support (+$9.99/mo)',
                dark_pattern_category='sneaking', dark_pattern_type='hidden_checkbox',
                severity='critical', source_url='synthetic://sneaking',
                detection_context='Additional cost is pre-selected.',
                harm_description='Adds costs without explicit consent.',
                label_confidence=1.0, annotator_notes='Synthetic sneaking example.'
            ))
        return examples
    
    def _generate_obstruction_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<p>To cancel, call 1-800-XXX-XXXX between 9am-5pm EST</p>',
                text_content='To cancel, call 1-800-XXX-XXXX',
                dark_pattern_category='obstruction', dark_pattern_type='forced_phone_cancel',
                severity='critical', source_url='synthetic://obstruction',
                detection_context='Cancellation requires a phone call during business hours.',
                harm_description='Makes user-beneficial actions deliberately difficult.',
                label_confidence=1.0, annotator_notes='Synthetic obstruction example.'
            ))
        return examples
    
    def _generate_forced_action_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<div class="paywall"><button>Sign up to continue reading</button></div>',
                text_content='Sign up to continue reading',
                dark_pattern_category='forced_action', dark_pattern_type='forced_registration',
                severity='high', source_url='synthetic://forced-action',
                detection_context='Content held hostage behind registration wall.',
                harm_description='Requires unrelated action before granting access.',
                label_confidence=1.0, annotator_notes='Synthetic forced action example.'
            ))
        return examples
    
    def _generate_social_proof_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<div class="testimonial">"Amazing product!" - John D. | Verified</div>',
                text_content='"Amazing product!" - John D. | Verified',
                dark_pattern_category='social_proof_fabrication', dark_pattern_type='fake_testimonials',
                severity='high', source_url='synthetic://social-proof',
                detection_context='Testimonials with generic names may be fabricated.',
                harm_description='Fabricates social proof to manipulate trust.',
                label_confidence=1.0, annotator_notes='Synthetic social proof example.'
            ))
        return examples
    
    def _generate_hidden_information_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<span class="price">$19.99</span><span style="font-size:6px;color:#ddd;">+ $9.99 fee + tax</span>',
                text_content='$19.99 + $9.99 fee + tax',
                dark_pattern_category='hidden_information', dark_pattern_type='hidden_fees',
                severity='critical', source_url='synthetic://hidden-info',
                detection_context='True cost obscured through tiny text.',
                harm_description='Conceals material facts for informed decisions.',
                label_confidence=1.0, annotator_notes='Synthetic hidden fee example.'
            ))
        return examples
    
    def _generate_nagging_examples(self, count: int) -> List[LabeledExample]:
        examples = []
        for i in range(count):
            examples.append(LabeledExample(
                html_snippet='<div style="position:fixed;bottom:0;z-index:99999;"><button>Open in App</button><button style="font-size:10px;">Continue to site</button></div>',
                text_content='Open in App | Continue to site',
                dark_pattern_category='nagging', dark_pattern_type='app_install_interstitial',
                severity='high', source_url='synthetic://nagging',
                detection_context='Option to continue in browser is visually diminished.',
                harm_description='Repeatedly interrupts experience to pressure app installation.',
                label_confidence=1.0, annotator_notes='Synthetic nagging example.'
            ))
        return examples
    
    def export_dataset(self, format: str = "jsonl"):
        output_path = self.output_dir / f"dark_patterns_dataset.{format}"
        print(f"\nExporting {len(self.examples)} examples to {output_path}...")
        if format == "jsonl":
            with open(output_path, 'w') as f:
                for example in self.examples:
                    f.write(json.dumps(asdict(example)) + '\n')
        elif format == "json":
            with open(output_path, 'w') as f:
                json.dump([asdict(e) for e in self.examples], f, indent=2)
        print(f"Dataset exported. Size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")
        self._print_statistics()
        return output_path
    
    def _print_statistics(self):
        categories = {}
        for example in self.examples:
            categories[example.dark_pattern_category] = categories.get(example.dark_pattern_category, 0) + 1
        print(f"\n{'='*50}")
        print(f"DATASET STATISTICS: {len(self.examples)} examples")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  {cat}: {count}")
        print(f"{'='*50}")

def main():
    builder = DatasetBuilder()
    print("╔══════════════════════════════════════════╗")
    print("║   PROJECT LIFE AGENT — ML PIPELINE      ║")
    print("╚══════════════════════════════════════════╝")
    builder.generate_synthetic_examples(count_per_category=500)
    builder.export_dataset(format="jsonl")
    print(f"\nNext: Train a transformer model for semantic detection")

if __name__ == "__main__":
    main()
