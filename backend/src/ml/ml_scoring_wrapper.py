#!/usr/bin/env python3
"""
ML Scoring Wrapper
Command-line interface for scoring users via Node.js integration
Loads trained models and scores users based on signals and features
"""

import sys
import json
import os
from alert_model import AlertScoringModel

def score_user(request_data):
    """
    Score a single user

    Args:
        request_data: Dict with user_id, signals, user_features, model_type, model_path

    Returns:
        JSON string with scoring result
    """
    try:
        user_id = request_data['user_id']
        signals = request_data['signals']
        user_features = request_data['user_features']
        model_type = request_data['model_type']
        model_path = request_data['model_path']

        # Initialize model
        model = AlertScoringModel(model_type=model_type)

        # Load model if file exists
        if os.path.exists(model_path):
            model.load_model(model_path)
        else:
            # Return default low score if model not found
            return json.dumps({
                'user_id': user_id,
                'model_type': model_type,
                'prediction': 0,
                'confidence': 0.3,
                'calibrated_score': 0.3,
                'top_features': {},
                'signal_count': len(signals),
                'model_version': 'default',
                'error': 'Model not found - using default scores'
            })

        # Score user
        result = model.score_user(signals, user_features)
        result['user_id'] = user_id

        return json.dumps(result)

    except Exception as e:
        error_result = {
            'error': str(e),
            'user_id': request_data.get('user_id', 'unknown'),
            'model_type': request_data.get('model_type', 'unknown'),
            'confidence': 0.0
        }
        return json.dumps(error_result)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            'error': 'Usage: python ml_scoring_wrapper.py <command> <json_data>'
        }))
        sys.exit(1)

    command = sys.argv[1]

    if command == 'score_user':
        try:
            request_data = json.loads(sys.argv[2])
            result = score_user(request_data)
            print(result)
            sys.exit(0)
        except Exception as e:
            print(json.dumps({
                'error': f'Failed to score user: {str(e)}'
            }))
            sys.exit(1)
    else:
        print(json.dumps({
            'error': f'Unknown command: {command}'
        }))
        sys.exit(1)
