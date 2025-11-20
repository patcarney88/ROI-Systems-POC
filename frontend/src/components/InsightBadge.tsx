import { Lightbulb, TrendingUp, TrendingDown, Info } from 'lucide-react';
import './InsightBadge.css';

interface InsightBadgeProps {
  type?: 'success' | 'warning' | 'info' | 'neutral';
  icon?: 'lightbulb' | 'trending-up' | 'trending-down' | 'info';
  message: string;
  className?: string;
}

export default function InsightBadge({
  type = 'info',
  icon = 'lightbulb',
  message,
  className = ''
}: InsightBadgeProps) {
  const IconComponent = {
    'lightbulb': Lightbulb,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'info': Info
  }[icon];

  return (
    <div className={`insight-badge insight-badge-${type} ${className}`}>
      <IconComponent size={14} className="insight-icon" />
      <span className="insight-message">{message}</span>
    </div>
  );
}
