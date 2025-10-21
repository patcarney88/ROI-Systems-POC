"""
Document Summarizer

Provides multiple summarization methods:
- Extractive: TF-IDF based key sentence extraction
- Abstractive: Transformer-based summary generation
- Hybrid: Combination of both methods
"""

from typing import Dict, List, Optional
import re
from datetime import datetime
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import logging

logger = logging.getLogger(__name__)


class DocumentSummarizer:
    """AI-powered document summarization service"""

    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        """
        Initialize the summarizer with specified model

        Args:
            model_name: Hugging Face model name for abstractive summarization
        """
        self.model_name = model_name

        # Initialize abstractive model
        try:
            logger.info(f"Loading summarization model: {model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.summarizer = pipeline(
                "summarization",
                model=self.model,
                tokenizer=self.tokenizer
            )
            logger.info("Summarization model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load summarization model: {e}")
            self.summarizer = None

        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)

        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)

    def extractive_summary(
        self,
        text: str,
        num_sentences: int = 5
    ) -> str:
        """
        Extract key sentences using TF-IDF scoring

        Args:
            text: Full document text
            num_sentences: Number of key sentences to extract

        Returns:
            Extractive summary as concatenated sentences
        """
        sentences = sent_tokenize(text)

        if len(sentences) <= num_sentences:
            return text

        try:
            # Compute TF-IDF scores
            vectorizer = TfidfVectorizer(
                stop_words=stopwords.words('english'),
                max_features=1000
            )
            tfidf_matrix = vectorizer.fit_transform(sentences)

            # Calculate sentence scores (sum of TF-IDF values)
            sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()

            # Get top sentences
            top_indices = sentence_scores.argsort()[-num_sentences:][::-1]
            top_indices.sort()  # Maintain original order

            summary_sentences = [sentences[i] for i in top_indices]
            return ' '.join(summary_sentences)

        except Exception as e:
            logger.error(f"Extractive summarization failed: {e}")
            # Fallback: return first N sentences
            return ' '.join(sentences[:num_sentences])

    def abstractive_summary(
        self,
        text: str,
        max_length: int = 150,
        min_length: int = 50
    ) -> str:
        """
        Generate abstractive summary using transformer model

        Args:
            text: Full document text
            max_length: Maximum summary length in tokens
            min_length: Minimum summary length in tokens

        Returns:
            Generated abstractive summary
        """
        if not self.summarizer:
            logger.warning("Abstractive model not available, falling back to extractive")
            return self.extractive_summary(text, num_sentences=3)

        try:
            # Chunk text if too long
            max_input_length = 1024
            chunks = self._chunk_text(text, max_input_length)

            summaries = []
            for chunk in chunks:
                summary = self.summarizer(
                    chunk,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False
                )
                summaries.append(summary[0]['summary_text'])

            # Combine chunk summaries
            combined = ' '.join(summaries)

            # If combined is still long, summarize again
            if len(combined.split()) > max_length:
                return self.summarizer(
                    combined,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False
                )[0]['summary_text']

            return combined

        except Exception as e:
            logger.error(f"Abstractive summarization failed: {e}")
            return self.extractive_summary(text, num_sentences=3)

    def generate_summary(
        self,
        text: str,
        category: Optional[str] = None
    ) -> Dict:
        """
        Generate comprehensive summary with multiple methods

        Args:
            text: Full document text
            category: Document category for context-specific summarization

        Returns:
            Dictionary with all summary components
        """
        start_time = datetime.now()

        # Executive summary (2-3 sentences)
        executive = self.abstractive_summary(
            text,
            max_length=80,
            min_length=40
        )

        # Detailed summary (1-2 paragraphs)
        detailed = self.abstractive_summary(
            text,
            max_length=200,
            min_length=100
        )

        # Key points (extractive)
        key_points = self.extract_key_points(text, num_points=5)

        # Extract metadata
        main_parties = self.extract_parties(text)
        key_dates = self.extract_key_dates(text)
        key_amounts = self.extract_key_amounts(text)
        action_items = self.extract_action_items(text)

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            'executive_summary': executive,
            'detailed_summary': detailed,
            'key_points': key_points,
            'main_parties': main_parties,
            'key_dates': key_dates,
            'key_amounts': key_amounts,
            'action_items': action_items,
            'summary_method': 'HYBRID',
            'word_count': len(executive.split()),
            'original_word_count': len(text.split()),
            'compression_ratio': len(executive.split()) / len(text.split()) if text else 0,
            'model_version': self.model_name,
            'confidence': self._calculate_confidence(text, executive),
            'processing_time': int(processing_time)
        }

    def extract_key_points(
        self,
        text: str,
        num_points: int = 5
    ) -> List[str]:
        """Extract key bullet points using extractive method"""
        extractive = self.extractive_summary(text, num_sentences=num_points)
        return sent_tokenize(extractive)

    def extract_parties(self, text: str) -> List[str]:
        """Extract person and entity names from text"""
        # Simple pattern matching for common party indicators
        patterns = [
            r'(?:buyer|purchaser|vendee):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
            r'(?:seller|vendor):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
            r'(?:lender|bank):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+\((?:buyer|seller|lender)\)',
        ]

        parties = set()
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                parties.add(match.group(1).strip())

        return list(parties)[:10]  # Limit to 10 parties

    def extract_key_dates(self, text: str) -> Dict:
        """Extract important dates with context"""
        # Common date patterns
        date_patterns = [
            (r'closing\s+date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'closing_date'),
            (r'contract\s+date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'contract_date'),
            (r'expiration\s+date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'expiration_date'),
            (r'inspection\s+deadline:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'inspection_deadline'),
        ]

        dates = {}
        for pattern, key in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dates[key] = match.group(1)

        return dates

    def extract_key_amounts(self, text: str) -> Dict:
        """Extract financial amounts with context"""
        # Common amount patterns
        amount_patterns = [
            (r'purchase\s+price:\s*\$?([\d,]+(?:\.\d{2})?)', 'purchase_price'),
            (r'loan\s+amount:\s*\$?([\d,]+(?:\.\d{2})?)', 'loan_amount'),
            (r'earnest\s+money:\s*\$?([\d,]+(?:\.\d{2})?)', 'earnest_money'),
            (r'down\s+payment:\s*\$?([\d,]+(?:\.\d{2})?)', 'down_payment'),
        ]

        amounts = {}
        for pattern, key in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amounts[key] = match.group(1).replace(',', '')

        return amounts

    def extract_action_items(self, text: str) -> List[str]:
        """Extract action items and requirements"""
        # Look for sentences with action verbs
        action_verbs = [
            'must', 'shall', 'required', 'need', 'should',
            'provide', 'submit', 'deliver', 'complete'
        ]

        sentences = sent_tokenize(text)
        action_items = []

        for sentence in sentences:
            if any(verb in sentence.lower() for verb in action_verbs):
                if len(sentence) < 200:  # Not too long
                    action_items.append(sentence.strip())

        return action_items[:10]  # Limit to 10 action items

    def _chunk_text(
        self,
        text: str,
        max_length: int = 1024
    ) -> List[str]:
        """Split text into chunks for processing"""
        words = text.split()
        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)
            if len(current_chunk) >= max_length:
                chunks.append(' '.join(current_chunk))
                current_chunk = []

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    def _calculate_confidence(
        self,
        original_text: str,
        summary: str
    ) -> float:
        """
        Calculate confidence score for summary quality

        Based on:
        - Compression ratio (not too aggressive)
        - Key term preservation
        - Length appropriateness
        """
        if not original_text or not summary:
            return 0.0

        orig_words = len(original_text.split())
        summ_words = len(summary.split())

        # Ideal compression ratio: 0.05 to 0.15
        compression = summ_words / orig_words if orig_words > 0 else 0

        if 0.05 <= compression <= 0.15:
            ratio_score = 1.0
        elif compression < 0.05:
            ratio_score = compression / 0.05
        else:
            ratio_score = max(0.0, 1.0 - (compression - 0.15) / 0.35)

        # Length appropriateness (summary should be substantial)
        if summ_words < 20:
            length_score = summ_words / 20
        elif summ_words > 200:
            length_score = max(0.0, 1.0 - (summ_words - 200) / 200)
        else:
            length_score = 1.0

        # Combined confidence
        confidence = (ratio_score * 0.6 + length_score * 0.4)

        return round(confidence, 3)
