"""
Change Detector

Detects and analyzes changes between document versions:
- Text diff with semantic understanding
- Visual diff for scanned documents
- Change significance assessment
"""

import difflib
from typing import Dict, List, Tuple, Optional
import re
import logging
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

try:
    import pdf2image
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logging.warning("pdf2image not available, visual diff will be limited")

logger = logging.getLogger(__name__)


class ChangeDetector:
    """Document change detection and analysis service"""

    def __init__(self):
        """Initialize change detector"""
        # Critical keywords that indicate significant changes
        self.critical_keywords = [
            'price', 'amount', 'date', 'deadline', 'payment',
            'signature', 'contract', 'agreement', 'terms',
            'conditions', 'buyer', 'seller', 'property',
            'loan', 'closing', 'earnest', 'deposit'
        ]

    def detect_text_changes(
        self,
        old_text: str,
        new_text: str
    ) -> Dict:
        """
        Detect changes between two text versions

        Args:
            old_text: Original text
            new_text: New text version

        Returns:
            Dictionary with comprehensive change analysis
        """
        logger.info("Starting text change detection")

        # Use difflib for detailed comparison
        differ = difflib.Differ()
        diff = list(differ.compare(
            old_text.splitlines(keepends=True),
            new_text.splitlines(keepends=True)
        ))

        additions = []
        deletions = []
        modifications = []

        # Parse diff output
        i = 0
        while i < len(diff):
            line = diff[i]

            if line.startswith('+ '):
                additions.append(line[2:].strip())
            elif line.startswith('- '):
                deletions.append(line[2:].strip())
            elif line.startswith('? '):
                # Context line indicating intra-line changes
                pass

            i += 1

        # Detect modifications (paired deletions and additions)
        modifications = self._detect_modifications(deletions, additions)

        # Remove matched items from deletions and additions
        for mod in modifications:
            if mod['old'] in deletions:
                deletions.remove(mod['old'])
            if mod['new'] in additions:
                additions.remove(mod['new'])

        # Calculate change statistics
        total_lines = len(new_text.splitlines())
        changed_lines = len(additions) + len(deletions) + len(modifications)
        change_percentage = (changed_lines / total_lines * 100) if total_lines > 0 else 0

        # Determine significance
        significance = self._determine_significance(
            additions,
            deletions,
            modifications
        )

        # Generate change summary
        summary = self._generate_changes_summary(
            additions,
            deletions,
            modifications
        )

        # Generate formatted diff
        formatted_diff = self._format_diff(additions, deletions, modifications)

        result = {
            'additions': additions,
            'deletions': deletions,
            'modifications': modifications,
            'change_percentage': round(change_percentage, 2),
            'significance': significance,
            'changes_summary': summary,
            'text_diff': formatted_diff,
            'critical_changes': self._identify_critical_changes(
                additions,
                deletions,
                modifications
            )
        }

        logger.info(f"Text change detection complete: {change_percentage:.1f}% changed, {significance} significance")

        return result

    def detect_visual_changes(
        self,
        old_pdf_path: str,
        new_pdf_path: str,
        output_path: Optional[str] = None
    ) -> Dict:
        """
        Detect visual changes between PDF versions

        Args:
            old_pdf_path: Path to original PDF
            new_pdf_path: Path to new PDF version
            output_path: Optional path for highlighted diff PDF

        Returns:
            Dictionary with visual change analysis
        """
        if not PDF_AVAILABLE:
            logger.error("pdf2image not available for visual diff")
            return {
                'success': False,
                'error': 'PDF processing not available'
            }

        try:
            logger.info(f"Converting PDFs to images for comparison")

            # Convert PDFs to images
            old_images = pdf2image.convert_from_path(old_pdf_path, dpi=150)
            new_images = pdf2image.convert_from_path(new_pdf_path, dpi=150)

            if len(old_images) != len(new_images):
                logger.warning(f"Page count mismatch: {len(old_images)} vs {len(new_images)}")

            highlighted_images = []
            page_changes = []

            # Compare each page
            for i in range(min(len(old_images), len(new_images))):
                page_result = self._compare_images(
                    old_images[i],
                    new_images[i],
                    page_number=i + 1
                )
                highlighted_images.append(page_result['highlighted_image'])
                page_changes.append(page_result['changes'])

            # Save highlighted PDF if output path provided
            visual_diff_url = None
            if output_path and highlighted_images:
                highlighted_images[0].save(
                    output_path,
                    save_all=True,
                    append_images=highlighted_images[1:],
                    resolution=150.0
                )
                visual_diff_url = output_path
                logger.info(f"Visual diff saved to {output_path}")

            # Calculate overall change metrics
            total_changes = sum(p['change_count'] for p in page_changes)
            avg_change_percentage = np.mean([
                p['change_percentage'] for p in page_changes
            ])

            return {
                'success': True,
                'visual_diff_url': visual_diff_url,
                'page_count': len(highlighted_images),
                'total_changes': total_changes,
                'average_change_percentage': round(avg_change_percentage, 2),
                'page_changes': page_changes
            }

        except Exception as e:
            logger.error(f"Visual change detection failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def _compare_images(
        self,
        old_img: Image.Image,
        new_img: Image.Image,
        page_number: int
    ) -> Dict:
        """Compare two images and highlight differences"""
        # Convert to numpy arrays
        old_array = np.array(old_img)
        new_array = np.array(new_img)

        # Ensure same size
        if old_array.shape != new_array.shape:
            new_img = new_img.resize(old_img.size)
            new_array = np.array(new_img)

        # Calculate difference
        diff = cv2.absdiff(old_array, new_array)

        # Convert to grayscale for threshold
        if len(diff.shape) == 3:
            gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
        else:
            gray = diff

        # Threshold to get changed regions
        _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

        # Find contours of changed regions
        contours, _ = cv2.findContours(
            thresh,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        # Draw rectangles around changes
        highlighted = new_array.copy()
        change_count = 0

        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Filter small noise
                x, y, w, h = cv2.boundingRect(contour)
                cv2.rectangle(
                    highlighted,
                    (x, y),
                    (x + w, y + h),
                    (255, 0, 0),  # Red rectangle
                    3
                )
                change_count += 1

        # Calculate change percentage
        total_pixels = old_array.shape[0] * old_array.shape[1]
        changed_pixels = np.count_nonzero(thresh)
        change_percentage = (changed_pixels / total_pixels * 100) if total_pixels > 0 else 0

        return {
            'highlighted_image': Image.fromarray(highlighted),
            'changes': {
                'page_number': page_number,
                'change_count': change_count,
                'change_percentage': round(change_percentage, 2),
                'significant': change_percentage > 5.0
            }
        }

    def _detect_modifications(
        self,
        deletions: List[str],
        additions: List[str]
    ) -> List[Dict]:
        """
        Detect modifications by pairing similar deletions and additions

        Args:
            deletions: List of deleted lines
            additions: List of added lines

        Returns:
            List of modification dictionaries
        """
        modifications = []
        used_deletions = set()
        used_additions = set()

        for i, deletion in enumerate(deletions):
            best_match = None
            best_similarity = 0.0

            for j, addition in enumerate(additions):
                if j in used_additions:
                    continue

                similarity = self._calculate_similarity(deletion, addition)

                if similarity > 0.6 and similarity > best_similarity:  # Threshold
                    best_similarity = similarity
                    best_match = j

            if best_match is not None:
                modifications.append({
                    'old': deletion,
                    'new': additions[best_match],
                    'similarity': round(best_similarity, 3)
                })
                used_deletions.add(i)
                used_additions.add(best_match)

        return modifications

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity ratio between two strings"""
        return difflib.SequenceMatcher(None, str1, str2).ratio()

    def _determine_significance(
        self,
        additions: List[str],
        deletions: List[str],
        modifications: List[Dict]
    ) -> str:
        """
        Determine significance level of changes

        Returns:
            One of: CRITICAL, HIGH, MEDIUM, LOW
        """
        critical_changes = 0

        # Check additions for critical keywords
        for addition in additions:
            if self._contains_critical_keyword(addition):
                critical_changes += 1

        # Check deletions for critical keywords
        for deletion in deletions:
            if self._contains_critical_keyword(deletion):
                critical_changes += 1

        # Check modifications for critical keywords
        for mod in modifications:
            if self._contains_critical_keyword(mod['old']) or \
               self._contains_critical_keyword(mod['new']):
                critical_changes += 1

        # Determine significance based on critical changes and volume
        total_changes = len(additions) + len(deletions) + len(modifications)

        if critical_changes >= 3:
            return 'CRITICAL'
        elif critical_changes >= 1:
            return 'HIGH'
        elif total_changes > 20:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _contains_critical_keyword(self, text: str) -> bool:
        """Check if text contains any critical keywords"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.critical_keywords)

    def _generate_changes_summary(
        self,
        additions: List[str],
        deletions: List[str],
        modifications: List[Dict]
    ) -> str:
        """Generate human-readable summary of changes"""
        parts = []

        if additions:
            parts.append(f"{len(additions)} addition(s)")

        if deletions:
            parts.append(f"{len(deletions)} deletion(s)")

        if modifications:
            parts.append(f"{len(modifications)} modification(s)")

        if not parts:
            return "No changes detected"

        summary = f"Document updated with {', '.join(parts)}."

        # Add critical change warning
        critical_items = []
        for add in additions[:3]:  # First 3
            if self._contains_critical_keyword(add):
                critical_items.append(f"Added: {add[:50]}...")

        for delete in deletions[:3]:
            if self._contains_critical_keyword(delete):
                critical_items.append(f"Removed: {delete[:50]}...")

        if critical_items:
            summary += " Critical changes: " + "; ".join(critical_items)

        return summary

    def _format_diff(
        self,
        additions: List[str],
        deletions: List[str],
        modifications: List[Dict]
    ) -> str:
        """Format changes as readable diff"""
        diff_lines = []

        if additions:
            diff_lines.append("+ ADDITIONS:")
            for add in additions:
                diff_lines.append(f"  + {add}")
            diff_lines.append("")

        if deletions:
            diff_lines.append("- DELETIONS:")
            for delete in deletions:
                diff_lines.append(f"  - {delete}")
            diff_lines.append("")

        if modifications:
            diff_lines.append("~ MODIFICATIONS:")
            for mod in modifications:
                diff_lines.append(f"  OLD: {mod['old']}")
                diff_lines.append(f"  NEW: {mod['new']}")
                diff_lines.append("")

        return '\n'.join(diff_lines)

    def _identify_critical_changes(
        self,
        additions: List[str],
        deletions: List[str],
        modifications: List[Dict]
    ) -> List[Dict]:
        """Identify and detail critical changes"""
        critical = []

        for add in additions:
            if self._contains_critical_keyword(add):
                critical.append({
                    'type': 'addition',
                    'content': add,
                    'keywords': self._extract_critical_keywords(add)
                })

        for delete in deletions:
            if self._contains_critical_keyword(delete):
                critical.append({
                    'type': 'deletion',
                    'content': delete,
                    'keywords': self._extract_critical_keywords(delete)
                })

        for mod in modifications:
            if self._contains_critical_keyword(mod['old']) or \
               self._contains_critical_keyword(mod['new']):
                critical.append({
                    'type': 'modification',
                    'old_content': mod['old'],
                    'new_content': mod['new'],
                    'keywords': list(set(
                        self._extract_critical_keywords(mod['old']) +
                        self._extract_critical_keywords(mod['new'])
                    ))
                })

        return critical

    def _extract_critical_keywords(self, text: str) -> List[str]:
        """Extract critical keywords present in text"""
        text_lower = text.lower()
        return [
            keyword for keyword in self.critical_keywords
            if keyword in text_lower
        ]
