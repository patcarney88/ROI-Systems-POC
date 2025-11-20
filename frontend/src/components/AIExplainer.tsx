import { useState } from 'react';
import { Brain, X, TrendingUp, Activity, Eye } from 'lucide-react';
import './AIExplainer.css';

interface Signal {
  type: string;
  description: string;
  weight: number;
}

interface AIExplainerProps {
  confidence: number;
  signals: Signal[];
  prediction: string;
  className?: string;
}

export default function AIExplainer({
  confidence,
  signals,
  prediction,
  className = ''
}: AIExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'value_check':
      case 'website_visit':
        return <Eye size={16} />;
      case 'email_open':
      case 'document_view':
        return <Activity size={16} />;
      default:
        return <TrendingUp size={16} />;
    }
  };

  return (
    <div className={`ai-explainer ${className}`}>
      <button
        className="ai-explainer-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="How does AI predict this?"
      >
        <Brain size={16} />
        <span>How does AI predict this?</span>
      </button>

      {isOpen && (
        <div className="ai-explainer-modal">
          <div className="ai-explainer-overlay" onClick={() => setIsOpen(false)} />
          <div className="ai-explainer-content">
            <div className="ai-explainer-header">
              <div className="ai-explainer-title">
                <Brain size={24} />
                <h3>AI Prediction Explained</h3>
              </div>
              <button
                className="ai-explainer-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ai-explainer-body">
              <div className="prediction-section">
                <h4>Prediction</h4>
                <p className="prediction-text">{prediction}</p>
              </div>

              <div className="confidence-section">
                <h4>Confidence Score</h4>
                <div className="confidence-bar-container">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${confidence}%`,
                        backgroundColor: getConfidenceColor(confidence)
                      }}
                    />
                  </div>
                  <span className="confidence-value" style={{ color: getConfidenceColor(confidence) }}>
                    {confidence}%
                  </span>
                </div>
                <p className="confidence-explanation">
                  {confidence >= 80
                    ? 'High confidence - Strong signals indicate this prediction is very likely.'
                    : confidence >= 60
                    ? 'Medium confidence - Several signals support this prediction.'
                    : 'Lower confidence - Limited signals, monitor for more data.'}
                </p>
              </div>

              <div className="signals-section">
                <h4>What AI Detected</h4>
                <p className="signals-intro">
                  Our AI analyzed these behavioral signals to make this prediction:
                </p>
                <div className="signals-list">
                  {signals.map((signal, index) => (
                    <div key={index} className="signal-item">
                      <div className="signal-icon">
                        {getSignalIcon(signal.type)}
                      </div>
                      <div className="signal-content">
                        <p className="signal-description">{signal.description}</p>
                        <div className="signal-weight">
                          <div className="weight-bar">
                            <div
                              className="weight-fill"
                              style={{ width: `${signal.weight * 10}%` }}
                            />
                          </div>
                          <span className="weight-label">
                            {signal.weight >= 10 ? 'Strong' : signal.weight >= 5 ? 'Medium' : 'Weak'} signal
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="how-it-works-section">
                <h4>How It Works</h4>
                <p>
                  Our AI continuously monitors client behavior across multiple touchpoints:
                  website visits, email engagement, document views, and property searches.
                  When specific patterns emerge, the system generates predictions to help
                  you engage at the perfect moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
