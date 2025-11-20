import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed(): string {
  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}

export function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // Send to analytics in production
  if (import.meta.env.PROD) {
    const body = {
      dsn: import.meta.env.VITE_ANALYTICS_ID || 'development',
      id: metric.id,
      page: window.location.pathname,
      href: window.location.href,
      event_name: metric.name,
      value: metric.value.toString(),
      speed: getConnectionSpeed(),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, JSON.stringify(body));
    } else {
      fetch(vitalsUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);  // INP (Interaction to Next Paint) replaces FID
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}