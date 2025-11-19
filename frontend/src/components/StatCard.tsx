import { LucideIcon } from 'lucide-react';
import './StatCard.css';

export type StatCardVariant = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'default';
export type TrendDirection = 'positive' | 'negative' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: StatCardVariant;
  trend?: {
    direction: TrendDirection;
    value: string | number;
    label: string;
    icon?: LucideIcon;
  };
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  loading = false,
  className = '',
  onClick
}: StatCardProps) {
  if (loading) {
    return (
      <div className={`stat-card ${className}`} style={{ background: '#f3f4f6' }}>
        <div className="stat-header">
          <div style={{ width: '120px', height: '16px', background: '#e5e7eb', borderRadius: '4px' }}></div>
        </div>
        <div style={{ width: '80px', height: '32px', background: '#e5e7eb', borderRadius: '4px', marginTop: '0.5rem' }}></div>
        <div style={{ width: '150px', height: '14px', background: '#e5e7eb', borderRadius: '4px', marginTop: '0.5rem' }}></div>
      </div>
    );
  }

  const variantClass = variant !== 'default' ? `gradient-${variant}` : '';
  const clickableClass = onClick ? 'stat-card-clickable' : '';

  return (
    <div 
      className={`stat-card ${variantClass} ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <Icon size={24} className="stat-icon" />
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          {trend.icon && <trend.icon size={16} />}
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
