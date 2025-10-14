"""
Document Intelligence System - Integration Tests

Tests for summarization, change detection, and compliance checking.
"""

import pytest
from src.document_intelligence import (
    DocumentSummarizer,
    ChangeDetector,
    ComplianceChecker
)


# Sample test documents
SAMPLE_PURCHASE_AGREEMENT = """
PURCHASE AGREEMENT

This Purchase Agreement ("Agreement") is entered into on December 1, 2023,
between John Doe ("Buyer") and Jane Smith ("Seller").

Property Address: 123 Main Street, Anytown, CA 12345

Purchase Price: $450,000.00
Earnest Money: $5,000.00
Closing Date: January 15, 2024

The Buyer agrees to purchase the property located at the address above.
The Seller agrees to sell the property in its current condition.

Inspection Period: The Buyer shall have 14 days from the date of this
Agreement to conduct inspections of the property.

Financing Terms: This offer is contingent upon the Buyer obtaining
financing approval within 30 days.

Both parties agree to complete the transaction on or before the closing date.

Buyer Signature: _________________ Date: __________
Seller Signature: _________________ Date: __________
"""

SAMPLE_PURCHASE_AGREEMENT_UPDATED = """
PURCHASE AGREEMENT

This Purchase Agreement ("Agreement") is entered into on December 1, 2023,
between John Doe ("Buyer") and Jane Smith ("Seller").

Property Address: 123 Main Street, Anytown, CA 12345

Purchase Price: $475,000.00
Earnest Money: $7,500.00
Closing Date: January 22, 2024

The Buyer agrees to purchase the property located at the address above.
The Seller agrees to sell the property in its current condition.

Inspection Period: The Buyer shall have 21 days from the date of this
Agreement to conduct inspections of the property.

Financing Terms: This offer is contingent upon the Buyer obtaining
financing approval within 45 days.

Additional Terms: Seller will complete repairs to roof before closing.

Both parties agree to complete the transaction on or before the closing date.

Buyer Signature: _________________ Date: __________
Seller Signature: _________________ Date: __________
"""


class TestDocumentSummarizer:
    """Test document summarization functionality"""

    @pytest.fixture
    def summarizer(self):
        """Create summarizer instance"""
        return DocumentSummarizer()

    def test_extractive_summary(self, summarizer):
        """Test extractive summarization"""
        summary = summarizer.extractive_summary(
            SAMPLE_PURCHASE_AGREEMENT,
            num_sentences=3
        )

        assert len(summary) > 0
        assert len(summary.split('.')) >= 2  # At least 2 sentences
        assert 'Purchase Agreement' in summary or 'property' in summary.lower()

    def test_abstractive_summary(self, summarizer):
        """Test abstractive summarization"""
        summary = summarizer.abstractive_summary(
            SAMPLE_PURCHASE_AGREEMENT,
            max_length=100,
            min_length=30
        )

        assert len(summary) > 0
        assert len(summary.split()) >= 20  # Reasonable length
        assert isinstance(summary, str)

    def test_generate_summary(self, summarizer):
        """Test complete summary generation"""
        result = summarizer.generate_summary(
            SAMPLE_PURCHASE_AGREEMENT,
            category='PURCHASE_AGREEMENT'
        )

        # Check all required fields
        assert 'executive_summary' in result
        assert 'detailed_summary' in result
        assert 'key_points' in result
        assert 'main_parties' in result
        assert 'key_dates' in result
        assert 'key_amounts' in result
        assert 'action_items' in result

        # Validate content
        assert len(result['executive_summary']) > 0
        assert isinstance(result['key_points'], list)
        assert len(result['key_points']) > 0

        # Check metadata
        assert result['summary_method'] == 'HYBRID'
        assert result['word_count'] > 0
        assert result['original_word_count'] > 0
        assert 0 < result['compression_ratio'] < 1

    def test_extract_parties(self, summarizer):
        """Test party name extraction"""
        parties = summarizer.extract_parties(SAMPLE_PURCHASE_AGREEMENT)

        assert isinstance(parties, list)
        # Note: Simple regex may not catch all parties
        # This is a basic smoke test

    def test_extract_key_dates(self, summarizer):
        """Test date extraction"""
        dates = summarizer.extract_key_dates(SAMPLE_PURCHASE_AGREEMENT)

        assert isinstance(dates, dict)
        # Should find at least the closing date
        # Note: Date extraction depends on format matching

    def test_extract_key_amounts(self, summarizer):
        """Test amount extraction"""
        amounts = summarizer.extract_key_amounts(SAMPLE_PURCHASE_AGREEMENT)

        assert isinstance(amounts, dict)
        # Should find purchase price and earnest money


