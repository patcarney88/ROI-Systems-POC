"""
Signature Detection Service
Detect and analyze signatures in documents
Supports handwritten, digital, and notary seals
"""

import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SignatureDetector:
    """
    Detect signatures in documents using computer vision
    Combines edge detection, contour analysis, and AWS Textract
    """

    def __init__(self):
        """Initialize signature detector"""
        self.min_signature_area = 5000  # Minimum area in pixels
        self.max_signature_area = 100000  # Maximum area in pixels
        self.aspect_ratio_range = (2.0, 8.0)  # Width/height ratio for signatures

        logger.info('Signature Detector initialized')

    def detect_signatures(self, image_path: str, page_number: int = 1) -> List[Dict]:
        """
        Detect signatures in an image using computer vision

        Args:
            image_path: Path to image file
            page_number: Page number in document

        Returns:
            List of detected signatures with metadata
        """
        signatures = []

        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")

            # Preprocess image
            preprocessed = self._preprocess_for_signatures(image)

            # Detect signature regions
            signature_regions = self._find_signature_regions(preprocessed)

            # Analyze each region
            for idx, region in enumerate(signature_regions):
                signature_data = self._analyze_signature_region(
                    image, region, page_number, idx
                )
                if signature_data:
                    signatures.append(signature_data)

            logger.info(f"Detected {len(signatures)} signatures on page {page_number}")

        except Exception as e:
            logger.error(f"Signature detection failed: {str(e)}")

        return signatures

    def _preprocess_for_signatures(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for signature detection"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply bilateral filter to reduce noise while keeping edges
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)

        # Adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            filtered, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )

        # Morphological operations to connect signature strokes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

        return morph

    def _find_signature_regions(self, preprocessed: np.ndarray) -> List[Dict]:
        """Find potential signature regions using contour analysis"""
        signature_regions = []

        # Find contours
        contours, _ = cv2.findContours(
            preprocessed,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)

            # Calculate area and aspect ratio
            area = w * h
            aspect_ratio = w / h if h > 0 else 0

            # Filter based on signature characteristics
            if (self.min_signature_area <= area <= self.max_signature_area and
                self.aspect_ratio_range[0] <= aspect_ratio <= self.aspect_ratio_range[1]):

                signature_regions.append({
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'area': area,
                    'aspect_ratio': aspect_ratio,
                    'contour': contour
                })

        return signature_regions

    def _analyze_signature_region(self, image: np.ndarray, region: Dict,
                                   page_number: int, index: int) -> Optional[Dict]:
        """Analyze a signature region to determine if it's a valid signature"""
        x, y, w, h = region['x'], region['y'], region['width'], region['height']

        # Extract region of interest
        roi = image[y:y+h, x:x+w]

        # Calculate signature confidence based on features
        confidence = self._calculate_signature_confidence(roi, region)

        # Classify signature type
        signature_type = self._classify_signature_type(roi, region)

        # Detect if signature is present (not just an empty box)
        signed = self._is_region_signed(roi)

        # Try to find associated label/field
        field_label = self._find_signature_label(image, region)

        return {
            'page_number': page_number,
            'signature_type': signature_type,
            'confidence': confidence,
            'bounding_box': {
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h)
            },
            'signed': signed,
            'field_label': field_label,
            'metadata': {
                'area': region['area'],
                'aspect_ratio': region['aspect_ratio'],
                'index': index
            }
        }

    def _calculate_signature_confidence(self, roi: np.ndarray,
                                        region: Dict) -> float:
        """Calculate confidence score for signature detection"""
        confidence_factors = []

        # Factor 1: Aspect ratio (signatures are typically wide)
        aspect_ratio = region['aspect_ratio']
        if 3.0 <= aspect_ratio <= 6.0:
            confidence_factors.append(0.3)
        elif 2.0 <= aspect_ratio <= 8.0:
            confidence_factors.append(0.2)
        else:
            confidence_factors.append(0.1)

        # Factor 2: Density (signatures have moderate pixel density)
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        density = np.sum(binary == 255) / binary.size

        if 0.1 <= density <= 0.4:
            confidence_factors.append(0.3)
        elif 0.05 <= density <= 0.5:
            confidence_factors.append(0.2)
        else:
            confidence_factors.append(0.1)

        # Factor 3: Edge complexity (signatures have complex edges)
        edges = cv2.Canny(gray_roi, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        if edge_density > 0.05:
            confidence_factors.append(0.2)
        elif edge_density > 0.02:
            confidence_factors.append(0.15)
        else:
            confidence_factors.append(0.05)

        # Factor 4: Stroke continuity
        stroke_score = self._calculate_stroke_continuity(binary)
        confidence_factors.append(stroke_score * 0.2)

        return sum(confidence_factors)

    def _calculate_stroke_continuity(self, binary: np.ndarray) -> float:
        """Calculate stroke continuity (higher for connected strokes)"""
        # Use morphological operations to connect nearby strokes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        connected = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        # Count connected components
        num_labels, _ = cv2.connectedComponents(connected)

        # Fewer components = more continuous (better signature)
        if num_labels <= 5:
            return 1.0
        elif num_labels <= 10:
            return 0.7
        elif num_labels <= 20:
            return 0.4
        else:
            return 0.2

    def _classify_signature_type(self, roi: np.ndarray, region: Dict) -> str:
        """
        Classify signature type

        Returns:
            HANDWRITTEN, DIGITAL, INITIALS, or NOTARY_SEAL
        """
        aspect_ratio = region['aspect_ratio']
        area = region['area']

        # Notary seals are typically circular/square
        if 0.8 <= aspect_ratio <= 1.2 and area > 30000:
            return 'NOTARY_SEAL'

        # Initials are shorter
        if aspect_ratio < 3.0 and area < 15000:
            return 'INITIALS'

        # Digital signatures often have very clean edges
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_roi, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        if edge_density < 0.02:
            return 'DIGITAL'

        # Default to handwritten
        return 'HANDWRITTEN'

    def _is_region_signed(self, roi: np.ndarray,
                          min_ink_percentage: float = 5.0) -> bool:
        """
        Determine if signature region actually contains a signature

        Args:
            roi: Region of interest
            min_ink_percentage: Minimum percentage of "ink" pixels

        Returns:
            True if region appears to be signed
        """
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Calculate percentage of dark pixels
        ink_percentage = (np.sum(binary == 255) / binary.size) * 100

        return ink_percentage >= min_ink_percentage

    def _find_signature_label(self, image: np.ndarray, region: Dict) -> Optional[str]:
        """
        Find text label associated with signature region

        Args:
            image: Full document image
            region: Signature region

        Returns:
            Label text if found (e.g., "Buyer Signature", "Seller Signature")
        """
        x, y, w, h = region['x'], region['y'], region['width'], region['height']

        # Define search region (area above and to the left of signature)
        search_y_start = max(0, y - 50)
        search_y_end = y
        search_x_start = max(0, x - 100)
        search_x_end = x + w

        # Extract search region
        search_roi = image[search_y_start:search_y_end, search_x_start:search_x_end]

        # Use OCR to extract text (simplified - would use pytesseract in production)
        # For now, return common signature labels based on position
        if y > image.shape[0] * 0.8:  # Bottom of page
            return "Signature"
        elif x < image.shape[1] * 0.5:  # Left side
            return "Buyer Signature"
        else:  # Right side
            return "Seller Signature"

    def detect_from_textract(self, blocks: List[Dict],
                             page_number: int = 1) -> List[Dict]:
        """
        Detect signatures from Textract SIGNATURE blocks

        Args:
            blocks: Textract response blocks
            page_number: Page number in document

        Returns:
            List of detected signatures
        """
        signatures = []

        signature_blocks = [b for b in blocks if b['BlockType'] == 'SIGNATURE']

        for idx, sig_block in enumerate(signature_blocks):
            signatures.append({
                'page_number': page_number,
                'signature_type': 'HANDWRITTEN',  # Textract default
                'confidence': sig_block.get('Confidence', 0) / 100,
                'bounding_box': {
                    'x': sig_block['Geometry']['BoundingBox']['Left'],
                    'y': sig_block['Geometry']['BoundingBox']['Top'],
                    'width': sig_block['Geometry']['BoundingBox']['Width'],
                    'height': sig_block['Geometry']['BoundingBox']['Height']
                },
                'signed': True,
                'extraction_method': 'TEXTRACT',
                'metadata': {'index': idx}
            })

        logger.info(f"Detected {len(signatures)} signatures via Textract on page {page_number}")
        return signatures

    def verify_signature_completeness(self, signatures: List[Dict],
                                      required_signatures: List[str]) -> Dict:
        """
        Verify that all required signatures are present

        Args:
            signatures: List of detected signatures
            required_signatures: List of required signature labels

        Returns:
            Verification report
        """
        found_labels = [sig.get('field_label') for sig in signatures]

        missing_signatures = [
            label for label in required_signatures
            if label not in found_labels
        ]

        return {
            'complete': len(missing_signatures) == 0,
            'total_required': len(required_signatures),
            'total_found': len(signatures),
            'missing_signatures': missing_signatures,
            'extra_signatures': [
                label for label in found_labels
                if label not in required_signatures
            ]
        }


# Example usage
if __name__ == '__main__':
    detector = SignatureDetector()

    # Test signature detection
    signatures = detector.detect_signatures('sample_contract.pdf')

    print(f"\nDetected {len(signatures)} signatures:")
    for sig in signatures:
        print(f"  {sig['signature_type']}: {sig['field_label']} " +
              f"(confidence: {sig['confidence']:.2f}, signed: {sig['signed']})")

    # Verify completeness
    required = ['Buyer Signature', 'Seller Signature', 'Notary Signature']
    verification = detector.verify_signature_completeness(signatures, required)

    print(f"\nSignature verification:")
    print(f"  Complete: {verification['complete']}")
    print(f"  Missing: {verification['missing_signatures']}")
