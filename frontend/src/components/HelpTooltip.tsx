import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  content: string;
  learnMoreUrl?: string;
}

export default function HelpTooltip({ title, content, learnMoreUrl }: HelpTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#3b82f6';
          setShowTooltip(true);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6b7280';
          setShowTooltip(false);
        }}
        onClick={() => setShowTooltip(!showTooltip)}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'help',
          color: '#6b7280',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle size={16} />
      </button>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            background: '#1f2937',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            fontSize: '0.875rem',
            lineHeight: '1.5',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f2937'
          }} />

          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{title}</div>
          <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>{content}</div>

          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                color: '#60a5fa',
                fontSize: '0.8125rem',
                textDecoration: 'none',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Learn More →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
