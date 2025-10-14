"""
Named Entity Recognition (NER) Service
Extract entities from documents using spaCy and custom patterns
Real estate-specific entity extraction
"""

import spacy
import re
import dateparser
from typing import List, Dict, Optional, Tuple
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NERService:
    """
    Named Entity Recognition for real estate documents
    Combines spaCy NER with custom regex patterns
    """

    def __init__(self, model: str = 'en_core_web_lg'):
        """
        Initialize NER service

        Args:
            model: spaCy model to use (en_core_web_lg recommended)
        """
        try:
            self.nlp = spacy.load(model)
            logger.info(f"Loaded spaCy model: {model}")
        except OSError:
            logger.warning(f"Model {model} not found, downloading...")
            import subprocess
            subprocess.run(['python', '-m', 'spacy', 'download', model])
            self.nlp = spacy.load(model)

        # Custom regex patterns for real estate documents
        self.patterns = {
            'SSN': r'\b\d{3}-\d{2}-\d{4}\b',
            'PHONE_NUMBER': r'\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b',
            'EMAIL_ADDRESS': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'PARCEL_NUMBER': r'\b\d{3}-\d{3}-\d{3,4}\b',
            'LOAN_NUMBER': r'\b[A-Z]{2}\d{8,12}\b',
            'CASE_NUMBER': r'\b(Case|File)\s*#?\s*(\d{4,8})\b',
            'MONETARY_AMOUNT': r'\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
            'PERCENTAGE': r'\b\d{1,3}\.\d{1,2}%\b',
            'LICENSE_NUMBER': r'\b(?:License|Lic\.?|LIC)\s*#?\s*([A-Z0-9]{6,12})\b',
            'TAX_ID': r'\b\d{2}-\d{7}\b',
            'ZIP_CODE': r'\b\d{5}(?:-\d{4})?\b',
            'ESCROW_NUMBER': r'\b(?:Escrow|ESC)\s*#?\s*(\d{6,10})\b',
        }

        # Address patterns
        self.address_patterns = {
            'STREET_ADDRESS': r'\b\d{1,5}\s+[A-Za-z0-9\s,\.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Place|Pl)\b',
            'STATE': r'\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b',
        }

        # Date patterns
        self.date_keywords = [
            'closing date', 'contract date', 'birth date', 'date of birth',
            'effective date', 'expiration date', 'signed on', 'dated'
        ]

        logger.info('NER Service initialized with custom patterns')

    def extract_entities(self, text: str, page_number: int = 1) -> List[Dict]:
        """
        Extract all entities from text

        Args:
            text: Input text
            page_number: Page number in document

        Returns:
            List of extracted entities with metadata
        """
        entities = []

        # SpaCy NER
        spacy_entities = self._extract_spacy_entities(text, page_number)
        entities.extend(spacy_entities)

        # Regex pattern matching
        regex_entities = self._extract_regex_entities(text, page_number)
        entities.extend(regex_entities)

        # Address extraction
        address_entities = self._extract_addresses(text, page_number)
        entities.extend(address_entities)

        # Date extraction
        date_entities = self._extract_dates(text, page_number)
        entities.extend(date_entities)

        # Deduplicate and normalize
        entities = self._deduplicate_entities(entities)

        logger.info(f"Extracted {len(entities)} entities from page {page_number}")
        return entities

    def _extract_spacy_entities(self, text: str, page_number: int) -> List[Dict]:
        """Extract entities using spaCy"""
        entities = []
        doc = self.nlp(text)

        for ent in doc.ents:
            entity_type = self._map_spacy_label(ent.label_)

            if entity_type:
                entities.append({
                    'entity_type': entity_type,
                    'entity_value': ent.text,
                    'confidence': 0.85,  # spaCy doesn't provide confidence directly
                    'page_number': page_number,
                    'start_position': ent.start_char,
                    'end_position': ent.end_char,
                    'extraction_method': 'SPACY',
                    'context_text': self._get_context(text, ent.start_char, ent.end_char)
                })

        return entities

    def _map_spacy_label(self, label: str) -> Optional[str]:
        """Map spaCy entity labels to our EntityType enum"""
        mapping = {
            'PERSON': 'PERSON_NAME',
            'ORG': 'COMPANY_NAME',
            'GPE': 'PROPERTY_ADDRESS',
            'MONEY': 'MONETARY_AMOUNT',
            'DATE': 'DATE',
            'TIME': 'DATE',
            'PERCENT': 'MONETARY_AMOUNT',
            'CARDINAL': None,  # Usually not useful
            'ORDINAL': None,
        }
        return mapping.get(label)

    def _extract_regex_entities(self, text: str, page_number: int) -> List[Dict]:
        """Extract entities using regex patterns"""
        entities = []

        for entity_type, pattern in self.patterns.items():
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = match.group()

                # Special handling for masked SSN
                if entity_type == 'SSN':
                    value = self._mask_ssn(value)

                entities.append({
                    'entity_type': entity_type,
                    'entity_value': value,
                    'confidence': 0.95,  # High confidence for regex matches
                    'page_number': page_number,
                    'start_position': match.start(),
                    'end_position': match.end(),
                    'extraction_method': 'REGEX',
                    'context_text': self._get_context(text, match.start(), match.end())
                })

        return entities

    def _extract_addresses(self, text: str, page_number: int) -> List[Dict]:
        """Extract addresses using specialized patterns"""
        entities = []

        # Extract street addresses
        for match in re.finditer(self.address_patterns['STREET_ADDRESS'], text, re.IGNORECASE):
            street_address = match.group()

            # Try to find associated city, state, zip
            context = text[match.end():match.end() + 100]
            state_match = re.search(self.address_patterns['STATE'], context)
            zip_match = re.search(self.patterns['ZIP_CODE'], context)

            full_address = street_address
            if state_match:
                full_address += f", {state_match.group()}"
            if zip_match:
                full_address += f" {zip_match.group()}"

            entities.append({
                'entity_type': 'PROPERTY_ADDRESS',
                'entity_value': full_address.strip(),
                'confidence': 0.90,
                'page_number': page_number,
                'start_position': match.start(),
                'end_position': match.end(),
                'extraction_method': 'REGEX',
                'context_text': self._get_context(text, match.start(), match.end()),
                'metadata': {
                    'street': street_address,
                    'state': state_match.group() if state_match else None,
                    'zip': zip_match.group() if zip_match else None
                }
            })

        return entities

    def _extract_dates(self, text: str, page_number: int) -> List[Dict]:
        """Extract and normalize dates with context"""
        entities = []

        # Split into sentences for context
        sentences = text.split('.')

        for sentence in sentences:
            sentence = sentence.strip()

            # Check for date keywords
            date_type = None
            for keyword in self.date_keywords:
                if keyword.lower() in sentence.lower():
                    date_type = self._classify_date_type(keyword)
                    break

            # Try to parse date from sentence
            parsed_date = dateparser.parse(
                sentence,
                settings={
                    'STRICT_PARSING': False,
                    'PREFER_DATES_FROM': 'past',
                    'RETURN_AS_TIMEZONE_AWARE': False
                }
            )

            if parsed_date and parsed_date.year > 1900 and parsed_date.year < 2100:
                entities.append({
                    'entity_type': date_type or 'DATE',
                    'entity_value': parsed_date.strftime('%Y-%m-%d'),
                    'confidence': 0.75,
                    'page_number': page_number,
                    'extraction_method': 'DATEPARSER',
                    'context_text': sentence[:100],
                    'metadata': {
                        'original_text': sentence,
                        'date_type': date_type
                    },
                    'normalized_value': parsed_date.isoformat()
                })

        return entities

    def _classify_date_type(self, keyword: str) -> str:
        """Classify date type based on context keyword"""
        keyword = keyword.lower()
        if 'closing' in keyword:
            return 'CLOSING_DATE'
        elif 'contract' in keyword:
            return 'CONTRACT_DATE'
        elif 'birth' in keyword:
            return 'BIRTH_DATE'
        else:
            return 'DATE'

    def _get_context(self, text: str, start: int, end: int,
                     context_chars: int = 50) -> str:
        """Get surrounding context for an entity"""
        context_start = max(0, start - context_chars)
        context_end = min(len(text), end + context_chars)
        context = text[context_start:context_end]
        return context.strip()

    def _mask_ssn(self, ssn: str) -> str:
        """Mask SSN for security (show only last 4 digits)"""
        return f"***-**-{ssn[-4:]}"

    def _deduplicate_entities(self, entities: List[Dict]) -> List[Dict]:
        """
        Remove duplicate entities based on value and type
        Keep the one with highest confidence
        """
        seen = {}

        for entity in entities:
            key = (entity['entity_type'], entity['entity_value'])

            if key not in seen or entity['confidence'] > seen[key]['confidence']:
                seen[key] = entity

        return list(seen.values())

    def extract_person_names(self, text: str, page_number: int = 1) -> List[Dict]:
        """Extract only person names with role classification"""
        entities = self.extract_entities(text, page_number)

        person_entities = [e for e in entities if e['entity_type'] in [
            'PERSON_NAME', 'AGENT_NAME', 'ATTORNEY_NAME', 'NOTARY_NAME'
        ]]

        # Try to classify roles based on context
        for entity in person_entities:
            context = entity.get('context_text', '').lower()

            if any(word in context for word in ['buyer', 'purchaser']):
                entity['metadata'] = {'role': 'buyer'}
            elif any(word in context for word in ['seller', 'vendor']):
                entity['metadata'] = {'role': 'seller'}
            elif any(word in context for word in ['agent', 'broker']):
                entity['metadata'] = {'role': 'agent'}
            elif any(word in context for word in ['attorney', 'lawyer']):
                entity['metadata'] = {'role': 'attorney'}
            elif any(word in context for word in ['notary']):
                entity['metadata'] = {'role': 'notary'}

        return person_entities

    def extract_financial_entities(self, text: str, page_number: int = 1) -> List[Dict]:
        """Extract financial entities (amounts, percentages, loan info)"""
        entities = self.extract_entities(text, page_number)

        financial_entities = [e for e in entities if e['entity_type'] in [
            'MONETARY_AMOUNT', 'PERCENTAGE', 'LOAN_NUMBER'
        ]]

        return financial_entities


# Example usage
if __name__ == '__main__':
    ner = NERService()

    sample_text = """
    Purchase Agreement

    Buyer: John Smith, 123 Main Street, Los Angeles, CA 90001
    Seller: Jane Doe
    Property: 456 Oak Avenue, Beverly Hills, CA 90210

    Purchase Price: $1,250,000.00
    Earnest Money: $50,000.00
    Closing Date: December 15, 2024

    Buyer's Agent: Robert Johnson (License #12345678)
    Phone: (555) 123-4567
    Email: robert@realestate.com

    Loan Number: AB123456789
    """

    entities = ner.extract_entities(sample_text)

    print(f"\nExtracted {len(entities)} entities:")
    for entity in entities:
        print(f"  {entity['entity_type']}: {entity['entity_value']} " +
              f"(confidence: {entity['confidence']:.2f})")
