"""
Compliance Checker

Automated compliance validation for real estate documents:
- Required field validation
- Signature verification
- Date consistency checks
- Amount validation
- Format verification
"""

from typing import Dict, List, Optional
import re
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ComplianceChecker:
    """Document compliance checking service"""

    def __init__(self):
        """Initialize compliance checker with default rules"""
        self.rules = self._load_default_rules()

    def _load_default_rules(self) -> Dict:
        """
        Load default compliance rules by document category

        Returns:
            Dictionary of rules by category
        """
        return {
            'SETTLEMENT_STATEMENT': {
                'required_fields': [
                    'buyer_name', 'seller_name', 'property_address',
                    'sale_price', 'closing_date', 'loan_amount'
                ],
                'required_signatures': ['buyer', 'seller', 'closing_agent'],
                'date_checks': [
                    'closing_date_in_future',
                    'contract_date_before_closing'
                ],
                'amount_checks': [
                    'loan_amount_less_than_price',
                    'fees_reasonable'
                ],
                'format_checks': ['email_format', 'phone_format']
            },
            'PURCHASE_AGREEMENT': {
                'required_fields': [
                    'buyer_name', 'seller_name', 'property_address',
                    'purchase_price', 'earnest_money', 'closing_date',
                    'inspection_period'
                ],
                'required_signatures': ['buyer', 'seller'],
                'required_clauses': [
                    'contingencies', 'inspection_period', 'financing_terms'
                ],
                'date_checks': [
                    'closing_date_reasonable',
                    'inspection_period_valid'
                ],
                'amount_checks': [
                    'earnest_money_reasonable',
                    'purchase_price_positive'
                ]
            },
            'LOAN_APPLICATION': {
                'required_fields': [
                    'applicant_name', 'ssn', 'loan_amount',
                    'property_address', 'employment_info', 'income'
                ],
                'required_signatures': ['applicant'],
                'date_checks': ['application_date_valid'],
                'amount_checks': [
                    'loan_amount_positive',
                    'income_sufficient'
                ],
                'format_checks': ['ssn_format', 'email_format', 'phone_format']
            },
            'TITLE_INSURANCE': {
                'required_fields': [
                    'property_address', 'owner_name', 'policy_number',
                    'coverage_amount', 'effective_date'
                ],
                'required_signatures': ['insurer', 'owner'],
                'date_checks': ['effective_date_valid'],
                'amount_checks': ['coverage_amount_reasonable']
            },
            'DEED': {
                'required_fields': [
                    'grantor_name', 'grantee_name', 'property_description',
                    'consideration_amount', 'execution_date'
                ],
                'required_signatures': ['grantor', 'notary'],
                'required_clauses': ['legal_description'],
                'date_checks': ['execution_date_valid'],
                'format_checks': ['legal_description_format']
            }
        }

    def check_compliance(
        self,
        category: str,
        extracted_data: Dict,
        transaction_type: Optional[str] = None
    ) -> Dict:
        """
        Perform comprehensive compliance check

        Args:
            category: Document category
            extracted_data: Extracted document data
            transaction_type: Optional transaction type for context

        Returns:
            Comprehensive compliance report
        """
        logger.info(f"Starting compliance check for {category}")

        rules = self.rules.get(category, {})
        checks = []
        critical_issues = 0
        warnings = 0
        suggestions = 0

        # Check required fields
        field_check = self._check_required_fields(
            rules.get('required_fields', []),
            extracted_data
        )
        checks.append(field_check)
        if field_check['status'] == 'FAIL':
            critical_issues += 1
        elif field_check['status'] == 'WARNING':
            warnings += 1

        # Check signatures
        signature_check = self._check_signatures(
            rules.get('required_signatures', []),
            extracted_data.get('signatures', [])
        )
        checks.append(signature_check)
        if signature_check['status'] == 'FAIL':
            critical_issues += 1

        # Check required clauses
        if 'required_clauses' in rules:
            clause_check = self._check_required_clauses(
                rules['required_clauses'],
                extracted_data.get('clauses', [])
            )
            checks.append(clause_check)
            if clause_check['status'] == 'FAIL':
                critical_issues += 1

        # Check dates
        date_check = self._check_dates(
            rules.get('date_checks', []),
            extracted_data
        )
        checks.append(date_check)
        if date_check['status'] == 'FAIL':
            critical_issues += 1
        elif date_check['status'] == 'WARNING':
            warnings += 1

        # Check amounts
        amount_check = self._check_amounts(
            rules.get('amount_checks', []),
            extracted_data
        )
        checks.append(amount_check)
        if amount_check['status'] == 'WARNING':
            warnings += 1

        # Check format
        format_check = self._check_format(
            rules.get('format_checks', []),
            extracted_data
        )
        checks.append(format_check)
        if format_check['status'] == 'WARNING':
            suggestions += 1

        # Determine overall status
        if critical_issues > 0:
            overall_status = 'NON_COMPLIANT'
        elif warnings > 2:
            overall_status = 'PARTIALLY_COMPLIANT'
        elif warnings > 0:
            overall_status = 'NEEDS_REVIEW'
        else:
            overall_status = 'COMPLIANT'

        # Extract specific issues
        missing_signatures = signature_check.get('missing_signatures', [])
        missing_fields = field_check.get('missing_fields', [])
        date_inconsistencies = date_check.get('issues', [])
        format_issues = format_check.get('issues', [])

        result = {
            'overall_status': overall_status,
            'checks': checks,
            'critical_issues': critical_issues,
            'warnings': warnings,
            'suggestions': suggestions,
            'missing_signatures': missing_signatures,
            'missing_fields': missing_fields,
            'date_inconsistencies': date_inconsistencies,
            'format_issues': format_issues,
            'requires_review': critical_issues > 0 or warnings > 2
        }

        logger.info(f"Compliance check complete: {overall_status}, {critical_issues} critical, {warnings} warnings")

        return result

    def _check_required_fields(
        self,
        required: List[str],
        data: Dict
    ) -> Dict:
        """Check if all required fields are present and non-empty"""
        missing = []

        for field in required:
            # Support nested field access with dot notation
            value = self._get_nested_value(data, field)
            if value is None or (isinstance(value, str) and not value.strip()):
                missing.append(field)

        status = 'PASS' if not missing else 'FAIL'
        message = (
            f"Missing {len(missing)} required fields: {', '.join(missing)}"
            if missing else "All required fields present"
        )

        return {
            'check_name': 'Required Fields',
            'check_type': 'REQUIRED_FIELD',
            'status': status,
            'missing_fields': missing,
            'message': message,
            'severity': 'CRITICAL' if missing else None
        }

    def _check_signatures(
        self,
        required: List[str],
        signatures: List[Dict]
    ) -> Dict:
        """Validate all required signatures are present"""
        # Extract signature types from signature list
        if isinstance(signatures, list):
            signature_types = [
                sig.get('type') or sig.get('signer_role')
                for sig in signatures
                if isinstance(sig, dict)
            ]
        else:
            signature_types = []

        missing = [req for req in required if req not in signature_types]

        status = 'PASS' if not missing else 'FAIL'
        message = (
            f"Missing {len(missing)} required signatures: {', '.join(missing)}"
            if missing else "All signatures present"
        )

        return {
            'check_name': 'Signatures',
            'check_type': 'SIGNATURE',
            'status': status,
            'missing_signatures': missing,
            'message': message,
            'severity': 'CRITICAL' if missing else None
        }

    def _check_required_clauses(
        self,
        required: List[str],
        clauses: List[str]
    ) -> Dict:
        """Check if required clauses are present"""
        clause_text = ' '.join(clauses).lower()
        missing = []

        for clause in required:
            # Simple keyword matching
            if clause.lower().replace('_', ' ') not in clause_text:
                missing.append(clause)

        status = 'PASS' if not missing else 'FAIL'
        message = (
            f"Missing {len(missing)} required clauses: {', '.join(missing)}"
            if missing else "All required clauses present"
        )

        return {
            'check_name': 'Required Clauses',
            'check_type': 'CLAUSE_CHECK',
            'status': status,
            'missing_clauses': missing,
            'message': message,
            'severity': 'HIGH' if missing else None
        }

    def _check_dates(
        self,
        checks: List[str],
        data: Dict
    ) -> Dict:
        """Validate date consistency and logic"""
        issues = []

        for check in checks:
            if check == 'closing_date_in_future':
                closing_date = self._parse_date(data.get('closing_date'))
                if closing_date and closing_date < datetime.now():
                    issues.append("Closing date is in the past")

            elif check == 'contract_date_before_closing':
                contract_date = self._parse_date(data.get('contract_date'))
                closing_date = self._parse_date(data.get('closing_date'))
                if contract_date and closing_date and contract_date >= closing_date:
                    issues.append("Contract date must be before closing date")

            elif check == 'closing_date_reasonable':
                closing_date = self._parse_date(data.get('closing_date'))
                if closing_date:
                    days_until_closing = (closing_date - datetime.now()).days
                    if days_until_closing < 0:
                        issues.append("Closing date is in the past")
                    elif days_until_closing > 180:
                        issues.append("Closing date is more than 6 months away")

            elif check == 'inspection_period_valid':
                inspection_deadline = self._parse_date(data.get('inspection_deadline'))
                contract_date = self._parse_date(data.get('contract_date'))
                if inspection_deadline and contract_date:
                    days = (inspection_deadline - contract_date).days
                    if days < 1:
                        issues.append("Inspection period is too short (< 1 day)")
                    elif days > 30:
                        issues.append("Inspection period is unusually long (> 30 days)")

            elif check == 'application_date_valid':
                app_date = self._parse_date(data.get('application_date'))
                if app_date and app_date > datetime.now():
                    issues.append("Application date is in the future")

            elif check == 'effective_date_valid':
                effective_date = self._parse_date(data.get('effective_date'))
                if effective_date:
                    days_diff = abs((effective_date - datetime.now()).days)
                    if days_diff > 90:
                        issues.append("Effective date is more than 90 days from today")

            elif check == 'execution_date_valid':
                exec_date = self._parse_date(data.get('execution_date'))
                if exec_date and exec_date > datetime.now():
                    issues.append("Execution date is in the future")

        status = 'PASS' if not issues else ('WARNING' if len(issues) == 1 else 'FAIL')
        message = '; '.join(issues) if issues else "All dates are consistent"

        return {
            'check_name': 'Date Consistency',
            'check_type': 'DATE_CHECK',
            'status': status,
            'issues': issues,
            'message': message,
            'severity': 'HIGH' if len(issues) > 1 else ('MEDIUM' if issues else None)
        }

    def _check_amounts(
        self,
        checks: List[str],
        data: Dict
    ) -> Dict:
        """Validate financial amounts"""
        issues = []

        for check in checks:
            if check == 'loan_amount_less_than_price':
                loan_amount = self._parse_amount(data.get('loan_amount'))
                sale_price = self._parse_amount(data.get('sale_price') or data.get('purchase_price'))
                if loan_amount and sale_price and loan_amount > sale_price:
                    issues.append(f"Loan amount (${loan_amount:,.2f}) exceeds sale price (${sale_price:,.2f})")

            elif check == 'fees_reasonable':
                fees = data.get('fees', [])
                total_fees = sum(self._parse_amount(f.get('amount', 0)) for f in fees if isinstance(f, dict))
                sale_price = self._parse_amount(data.get('sale_price'))
                if sale_price and total_fees > sale_price * 0.1:  # Fees > 10% of price
                    issues.append(f"Total fees (${total_fees:,.2f}) exceed 10% of sale price")

            elif check == 'earnest_money_reasonable':
                earnest = self._parse_amount(data.get('earnest_money'))
                purchase_price = self._parse_amount(data.get('purchase_price'))
                if earnest and purchase_price:
                    percentage = (earnest / purchase_price) * 100
                    if percentage < 0.5:
                        issues.append(f"Earnest money ({percentage:.1f}%) is very low (< 0.5%)")
                    elif percentage > 10:
                        issues.append(f"Earnest money ({percentage:.1f}%) is very high (> 10%)")

            elif check == 'purchase_price_positive':
                price = self._parse_amount(data.get('purchase_price'))
                if price and price <= 0:
                    issues.append("Purchase price must be positive")

            elif check == 'loan_amount_positive':
                loan = self._parse_amount(data.get('loan_amount'))
                if loan and loan <= 0:
                    issues.append("Loan amount must be positive")

            elif check == 'income_sufficient':
                income = self._parse_amount(data.get('income'))
                loan_amount = self._parse_amount(data.get('loan_amount'))
                if income and loan_amount:
                    # Simple DTI check: monthly payment / monthly income
                    estimated_payment = loan_amount * 0.005  # Rough estimate
                    monthly_income = income / 12 if income > 100000 else income  # Adjust for annual vs monthly
                    if estimated_payment > monthly_income * 0.43:  # 43% DTI
                        issues.append("Debt-to-income ratio may be too high (> 43%)")

            elif check == 'coverage_amount_reasonable':
                coverage = self._parse_amount(data.get('coverage_amount'))
                property_value = self._parse_amount(data.get('property_value') or data.get('purchase_price'))
                if coverage and property_value and coverage < property_value:
                    issues.append(f"Coverage amount (${coverage:,.2f}) is less than property value (${property_value:,.2f})")

        status = 'PASS' if not issues else 'WARNING'
        message = '; '.join(issues) if issues else "All amounts are reasonable"

        return {
            'check_name': 'Amount Validation',
            'check_type': 'AMOUNT_CHECK',
            'status': status,
            'issues': issues,
            'message': message,
            'severity': 'MEDIUM' if issues else None
        }

    def _check_format(
        self,
        checks: List[str],
        data: Dict
    ) -> Dict:
        """Validate data formats"""
        issues = []

        for check in checks:
            if check == 'email_format':
                email = data.get('email') or data.get('applicant_email')
                if email and not self._is_valid_email(email):
                    issues.append(f"Invalid email format: {email}")

            elif check == 'phone_format':
                phone = data.get('phone') or data.get('applicant_phone')
                if phone and not self._is_valid_phone(phone):
                    issues.append(f"Invalid phone format: {phone}")

            elif check == 'ssn_format':
                ssn = data.get('ssn')
                if ssn and not self._is_valid_ssn(ssn):
                    issues.append("Invalid SSN format")

            elif check == 'legal_description_format':
                legal_desc = data.get('legal_description')
                if legal_desc and len(legal_desc) < 20:
                    issues.append("Legal description appears incomplete")

        status = 'PASS' if not issues else 'WARNING'
        message = '; '.join(issues) if issues else "All formats are valid"

        return {
            'check_name': 'Format Validation',
            'check_type': 'FORMAT_CHECK',
            'status': status,
            'issues': issues,
            'message': message,
            'severity': 'LOW' if issues else None
        }

    # Helper methods

    def _get_nested_value(self, data: Dict, key: str) -> any:
        """Get value from nested dictionary using dot notation"""
        keys = key.split('.')
        value = data

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return None

        return value

    def _parse_date(self, date_value: any) -> Optional[datetime]:
        """Parse date from various formats"""
        if isinstance(date_value, datetime):
            return date_value

        if isinstance(date_value, str):
            # Try common date formats
            formats = [
                '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y',
                '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S'
            ]

            for fmt in formats:
                try:
                    return datetime.strptime(date_value, fmt)
                except ValueError:
                    continue

        return None

    def _parse_amount(self, amount_value: any) -> Optional[float]:
        """Parse monetary amount from various formats"""
        if isinstance(amount_value, (int, float)):
            return float(amount_value)

        if isinstance(amount_value, str):
            # Remove currency symbols and commas
            cleaned = re.sub(r'[$,]', '', amount_value)
            try:
                return float(cleaned)
            except ValueError:
                return None

        return None

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _is_valid_phone(self, phone: str) -> bool:
        """Validate phone format"""
        # Remove common separators
        cleaned = re.sub(r'[-\s\(\)\.]', '', phone)
        # Should be 10-11 digits
        return bool(re.match(r'^\d{10,11}$', cleaned))

    def _is_valid_ssn(self, ssn: str) -> bool:
        """Validate SSN format"""
        # Remove hyphens
        cleaned = re.sub(r'-', '', ssn)
        # Should be exactly 9 digits
        return bool(re.match(r'^\d{9}$', cleaned))