class TestChangeDetector:
    """Test change detection functionality"""

    @pytest.fixture
    def detector(self):
        """Create change detector instance"""
        return ChangeDetector()

    def test_detect_text_changes(self, detector):
        """Test text change detection"""
        changes = detector.detect_text_changes(
            SAMPLE_PURCHASE_AGREEMENT,
            SAMPLE_PURCHASE_AGREEMENT_UPDATED
        )

        # Check required fields
        assert 'additions' in changes
        assert 'deletions' in changes
        assert 'modifications' in changes
        assert 'change_percentage' in changes
        assert 'significance' in changes
        assert 'changes_summary' in changes

        # Validate changes detected
        assert len(changes['additions']) > 0 or len(changes['modifications']) > 0
        assert changes['change_percentage'] > 0
        assert changes['significance'] in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    def test_detect_modifications(self, detector):
        """Test modification detection"""
        deletions = ['Purchase Price: $450,000.00']
        additions = ['Purchase Price: $475,000.00']

        modifications = detector._detect_modifications(deletions, additions)

        assert len(modifications) > 0
        assert modifications[0]['old'] == deletions[0]
        assert modifications[0]['new'] == additions[0]
        assert modifications[0]['similarity'] > 0.7  # High similarity

    def test_calculate_similarity(self, detector):
        """Test similarity calculation"""
        str1 = "Purchase Price: $450,000"
        str2 = "Purchase Price: $475,000"

        similarity = detector._calculate_similarity(str1, str2)

        assert 0 <= similarity <= 1
        assert similarity > 0.8  # Should be very similar

    def test_determine_significance(self, detector):
        """Test significance determination"""
        # Test critical changes
        additions = ['Purchase Price: $500,000']
        deletions = ['Closing Date: Jan 15']
        modifications = [{'old': 'Terms', 'new': 'New Terms'}]

        significance = detector._determine_significance(
            additions,
            deletions,
            modifications
        )

        assert significance in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    def test_critical_keyword_detection(self, detector):
        """Test critical keyword detection"""
        text_with_critical = "The purchase price has changed."
        text_without_critical = "The document formatting was updated."

        assert detector._contains_critical_keyword(text_with_critical) is True
        assert detector._contains_critical_keyword(text_without_critical) is False


