"""
Table Extraction Service
Extract and parse tables from documents
Handles multi-page tables, merged cells, and complex layouts
"""

import pandas as pd
from typing import List, Dict, Optional, Tuple
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TableExtractor:
    """
    Extract and parse tables from OCR results
    Supports both Tesseract and Textract outputs
    """

    def __init__(self):
        """Initialize table extractor"""
        logger.info('Table Extractor initialized')

    def extract_tables_from_textract(self, blocks: List[Dict],
                                     page_number: int = 1) -> List[Dict]:
        """
        Extract tables from AWS Textract blocks

        Args:
            blocks: Textract response blocks
            page_number: Page number in document

        Returns:
            List of extracted tables with metadata
        """
        tables = []

        # Find table blocks
        table_blocks = [b for b in blocks if b['BlockType'] == 'TABLE']

        for idx, table_block in enumerate(table_blocks):
            try:
                table_data = self._parse_textract_table(table_block, blocks)

                if table_data:
                    table_data['page_number'] = page_number
                    table_data['table_index'] = idx
                    tables.append(table_data)

            except Exception as e:
                logger.error(f"Failed to parse table {idx}: {str(e)}")

        logger.info(f"Extracted {len(tables)} tables from page {page_number}")
        return tables

    def _parse_textract_table(self, table_block: Dict,
                              all_blocks: List[Dict]) -> Optional[Dict]:
        """Parse a single Textract table block"""
        if 'Relationships' not in table_block:
            return None

        # Get cell blocks
        cell_relation = next(
            (r for r in table_block['Relationships'] if r['Type'] == 'CHILD'),
            None
        )

        if not cell_relation:
            return None

        cell_ids = cell_relation.get('Ids', [])
        cells = [b for b in all_blocks if b['Id'] in cell_ids]

        # Organize cells by row and column
        table_cells = {}
        max_row = 0
        max_col = 0

        for cell in cells:
            if cell['BlockType'] != 'CELL':
                continue

            row = cell.get('RowIndex', 1)
            col = cell.get('ColumnIndex', 1)
            row_span = cell.get('RowSpan', 1)
            col_span = cell.get('ColumnSpan', 1)

            max_row = max(max_row, row + row_span - 1)
            max_col = max(max_col, col + col_span - 1)

            if row not in table_cells:
                table_cells[row] = {}

            # Extract cell text
            cell_text = self._extract_cell_text(cell, all_blocks)

            table_cells[row][col] = {
                'text': cell_text,
                'row_span': row_span,
                'col_span': col_span,
                'confidence': cell.get('Confidence', 0) / 100
            }

        # Convert to structured format
        headers = []
        rows = []

        # First row as headers
        if 1 in table_cells:
            headers = [
                table_cells[1].get(col, {}).get('text', '')
                for col in range(1, max_col + 1)
            ]

        # Remaining rows as data
        for row_idx in range(2, max_row + 1):
            if row_idx in table_cells:
                row_data = [
                    table_cells[row_idx].get(col, {}).get('text', '')
                    for col in range(1, max_col + 1)
                ]
                rows.append(row_data)

        # Calculate average confidence
        all_confidences = [
            cell['confidence']
            for row_cells in table_cells.values()
            for cell in row_cells.values()
        ]
        avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0

        # Infer table type
        table_type = self._infer_table_type(headers, rows)

        return {
            'row_count': max_row,
            'column_count': max_col,
            'headers': headers,
            'rows': rows,
            'confidence': avg_confidence,
            'table_type': table_type,
            'cell_metadata': self._build_cell_metadata(table_cells)
        }

    def _extract_cell_text(self, cell_block: Dict, all_blocks: List[Dict]) -> str:
        """Extract text content from a cell block"""
        if 'Relationships' not in cell_block:
            return ''

        child_relation = next(
            (r for r in cell_block['Relationships'] if r['Type'] == 'CHILD'),
            None
        )

        if not child_relation:
            return ''

        child_ids = child_relation.get('Ids', [])
        child_blocks = [b for b in all_blocks if b['Id'] in child_ids]

        # Extract text from word blocks
        text_parts = []
        for child in child_blocks:
            if child['BlockType'] == 'WORD':
                text_parts.append(child.get('Text', ''))

        return ' '.join(text_parts).strip()

    def _infer_table_type(self, headers: List[str], rows: List[List[str]]) -> str:
        """
        Infer table type based on headers and content

        Returns:
            Table type: financial, property_details, closing_costs, etc.
        """
        header_text = ' '.join(headers).lower()

        # Financial tables
        if any(keyword in header_text for keyword in [
            'amount', 'cost', 'fee', 'payment', 'price', 'total', 'balance'
        ]):
            return 'financial'

        # Property details
        if any(keyword in header_text for keyword in [
            'property', 'address', 'parcel', 'lot', 'square feet', 'acreage'
        ]):
            return 'property_details'

        # Closing costs
        if any(keyword in header_text for keyword in [
            'closing', 'settlement', 'hud-1', 'cd', 'disclosure'
        ]):
            return 'closing_costs'

        # Schedule of distributions
        if any(keyword in header_text for keyword in [
            'distribution', 'disbursement', 'payoff'
        ]):
            return 'distribution'

        # Contact information
        if any(keyword in header_text for keyword in [
            'name', 'phone', 'email', 'contact', 'agent'
        ]):
            return 'contact_info'

        return 'general'

    def _build_cell_metadata(self, table_cells: Dict) -> Dict:
        """Build cell-level metadata for merged cells"""
        cell_metadata = {}

        for row, row_cells in table_cells.items():
            for col, cell_data in row_cells.items():
                if cell_data['row_span'] > 1 or cell_data['col_span'] > 1:
                    cell_metadata[f"{row}_{col}"] = {
                        'row_span': cell_data['row_span'],
                        'col_span': cell_data['col_span']
                    }

        return cell_metadata

    def extract_financial_data(self, tables: List[Dict]) -> Dict:
        """
        Extract and summarize financial data from tables

        Args:
            tables: List of extracted tables

        Returns:
            Aggregated financial data
        """
        financial_data = {
            'purchase_price': None,
            'down_payment': None,
            'loan_amount': None,
            'closing_costs': [],
            'total_costs': None
        }

        for table in tables:
            if table.get('table_type') in ['financial', 'closing_costs']:
                # Extract monetary values
                for row in table['rows']:
                    for cell in row:
                        # Look for monetary amounts
                        amounts = re.findall(r'\$\s?[\d,]+\.?\d*', cell)
                        for amount in amounts:
                            value = float(amount.replace('$', '').replace(',', ''))

                            # Try to categorize
                            row_text = ' '.join(row).lower()

                            if 'purchase price' in row_text or 'sales price' in row_text:
                                financial_data['purchase_price'] = value
                            elif 'down payment' in row_text:
                                financial_data['down_payment'] = value
                            elif 'loan amount' in row_text:
                                financial_data['loan_amount'] = value
                            elif any(keyword in row_text for keyword in [
                                'fee', 'cost', 'charge', 'expense'
                            ]):
                                financial_data['closing_costs'].append({
                                    'description': row[0] if row else 'Unknown',
                                    'amount': value
                                })

        # Calculate totals
        if financial_data['closing_costs']:
            financial_data['total_costs'] = sum(
                item['amount'] for item in financial_data['closing_costs']
            )

        return financial_data

    def merge_multipage_tables(self, tables: List[Dict]) -> List[Dict]:
        """
        Merge tables that span multiple pages

        Args:
            tables: List of tables from all pages

        Returns:
            Merged tables with proper continuation
        """
        merged_tables = []
        current_group = []

        for table in sorted(tables, key=lambda t: t.get('page_number', 0)):
            # Check if table continues from previous page
            if table.get('continues_on_next_page') or current_group:
                current_group.append(table)

                # If this table doesn't continue further, merge the group
                if not table.get('continues_on_next_page'):
                    merged_table = self._merge_table_group(current_group)
                    merged_tables.append(merged_table)
                    current_group = []
            else:
                merged_tables.append(table)

        return merged_tables

    def _merge_table_group(self, table_group: List[Dict]) -> Dict:
        """Merge a group of tables that span multiple pages"""
        if not table_group:
            return {}

        if len(table_group) == 1:
            return table_group[0]

        # Use first table as base
        merged = table_group[0].copy()

        # Merge rows from subsequent tables
        for table in table_group[1:]:
            merged['rows'].extend(table['rows'])
            merged['row_count'] += len(table['rows'])

        # Update metadata
        merged['page_count'] = len(table_group)
        merged['page_range'] = f"{table_group[0]['page_number']}-{table_group[-1]['page_number']}"

        return merged

    def export_to_csv(self, table: Dict, filepath: str) -> None:
        """
        Export table to CSV format

        Args:
            table: Extracted table
            filepath: Output CSV file path
        """
        try:
            df = pd.DataFrame(table['rows'], columns=table['headers'])
            df.to_csv(filepath, index=False)
            logger.info(f"Exported table to {filepath}")
        except Exception as e:
            logger.error(f"Failed to export table to CSV: {str(e)}")

    def export_to_excel(self, tables: List[Dict], filepath: str) -> None:
        """
        Export multiple tables to Excel with separate sheets

        Args:
            tables: List of extracted tables
            filepath: Output Excel file path
        """
        try:
            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                for idx, table in enumerate(tables):
                    sheet_name = table.get('table_type', f'Table_{idx + 1}')
                    df = pd.DataFrame(table['rows'], columns=table['headers'])
                    df.to_excel(writer, sheet_name=sheet_name, index=False)

            logger.info(f"Exported {len(tables)} tables to {filepath}")
        except Exception as e:
            logger.error(f"Failed to export tables to Excel: {str(e)}")

    def validate_table_structure(self, table: Dict) -> Dict:
        """
        Validate table structure and identify issues

        Returns:
            Validation report with errors and warnings
        """
        report = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        # Check for empty table
        if not table.get('rows'):
            report['valid'] = False
            report['errors'].append('Table has no data rows')

        # Check for inconsistent column counts
        expected_cols = table.get('column_count', 0)
        for idx, row in enumerate(table.get('rows', [])):
            if len(row) != expected_cols:
                report['warnings'].append(
                    f"Row {idx + 1} has {len(row)} columns, expected {expected_cols}"
                )

        # Check for empty headers
        if table.get('headers'):
            empty_headers = [i for i, h in enumerate(table['headers']) if not h.strip()]
            if empty_headers:
                report['warnings'].append(
                    f"Empty headers at positions: {empty_headers}"
                )

        # Check for low confidence
        if table.get('confidence', 1.0) < 0.7:
            report['warnings'].append(
                f"Low confidence score: {table['confidence']:.2f}"
            )

        return report


# Example usage
if __name__ == '__main__':
    extractor = TableExtractor()

    # Sample Textract blocks (simplified)
    sample_blocks = [
        {
            'BlockType': 'TABLE',
            'Id': 'table-1',
            'Relationships': [
                {'Type': 'CHILD', 'Ids': ['cell-1', 'cell-2', 'cell-3', 'cell-4']}
            ]
        },
        {
            'BlockType': 'CELL',
            'Id': 'cell-1',
            'RowIndex': 1,
            'ColumnIndex': 1,
            'Confidence': 99.5,
            'Relationships': [{'Type': 'CHILD', 'Ids': ['word-1']}]
        },
        {
            'BlockType': 'WORD',
            'Id': 'word-1',
            'Text': 'Description'
        },
        # ... more cells
    ]

    tables = extractor.extract_tables_from_textract(sample_blocks)
    print(f"Extracted {len(tables)} tables")
