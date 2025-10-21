"""
OCR Service with Hybrid Approach
Tesseract for basic documents, AWS Textract for complex documents
Automatic fallback and cost optimization
"""

import pytesseract
from PIL import Image
import boto3
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging
import time
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OCRService:
    """
    Hybrid OCR service combining Tesseract and AWS Textract
    - Tesseract: Fast, free, good for clear text
    - Textract: Advanced, paid, excellent for forms/tables/handwriting
    """

    def __init__(self):
        """Initialize OCR services"""
        self.textract_client = boto3.client('textract', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        self.s3_client = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))

        # Cost tracking (approximate)
        self.textract_cost_per_page = 0.0015  # $1.50 per 1000 pages

        logger.info('OCR Service initialized with Tesseract and AWS Textract')

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Enhance image quality for better OCR

        Steps:
        1. Grayscale conversion
        2. Noise reduction
        3. Adaptive thresholding
        4. Deskewing

        Args:
            image_path: Path to image file

        Returns:
            Preprocessed image as numpy array
        """
        try:
            img = cv2.imread(image_path)

            if img is None:
                raise ValueError(f"Failed to load image: {image_path}")

            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray)

            # Adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                denoised, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )

            # Deskew
            angle = self._calculate_skew_angle(thresh)
            rotated = self._rotate_image(thresh, angle)

            logger.info(f"Image preprocessing complete - deskewed by {angle:.2f} degrees")
            return rotated

        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            # Return original grayscale if preprocessing fails
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            return img

    def _calculate_skew_angle(self, image: np.ndarray) -> float:
        """Calculate skew angle of document"""
        try:
            coords = np.column_stack(np.where(image > 0))
            angle = cv2.minAreaRect(coords)[-1]

            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle

            return angle
        except:
            return 0.0

    def _rotate_image(self, image: np.ndarray, angle: float) -> np.ndarray:
        """Rotate image by given angle"""
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated

    def tesseract_ocr(self, image_path: str, preprocess: bool = True) -> Dict:
        """
        Perform OCR using Tesseract

        Args:
            image_path: Path to image file
            preprocess: Whether to preprocess image

        Returns:
            OCR results with text, confidence, and metadata
        """
        start_time = time.time()

        try:
            # Preprocess image if requested
            if preprocess:
                image = self.preprocess_image(image_path)
            else:
                image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

            # Get detailed OCR data with confidence
            data = pytesseract.image_to_data(
                image,
                output_type=pytesseract.Output.DICT,
                config='--psm 1 --oem 3'  # Auto page segmentation with LSTM engine
            )

            # Extract full text
            full_text = pytesseract.image_to_string(image)

            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            # Extract words with positions
            words = []
            for i in range(len(data['text'])):
                if data['text'][i].strip():
                    words.append({
                        'text': data['text'][i],
                        'confidence': data['conf'][i] / 100,
                        'bbox': {
                            'x': data['left'][i],
                            'y': data['top'][i],
                            'width': data['width'][i],
                            'height': data['height'][i]
                        }
                    })

            processing_time = int((time.time() - start_time) * 1000)

            return {
                'provider': 'TESSERACT',
                'full_text': full_text,
                'confidence': avg_confidence / 100,
                'pages': [{
                    'page_number': 1,
                    'text': full_text,
                    'words': words,
                    'confidence': avg_confidence / 100
                }],
                'processing_time': processing_time,
                'cost': 0.0,  # Tesseract is free
                'preprocessing_applied': preprocess
            }

        except Exception as e:
            logger.error(f"Tesseract OCR failed: {str(e)}")
            raise

    def textract_ocr(self, image_path: str, bucket: str, key: str,
                     extract_forms: bool = True, extract_tables: bool = True) -> Dict:
        """
        Perform OCR using AWS Textract

        Args:
            image_path: Path to image file
            bucket: S3 bucket name
            key: S3 object key
            extract_forms: Extract key-value pairs
            extract_tables: Extract tables

        Returns:
            OCR results with text, forms, tables, and metadata
        """
        start_time = time.time()

        try:
            # Upload to S3
            self.s3_client.upload_file(image_path, bucket, key)
            logger.info(f"Uploaded to S3: s3://{bucket}/{key}")

            # Determine feature types
            features = []
            if extract_forms:
                features.append('FORMS')
            if extract_tables:
                features.append('TABLES')

            # Start Textract analysis
            response = self.textract_client.analyze_document(
                Document={'S3Object': {'Bucket': bucket, 'Name': key}},
                FeatureTypes=features
            )

            # Parse results
            result = self._parse_textract_result(response)

            processing_time = int((time.time() - start_time) * 1000)

            # Calculate cost
            page_count = response.get('DocumentMetadata', {}).get('Pages', 1)
            cost = page_count * self.textract_cost_per_page

            result['processing_time'] = processing_time
            result['cost'] = cost

            logger.info(f"Textract OCR complete - {page_count} pages, ${cost:.4f}")

            return result

        except Exception as e:
            logger.error(f"Textract OCR failed: {str(e)}")
            raise

    def _parse_textract_result(self, response: Dict) -> Dict:
        """Parse Textract API response"""
        blocks = response.get('Blocks', [])

        # Extract lines of text
        lines = [block['Text'] for block in blocks if block['BlockType'] == 'LINE']
        full_text = '\n'.join(lines)

        # Extract key-value pairs
        key_values = self._extract_textract_key_values(blocks)

        # Extract tables
        tables = self._extract_textract_tables(blocks)

        # Calculate confidence
        confidences = [block['Confidence'] for block in blocks if 'Confidence' in block]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Get page count
        page_count = response.get('DocumentMetadata', {}).get('Pages', 1)

        return {
            'provider': 'AWS_TEXTRACT',
            'full_text': full_text,
            'confidence': avg_confidence / 100,
            'pages': [{
                'page_number': 1,
                'text': full_text,
                'confidence': avg_confidence / 100
            }],
            'key_values': key_values,
            'tables': tables,
            'page_count': page_count
        }

    def _extract_textract_key_values(self, blocks: List[Dict]) -> List[Dict]:
        """Extract key-value pairs from Textract blocks"""
        kv_pairs = []

        key_blocks = [b for b in blocks
                      if b['BlockType'] == 'KEY_VALUE_SET' and 'KEY' in b.get('EntityTypes', [])]

        for key_block in key_blocks:
            if 'Relationships' not in key_block:
                continue

            # Find associated value
            value_relation = next(
                (r for r in key_block['Relationships'] if r['Type'] == 'VALUE'),
                None
            )

            if not value_relation:
                continue

            value_block_id = value_relation['Ids'][0] if value_relation['Ids'] else None
            value_block = next((b for b in blocks if b['Id'] == value_block_id), None)

            if not value_block:
                continue

            # Extract text from child blocks
            key_text = self._extract_child_text(blocks, key_block)
            value_text = self._extract_child_text(blocks, value_block)

            if key_text and value_text:
                kv_pairs.append({
                    'key': key_text,
                    'value': value_text,
                    'confidence': min(
                        key_block.get('Confidence', 0),
                        value_block.get('Confidence', 0)
                    ) / 100
                })

        return kv_pairs

    def _extract_textract_tables(self, blocks: List[Dict]) -> List[Dict]:
        """Extract tables from Textract blocks"""
        tables = []

        table_blocks = [b for b in blocks if b['BlockType'] == 'TABLE']

        for table_block in table_blocks:
            if 'Relationships' not in table_block:
                continue

            cell_relation = next(
                (r for r in table_block['Relationships'] if r['Type'] == 'CHILD'),
                None
            )

            if not cell_relation:
                continue

            cell_ids = cell_relation.get('Ids', [])
            cells = [b for b in blocks if b['Id'] in cell_ids]

            # Build table structure
            table_data = {}
            max_row = 0
            max_col = 0

            for cell in cells:
                if cell['BlockType'] != 'CELL':
                    continue

                row = cell.get('RowIndex', 1)
                col = cell.get('ColumnIndex', 1)

                max_row = max(max_row, row)
                max_col = max(max_col, col)

                if row not in table_data:
                    table_data[row] = {}

                table_data[row][col] = self._extract_child_text(blocks, cell)

            # Convert to array format
            rows = []
            headers = []

            for row_idx in sorted(table_data.keys()):
                row_data = [table_data[row_idx].get(col, '') for col in range(1, max_col + 1)]
                if row_idx == 1:
                    headers = row_data
                else:
                    rows.append(row_data)

            tables.append({
                'row_count': max_row,
                'column_count': max_col,
                'headers': headers,
                'rows': rows,
                'confidence': table_block.get('Confidence', 0) / 100
            })

        return tables

    def _extract_child_text(self, blocks: List[Dict], parent_block: Dict) -> str:
        """Extract text from child blocks"""
        if 'Relationships' not in parent_block:
            return ''

        child_relation = next(
            (r for r in parent_block['Relationships'] if r['Type'] == 'CHILD'),
            None
        )

        if not child_relation:
            return ''

        child_ids = child_relation.get('Ids', [])
        child_blocks = [b for b in blocks if b['Id'] in child_ids]

        return ' '.join(block.get('Text', '') for block in child_blocks).strip()

    def hybrid_ocr(self, image_path: str, bucket: str = None, key: str = None,
                   confidence_threshold: float = 0.85) -> Dict:
        """
        Hybrid OCR approach: Try Tesseract first, fallback to Textract if needed

        Strategy:
        1. Run Tesseract OCR (fast, free)
        2. Check confidence score
        3. If confidence >= threshold, return Tesseract result
        4. Otherwise, use Textract (slower, paid, better quality)

        Args:
            image_path: Path to image file
            bucket: S3 bucket name (required for Textract fallback)
            key: S3 object key (required for Textract fallback)
            confidence_threshold: Minimum confidence to accept Tesseract result

        Returns:
            OCR results with provider information
        """
        logger.info(f"Starting hybrid OCR for {image_path}")

        # Try Tesseract first
        try:
            tesseract_result = self.tesseract_ocr(image_path)

            logger.info(f"Tesseract confidence: {tesseract_result['confidence']:.2f}")

            # If confidence is high enough, use Tesseract
            if tesseract_result['confidence'] >= confidence_threshold:
                logger.info("Using Tesseract result (high confidence)")
                return tesseract_result

            logger.info(f"Tesseract confidence ({tesseract_result['confidence']:.2f}) " +
                       f"below threshold ({confidence_threshold}), falling back to Textract")

        except Exception as e:
            logger.warning(f"Tesseract failed: {str(e)}, falling back to Textract")

        # Fallback to Textract
        if not bucket or not key:
            logger.error("Textract fallback requires bucket and key parameters")
            # Return Tesseract result as fallback
            return tesseract_result if 'tesseract_result' in locals() else {
                'provider': 'HYBRID',
                'full_text': '',
                'confidence': 0.0,
                'error': 'OCR failed'
            }

        try:
            textract_result = self.textract_ocr(image_path, bucket, key)
            textract_result['provider'] = 'HYBRID'
            textract_result['fallback_used'] = True
            textract_result['fallback_reason'] = 'Low Tesseract confidence'

            logger.info("Using Textract result (fallback)")
            return textract_result

        except Exception as e:
            logger.error(f"Textract fallback also failed: {str(e)}")

            # Return best available result
            if 'tesseract_result' in locals():
                tesseract_result['provider'] = 'HYBRID'
                tesseract_result['error'] = 'Textract fallback failed'
                return tesseract_result
            else:
                return {
                    'provider': 'HYBRID',
                    'full_text': '',
                    'confidence': 0.0,
                    'error': 'Both Tesseract and Textract failed'
                }


# Example usage
if __name__ == '__main__':
    ocr = OCRService()

    # Test with sample image
    result = ocr.hybrid_ocr(
        'sample_document.pdf',
        bucket='my-bucket',
        key='documents/sample.pdf'
    )

    print(f"Provider: {result['provider']}")
    print(f"Confidence: {result['confidence']:.2f}")
    print(f"Text length: {len(result['full_text'])} characters")
