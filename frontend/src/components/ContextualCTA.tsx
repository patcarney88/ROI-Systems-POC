import { useState, useEffect } from 'react';
import { X, Calendar, Zap } from 'lucide-react';
import './ContextualCTA.css';

interface ContextualCTAProps {
  dashboardName: string;
  delayMs?: number; // Delay before showing CTA (default: 30 seconds)
  onStartTrial?: () => void;
  onScheduleDemo?: () => void;
  onDismiss?: () => void;
}

export default function ContextualCTA({
  dashboardName,
  delayMs = 30000, // 30 seconds
  onStartTrial,
  onScheduleDemo,
  onDismiss
}: ContextualCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed CTAs in this session
    const dismissed = sessionStorage.getItem(`cta-dismissed-${dashboardName}`);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show CTA after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [dashboardName, delayMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem(`cta-dismissed-${dashboardName}`, 'true');
    onDismiss?.();
  };

  const handleStartTrial = () => {
    onStartTrial?.();
    // For demo, navigate to registration
    window.location.href = '/register';
  };

  const handleScheduleDemo = () => {
    onScheduleDemo?.();
    // For demo, open contact page
    window.location.href = '/contact';
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="contextual-cta">
      <div className="contextual-cta-content">
        <div className="contextual-cta-message">
          <h3>Like what you see?</h3>
          <p>Experience the power of {dashboardName} in your business</p>
        </div>
        <div className="contextual-cta-actions">
          <button
            className="cta-btn cta-btn-primary"
            onClick={handleStartTrial}
          >
            <Zap size={18} />
            <span>Start Free Trial</span>
          </button>
          <button
            className="cta-btn cta-btn-secondary"
            onClick={handleScheduleDemo}
          >
            <Calendar size={18} />
            <span>Schedule Demo</span>
          </button>
        </div>
        <button
          className="contextual-cta-close"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
