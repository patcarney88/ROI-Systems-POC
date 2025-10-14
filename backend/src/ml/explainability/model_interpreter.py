"""
Model Interpretability Service
Converts technical SHAP explanations into user-friendly narratives
Provides explanations at different technical levels
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime
from .shap_explainer import SHAPExplainer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelInterpreter:
    """
    High-level model interpretability service for user-friendly explanations
    """

    def __init__(
        self,
        model: Any,
        model_type: str,
        feature_names: List[str],
        model_name: str = 'move_probability'
    ):
        """
        Initialize model interpreter

        Args:
            model: Trained model
            model_type: Type of model for SHAP ('tree', 'deep', 'linear', 'kernel')
            feature_names: List of feature names
            model_name: Name of the model (move_probability, transaction_type, etc.)
        """
        self.model = model
        self.model_type = model_type
        self.feature_names = feature_names
        self.model_name = model_name
        self.shap_explainer = SHAPExplainer(model, model_type)

        logger.info(f"Initialized ModelInterpreter for {model_name}")

    def initialize(self, X_background: np.ndarray, max_samples: int = 100) -> None:
        """
        Initialize SHAP explainer with background data

        Args:
            X_background: Background dataset
            max_samples: Maximum background samples
        """
        self.shap_explainer.initialize_explainer(
            X_background,
            self.feature_names,
            max_samples
        )
        logger.info("ModelInterpreter initialized with SHAP explainer")

    def explain_to_user(
        self,
        prediction_data: Dict[str, Any],
        user_level: str = 'non_technical'
    ) -> Dict[str, Any]:
        """
        Generate user-friendly explanation

        Args:
            prediction_data: Dictionary with prediction details
                {
                    'features': np.ndarray,
                    'predicted_value': float,
                    'confidence': float,
                    'type': str (move_probability, transaction_type, etc.)
                }
            user_level: One of 'non_technical', 'technical', or 'detailed'

        Returns:
            User-friendly explanation dictionary
        """
        try:
            # Get SHAP explanation
            shap_explanation = self.shap_explainer.explain_prediction(
                prediction_data['features'],
                self.feature_names
            )

            # Format for end-users
            if user_level == 'non_technical':
                explanation = self._generate_simple_explanation(
                    prediction_data,
                    shap_explanation
                )
            elif user_level == 'technical':
                explanation = self._generate_technical_explanation(
                    prediction_data,
                    shap_explanation
                )
            else:  # 'detailed'
                explanation = self._generate_detailed_explanation(
                    prediction_data,
                    shap_explanation
                )

            explanation['generated_at'] = datetime.now().isoformat()
            explanation['model_name'] = self.model_name

            return explanation

        except Exception as e:
            logger.error(f"Failed to generate user explanation: {str(e)}")
            return self._generate_fallback_explanation(prediction_data)

    def _generate_simple_explanation(
        self,
        prediction_data: Dict,
        shap_explanation: Dict
    ) -> Dict[str, Any]:
        """
        Generate simple, plain-English explanation for non-technical users
        """
        prediction_type = prediction_data.get('type', self.model_name)
        predicted_value = prediction_data['predicted_value']
        confidence = prediction_data.get('confidence', predicted_value)

        narrative = []

        if prediction_type == 'move_probability':
            narrative.extend(self._explain_move_probability(
                predicted_value,
                confidence,
                shap_explanation
            ))

        elif prediction_type == 'transaction_type':
            narrative.extend(self._explain_transaction_type(
                prediction_data,
                confidence,
                shap_explanation
            ))

        elif prediction_type == 'contact_timing':
            narrative.extend(self._explain_contact_timing(
                prediction_data,
                confidence,
                shap_explanation
            ))

        elif prediction_type == 'property_value':
            narrative.extend(self._explain_property_value(
                prediction_data,
                confidence,
                shap_explanation
            ))

        else:
            # Generic explanation
            narrative.append(f"Predicted value: {predicted_value:.2f} (Confidence: {confidence*100:.0f}%)")

        return {
            'summary': '\n\n'.join(narrative),
            'confidence': float(confidence),
            'prediction_value': float(predicted_value),
            'key_factors': self._get_simple_key_factors(shap_explanation),
            'visualization_available': True,
            'level': 'non_technical'
        }

    def _explain_move_probability(
        self,
        probability: float,
        confidence: float,
        shap_explanation: Dict
    ) -> List[str]:
        """Generate plain-English explanation for move probability"""
        narrative = []

        # Main prediction
        prob_pct = probability * 100

        if prob_pct > 70:
            narrative.append(
                f"🎯 **High Likelihood of Moving** ({prob_pct:.0f}%)\n\n"
                f"This client shows strong indicators of planning a move in the next 6-12 months. "
                f"Our analysis suggests this is a high-priority opportunity."
            )
        elif prob_pct > 40:
            narrative.append(
                f"⚠️ **Moderate Likelihood of Moving** ({prob_pct:.0f}%)\n\n"
                f"This client shows some indicators of potential interest in moving. "
                f"They may be in early research or consideration phases."
            )
        else:
            narrative.append(
                f"ℹ️ **Low Likelihood of Moving** ({prob_pct:.0f}%)\n\n"
                f"This client currently shows limited indicators of moving. "
                f"However, circumstances can change, so continued engagement is recommended."
            )

        # Key factors
        narrative.append("**What's driving this assessment:**")

        top_features = shap_explanation['top_features'][:3]
        for i, feature in enumerate(top_features, 1):
            reason = self._translate_feature_to_reason(feature)
            impact = "↗️ increases" if feature['shap_value'] > 0 else "↘️ decreases"
            narrative.append(f"{i}. {reason} ({impact} likelihood by {feature['impact_percent']:.1f}%)")

        return narrative

    def _explain_transaction_type(
        self,
        prediction_data: Dict,
        confidence: float,
        shap_explanation: Dict
    ) -> List[str]:
        """Generate explanation for transaction type prediction"""
        narrative = []

        predicted_class = prediction_data.get('predicted_class', 'Unknown')

        narrative.append(
            f"📋 **Predicted Next Transaction: {predicted_class}**\n\n"
            f"Based on current behavior patterns and market conditions, "
            f"we predict this client is most likely to engage in a **{predicted_class}** transaction "
            f"(Confidence: {confidence*100:.0f}%)."
        )

        narrative.append("**Why we think this:**")

        top_features = shap_explanation['top_features'][:3]
        for i, feature in enumerate(top_features, 1):
            reason = self._translate_feature_to_reason(feature)
            narrative.append(f"{i}. {reason}")

        return narrative

    def _explain_contact_timing(
        self,
        prediction_data: Dict,
        confidence: float,
        shap_explanation: Dict
    ) -> List[str]:
        """Generate explanation for optimal contact timing"""
        narrative = []

        optimal_time = prediction_data.get('optimal_time', 'Unknown')

        narrative.append(
            f"⏰ **Optimal Contact Time: {optimal_time}**\n\n"
            f"Our analysis suggests the best time to reach out is **{optimal_time}**, "
            f"based on engagement patterns and response history (Confidence: {confidence*100:.0f}%)."
        )

        narrative.append("**Key timing indicators:**")

        top_features = shap_explanation['top_features'][:3]
        for i, feature in enumerate(top_features, 1):
            reason = self._translate_feature_to_reason(feature)
            narrative.append(f"{i}. {reason}")

        return narrative

    def _explain_property_value(
        self,
        prediction_data: Dict,
        confidence: float,
        shap_explanation: Dict
    ) -> List[str]:
        """Generate explanation for property value prediction"""
        narrative = []

        predicted_value = prediction_data['predicted_value']

        narrative.append(
            f"🏠 **Estimated Property Value: ${predicted_value:,.0f}**\n\n"
            f"Based on comparable properties, market trends, and property characteristics, "
            f"we estimate the current value at **${predicted_value:,.0f}** "
            f"(Confidence: {confidence*100:.0f}%)."
        )

        narrative.append("**Factors affecting valuation:**")

        top_features = shap_explanation['top_features'][:3]
        for i, feature in enumerate(top_features, 1):
            reason = self._translate_feature_to_reason(feature)
            impact = "increases" if feature['shap_value'] > 0 else "decreases"
            narrative.append(f"{i}. {reason} ({impact} value)")

        return narrative

    def _translate_feature_to_reason(self, feature: Dict) -> str:
        """
        Translate technical feature names to user-friendly reasons
        """
        feature_translations = {
            # Document activity
            'doc_access_count_30d': "High recent engagement with property documents",
            'doc_download_count': "Frequent document downloads",
            'doc_share_count': "Actively sharing documents",
            'last_doc_access_days': "Recent document activity",

            # Email engagement
            'email_engagement_score': "Strong email interaction indicates interest",
            'email_open_rate': "Consistently opens communications",
            'email_click_rate': "High engagement with email content",
            'refinance_email_clicks': "Interest in refinancing information",
            'market_report_views': "Actively monitoring market conditions",

            # Platform behavior
            'property_search_frequency': "Active property browsing behavior",
            'value_check_count': "Frequently checking property value",
            'calculator_use_count': "Using financial calculators",
            'comparable_views': "Researching comparable properties",
            'session_count': "Regular platform visits",

            # Property context
            'years_owned': "Length of homeownership suggests lifecycle timing",
            'home_ownership_years': "Time as homeowner indicates readiness",
            'equity_percentage': "Home equity level influences transaction decisions",
            'estimated_equity': "Current equity position",
            'loan_to_value': "Loan-to-value ratio affects options",
            'property_count': "Number of owned properties",

            # Market factors
            'mortgage_rate_trend': "Current mortgage rate environment affects refinancing",
            'value_appreciation_pct': "Property value growth impacts selling decision",
            'market_conditions': "Local market conditions",

            # Life events
            'address_change_recent': "Recent address change suggests mobility",
            'job_change_indicator': "Career changes often trigger moves",
            'marital_status_change': "Life changes affecting housing needs",

            # Signal strengths
            'document_access_spike_strength': "Sudden increase in document access",
            'dormant_reactivation_strength': "Recently reactivated after dormancy",
            'high_email_engagement_strength': "Significantly increased email engagement",
            'total_signal_strength': "Overall strength of behavioral indicators",

            # Time-based
            'days_since_last_visit': "Recency of platform engagement",
            'visit_frequency': "Frequency of platform visits",
            'avg_session_duration': "Time spent on platform"
        }

        feature_name = feature['feature']
        feature_value = feature['value']

        # Get human-readable description
        if feature_name in feature_translations:
            description = feature_translations[feature_name]
        else:
            # Generate generic description
            description = feature_name.replace('_', ' ').title()

        # Add value context where appropriate
        if 'days' in feature_name.lower() and feature_value < 30:
            description += f" (within last {int(feature_value)} days)"
        elif 'count' in feature_name.lower() and feature_value > 0:
            description += f" ({int(feature_value)} times)"
        elif 'rate' in feature_name.lower():
            description += f" ({feature_value*100:.0f}%)"

        return description

    def _get_simple_key_factors(self, shap_explanation: Dict) -> List[Dict]:
        """
        Extract key factors in simple format
        """
        key_factors = []

        for feature in shap_explanation['top_features'][:5]:
            key_factors.append({
                'factor': self._translate_feature_to_reason(feature),
                'impact': 'positive' if feature['shap_value'] > 0 else 'negative',
                'strength': feature['impact_percent']
            })

        return key_factors

    def _generate_technical_explanation(
        self,
        prediction_data: Dict,
        shap_explanation: Dict
    ) -> Dict[str, Any]:
        """
        Generate technical explanation for data-savvy users
        """
        return {
            'summary': self._generate_technical_summary(prediction_data, shap_explanation),
            'confidence': float(prediction_data.get('confidence', prediction_data['predicted_value'])),
            'prediction_value': float(prediction_data['predicted_value']),
            'base_value': float(shap_explanation['base_value']),
            'shap_values_sum': float(shap_explanation.get('shap_values_sum', 0)),
            'feature_contributions': shap_explanation['feature_contributions'],
            'top_features': shap_explanation['top_features'],
            'model_type': self.model_type,
            'visualization_available': True,
            'level': 'technical'
        }

    def _generate_technical_summary(
        self,
        prediction_data: Dict,
        shap_explanation: Dict
    ) -> str:
        """Generate technical summary"""
        lines = []

        lines.append(f"**Model Output**")
        lines.append(f"- Prediction: {prediction_data['predicted_value']:.4f}")
        lines.append(f"- Confidence: {prediction_data.get('confidence', 0):.4f}")
        lines.append(f"- Base value: {shap_explanation['base_value']:.4f}")
        lines.append(f"- SHAP sum: {shap_explanation.get('shap_values_sum', 0):.4f}")

        lines.append("\n**Top Feature Contributions (SHAP)**")
        for i, feature in enumerate(shap_explanation['top_features'][:5], 1):
            lines.append(
                f"{i}. {feature['feature']}: {feature['shap_value']:+.4f} "
                f"({feature['impact_percent']:.1f}%)"
            )

        return '\n'.join(lines)

    def _generate_detailed_explanation(
        self,
        prediction_data: Dict,
        shap_explanation: Dict
    ) -> Dict[str, Any]:
        """
        Generate detailed explanation with all information
        """
        return {
            'summary': self._generate_detailed_summary(prediction_data, shap_explanation),
            'confidence': float(prediction_data.get('confidence', prediction_data['predicted_value'])),
            'prediction_value': float(prediction_data['predicted_value']),
            'prediction_type': prediction_data.get('type', self.model_name),
            'base_value': float(shap_explanation['base_value']),
            'shap_values_sum': float(shap_explanation.get('shap_values_sum', 0)),
            'all_features': shap_explanation['feature_contributions'],
            'top_features': shap_explanation['top_features'],
            'model_type': self.model_type,
            'model_name': self.model_name,
            'feature_count': len(shap_explanation['feature_contributions']),
            'visualization_available': True,
            'level': 'detailed'
        }

    def _generate_detailed_summary(
        self,
        prediction_data: Dict,
        shap_explanation: Dict
    ) -> str:
        """Generate detailed technical summary"""
        lines = []

        lines.append("# Detailed Model Explanation\n")

        lines.append("## Prediction Summary")
        lines.append(f"- **Type**: {prediction_data.get('type', self.model_name)}")
        lines.append(f"- **Predicted Value**: {prediction_data['predicted_value']:.6f}")
        lines.append(f"- **Confidence**: {prediction_data.get('confidence', 0):.6f}")
        lines.append(f"- **Model**: {self.model_name} ({self.model_type})")

        lines.append("\n## SHAP Analysis")
        lines.append(f"- **Base Value** (expected): {shap_explanation['base_value']:.6f}")
        lines.append(f"- **SHAP Values Sum**: {shap_explanation.get('shap_values_sum', 0):.6f}")
        lines.append(f"- **Features Analyzed**: {len(shap_explanation['feature_contributions'])}")

        lines.append("\n## Top 10 Contributing Features")
        for i, feature in enumerate(shap_explanation['top_features'][:10], 1):
            lines.append(
                f"{i}. **{feature['feature']}**\n"
                f"   - Value: {feature['value']:.4f}\n"
                f"   - SHAP: {feature['shap_value']:+.6f}\n"
                f"   - Impact: {feature['impact']} prediction by {feature['impact_percent']:.2f}%"
            )

        return '\n'.join(lines)

    def _generate_fallback_explanation(self, prediction_data: Dict) -> Dict[str, Any]:
        """
        Generate fallback explanation when SHAP fails
        """
        return {
            'summary': (
                f"Prediction: {prediction_data['predicted_value']:.4f}\n"
                f"Confidence: {prediction_data.get('confidence', 0):.4f}\n\n"
                "Note: Detailed explanation unavailable. Please contact support."
            ),
            'confidence': float(prediction_data.get('confidence', prediction_data['predicted_value'])),
            'prediction_value': float(prediction_data['predicted_value']),
            'key_factors': [],
            'visualization_available': False,
            'level': 'fallback',
            'error': 'Explanation generation failed'
        }


if __name__ == "__main__":
    logger.info("Model Interpretability Service initialized")