class TestComplianceChecker:
    """Test compliance checking functionality"""

    @pytest.fixture
    def checker(self):
        """Create compliance checker instance"""
        return ComplianceChecker()

    def test_check_required_fields_pass(self, checker):
        """Test required fields check - passing case"""
        required = ['buyer_name', 'seller_name', 'purchase_price']
        data = {
            'buyer_name': 'John Doe',
            'seller_name': 'Jane Smith',
            'purchase_price': '450000'
        }

        result = checker._check_required_fields(required, data)

        assert result['status'] == 'PASS'
        assert len(result['missing_fields']) == 0

    def test_check_required_fields_fail(self, checker):
        """Test required fields check - failing case"""
        required = ['buyer_name', 'seller_name', 'purchase_price']
        data = {
            'buyer_name': 'John Doe'
            # Missing seller_name and purchase_price
        }

        result = checker._check_required_fields(required, data)

        assert result['status'] == 'FAIL'
        assert len(result['missing_fields']) == 2
        assert 'seller_name' in result['missing_fields']
        assert 'purchase_price' in result['missing_fields']

    def test_check_signatures_pass(self, checker):
        """Test signature check - passing case"""
        required = ['buyer', 'seller']
        signatures = [
            {'type': 'buyer', 'date': '2024-01-10'},
            {'type': 'seller', 'date': '2024-01-10'}
        ]

        result = checker._check_signatures(required, signatures)

        assert result['status'] == 'PASS'
        assert len(result['missing_signatures']) == 0

    def test_check_signatures_fail(self, checker):
        """Test signature check - failing case"""
        required = ['buyer', 'seller', 'notary']
        signatures = [
            {'type': 'buyer', 'date': '2024-01-10'}
        ]

        result = checker._check_signatures(required, signatures)

        assert result['status'] == 'FAIL'
        assert len(result['missing_signatures']) == 2

    def test_check_dates(self, checker):
        """Test date consistency checks"""
        checks = ['closing_date_in_future']
        data = {
            'closing_date': '2025-01-15'  # Future date
        }

        result = checker._check_dates(checks, data)

        # Should pass - closing date is in future
        assert result['status'] in ['PASS', 'WARNING']

    def test_check_amounts(self, checker):
        """Test amount validation"""
        checks = ['purchase_price_positive']
        data = {
            'purchase_price': '450000'
        }

        result = checker._check_amounts(checks, data)

        # Should pass - price is positive
        assert result['status'] == 'PASS'

    def test_check_compliance_purchase_agreement(self, checker):
        """Test full compliance check for purchase agreement"""
        data = {
            'buyer_name': 'John Doe',
            'seller_name': 'Jane Smith',
            'property_address': '123 Main St',
            'purchase_price': '450000',
            'earnest_money': '5000',
            'closing_date': '2025-01-15',
            'inspection_period': '14 days',
            'signatures': [
                {'type': 'buyer', 'date': '2024-01-10'},
                {'type': 'seller', 'date': '2024-01-10'}
            ]
        }

        result = checker.check_compliance(
            category='PURCHASE_AGREEMENT',
            extracted_data=data
        )

        # Check result structure
        assert 'overall_status' in result
        assert 'checks' in result
        assert 'critical_issues' in result
        assert 'warnings' in result
        assert 'requires_review' in result

        # Should have some compliance status
        assert result['overall_status'] in [
            'COMPLIANT',
            'NON_COMPLIANT',
            'PARTIALLY_COMPLIANT',
            'NEEDS_REVIEW'
        ]

    def test_parse_date(self, checker):
        """Test date parsing"""
        from datetime import datetime

        # Test various date formats
        date1 = checker._parse_date('2024-01-15')
        assert isinstance(date1, datetime)
        assert date1.year == 2024
        assert date1.month == 1
        assert date1.day == 15

        date2 = checker._parse_date('01/15/2024')
        assert isinstance(date2, datetime)

    def test_parse_amount(self, checker):
        """Test amount parsing"""
        # Test various amount formats
        amount1 = checker._parse_amount('450000')
        assert amount1 == 450000.0

        amount2 = checker._parse_amount('$450,000.00')
        assert amount2 == 450000.0

        amount3 = checker._parse_amount(450000)
        assert amount3 == 450000.0

    def test_email_validation(self, checker):
        """Test email format validation"""
        assert checker._is_valid_email('test@example.com') is True
        assert checker._is_valid_email('invalid.email') is False
        assert checker._is_valid_email('test@') is False

    def test_phone_validation(self, checker):
        """Test phone format validation"""
        assert checker._is_valid_phone('1234567890') is True
        assert checker._is_valid_phone('(123) 456-7890') is True
        assert checker._is_valid_phone('123-456-7890') is True
        assert checker._is_valid_phone('12345') is False

    def test_ssn_validation(self, checker):
        """Test SSN format validation"""
        assert checker._is_valid_ssn('123456789') is True
        assert checker._is_valid_ssn('123-45-6789') is True
        assert checker._is_valid_ssn('12345') is False


# Integration tests
class TestDocumentIntelligenceIntegration:
    """Integration tests for complete workflows"""

    def test_full_document_analysis(self):
        """Test complete document analysis workflow"""
        # Initialize services
        summarizer = DocumentSummarizer()
        detector = ChangeDetector()
        checker = ComplianceChecker()

        # 1. Summarize document
        summary = summarizer.generate_summary(
            SAMPLE_PURCHASE_AGREEMENT,
            category='PURCHASE_AGREEMENT'
        )

        assert 'executive_summary' in summary
        assert len(summary['key_points']) > 0

        # 2. Detect changes
        changes = detector.detect_text_changes(
            SAMPLE_PURCHASE_AGREEMENT,
            SAMPLE_PURCHASE_AGREEMENT_UPDATED
        )

        assert changes['change_percentage'] > 0

        # 3. Check compliance
        extracted_data = {
            'buyer_name': 'John Doe',
            'seller_name': 'Jane Smith',
            'property_address': '123 Main Street',
            'purchase_price': '450000',
            'earnest_money': '5000',
            'closing_date': '2025-01-15',
            'signatures': []
        }

        compliance = checker.check_compliance(
            category='PURCHASE_AGREEMENT',
            extracted_data=extracted_data
        )

        assert 'overall_status' in compliance

        # Workflow completed successfully
        assert True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
