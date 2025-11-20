import { useEffect, useState } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const updateMetric = (metric: Metric) => {
      setMetrics((prev) => ({ ...prev, [metric.name]: metric }));
    };

    onCLS(updateMetric);
    onFCP(updateMetric);
    onINP(updateMetric);  // INP replaces FID
    onLCP(updateMetric);
    onTTFB(updateMetric);
  }, []);

  if (!import.meta.env.DEV) return null;

  const getMetricColor = (rating: string | undefined) => {
    switch (rating) {
      case 'good':
        return '#0cce6b';
      case 'needs-improvement':
        return '#ffa400';
      case 'poor':
        return '#ff4e42';
      default:
        return '#666';
    }
  };

  const formatMetricValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    if (value < 1) {
      return `${value.toFixed(2)}ms`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${Math.round(value)}ms`;
  };

  const getMetricDescription = (name: string): string => {
    switch (name) {
      case 'CLS':
        return 'Cumulative Layout Shift';
      case 'FCP':
        return 'First Contentful Paint';
      case 'INP':
        return 'Interaction to Next Paint';
      case 'LCP':
        return 'Largest Contentful Paint';
      case 'TTFB':
        return 'Time to First Byte';
      default:
        return name;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '320px',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          Web Vitals Monitor
        </h4>
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Dev Only
        </span>
      </div>

      {Object.keys(metrics).length === 0 ? (
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
          Collecting metrics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.values(metrics).map((metric) => (
            <div
              key={metric.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                  {metric.name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {getMetricDescription(metric.name)}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {formatMetricValue(metric.name, metric.value)}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: getMetricColor(metric.rating),
                    fontWeight: 500,
                    textTransform: 'uppercase',
                  }}
                >
                  {metric.rating || 'pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        Metrics update as you interact with the page
      </div>
    </div>
  );
}