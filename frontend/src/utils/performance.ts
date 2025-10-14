/**
 * Performance Monitoring Utilities
 *
 * Web Vitals tracking, custom performance marks, navigation timing,
 * resource timing, and analytics reporting
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte

  // Custom metrics
  customMarks?: Map<string, number>;
  navigationTiming?: NavigationTimingMetrics;
  resourceTiming?: ResourceTimingMetrics[];
}

interface NavigationTimingMetrics {
  dnsLookup: number;
  tcpConnection: number;
  requestTime: number;
  responseTime: number;
  domProcessing: number;
  loadComplete: number;
  totalTime: number;
}

interface ResourceTimingMetrics {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    customMarks: new Map()
  };
  private observers: PerformanceObserver[] = [];
  private analyticsEndpoint?: string;

  constructor(options: { analyticsEndpoint?: string } = {}) {
    this.analyticsEndpoint = options.analyticsEndpoint;
    this.initWebVitals();
    this.initNavigationTiming();
    this.initResourceTiming();
  }

  /**
   * Initialize Web Vitals tracking
   */
  private initWebVitals() {
    // Largest Contentful Paint
    onLCP((metric) => {
      this.metrics.LCP = metric.value;
      this.reportMetric('LCP', metric);
    });

    // First Input Delay
    onFID((metric) => {
      this.metrics.FID = metric.value;
      this.reportMetric('FID', metric);
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.metrics.CLS = metric.value;
      this.reportMetric('CLS', metric);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.metrics.FCP = metric.value;
      this.reportMetric('FCP', metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.metrics.TTFB = metric.value;
      this.reportMetric('TTFB', metric);
    });
  }

  /**
   * Initialize Navigation Timing tracking
   */
  private initNavigationTiming() {
    if (!('performance' in window) || !('getEntriesByType' in performance)) {
      return;
    }

    window.addEventListener('load', () => {
      const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      if (navigation) {
        this.metrics.navigationTiming = {
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnection: navigation.connectEnd - navigation.connectStart,
          requestTime: navigation.responseStart - navigation.requestStart,
          responseTime: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domComplete - navigation.domInteractive,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        };

        console.log('Navigation Timing:', this.metrics.navigationTiming);
      }
    });
  }

  /**
   * Initialize Resource Timing tracking
   */
  private initResourceTiming() {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const resources: ResourceTimingMetrics[] = [];

        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            resources.push({
              name: resource.name,
              type: this.getResourceType(resource.name),
              duration: resource.duration,
              size: resource.transferSize,
              cached: resource.transferSize === 0
            });
          }
        });

        this.metrics.resourceTiming = resources;
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('PerformanceObserver not supported');
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'stylesheet';
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|otf)$/.test(url)) return 'font';
    return 'other';
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, metric: Metric) {
    const { value, rating, delta } = metric;

    console.log(`${name}:`, {
      value: Math.round(value),
      rating,
      delta: Math.round(delta)
    });

    // Send to analytics endpoint
    if (this.analyticsEndpoint) {
      this.sendToAnalytics({
        name,
        value,
        rating,
        delta,
        id: metric.id,
        timestamp: Date.now()
      });
    }

    // Log warnings for poor metrics
    if (rating === 'poor') {
      console.warn(`Poor ${name} detected:`, value);
    }
  }

  /**
   * Send metrics to analytics endpoint
   */
  private async sendToAnalytics(data: any) {
    try {
      if (navigator.sendBeacon) {
        // Use sendBeacon for reliability
        navigator.sendBeacon(
          this.analyticsEndpoint!,
          JSON.stringify(data)
        );
      } else {
        // Fallback to fetch
        await fetch(this.analyticsEndpoint!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        });
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  /**
   * Create custom performance mark
   */
  mark(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      this.metrics.customMarks?.set(name, performance.now());
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    if ('performance' in window && 'measure' in performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }

        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const duration = measures[measures.length - 1].duration;
          console.log(`${name}:`, Math.round(duration), 'ms');
          return duration;
        }
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }
    return 0;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  /**
   * Get performance score (0-100)
   */
  getScore(): number {
    const { LCP = 0, FID = 0, CLS = 0 } = this.metrics;

    // Scoring thresholds (Google recommendations)
    const lcpScore = LCP <= 2500 ? 100 : LCP <= 4000 ? 50 : 0;
    const fidScore = FID <= 100 ? 100 : FID <= 300 ? 50 : 0;
    const clsScore = CLS <= 0.1 ? 100 : CLS <= 0.25 ? 50 : 0;

    return Math.round((lcpScore + fidScore + clsScore) / 3);
  }

  /**
   * Get performance grade
   */
  getGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.getScore();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Log performance summary
   */
  logSummary() {
    console.group('Performance Summary');
    console.log('Score:', this.getScore(), `(${this.getGrade()})`);
    console.log('LCP:', this.metrics.LCP?.toFixed(2), 'ms');
    console.log('FID:', this.metrics.FID?.toFixed(2), 'ms');
    console.log('CLS:', this.metrics.CLS?.toFixed(3));
    console.log('FCP:', this.metrics.FCP?.toFixed(2), 'ms');
    console.log('TTFB:', this.metrics.TTFB?.toFixed(2), 'ms');

    if (this.metrics.navigationTiming) {
      console.log('Navigation Timing:', this.metrics.navigationTiming);
    }

    if (this.metrics.resourceTiming) {
      const totalSize = this.metrics.resourceTiming.reduce(
        (sum, r) => sum + r.size,
        0
      );
      console.log('Resources:', this.metrics.resourceTiming.length);
      console.log('Total Size:', (totalSize / 1024).toFixed(2), 'KB');
    }

    console.groupEnd();
  }

  /**
   * Cleanup observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Singleton instance
 */
let monitorInstance: PerformanceMonitor | null = null;

/**
 * Get or create performance monitor instance
 */
export function getPerformanceMonitor(
  options?: { analyticsEndpoint?: string }
): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor(options);
  }
  return monitorInstance;
}

/**
 * Simple performance measurement decorator
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const startMark = `${propertyKey}-start`;
    const endMark = `${propertyKey}-end`;

    const monitor = getPerformanceMonitor();
    monitor.mark(startMark);

    try {
      const result = await originalMethod.apply(this, args);
      monitor.mark(endMark);
      monitor.measure(propertyKey, startMark, endMark);
      return result;
    } catch (error) {
      monitor.mark(endMark);
      monitor.measure(propertyKey, startMark, endMark);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Track long tasks (>50ms)
 */
export function trackLongTasks(callback: (duration: number) => void) {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry.duration, 'ms');
          callback(entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('Long task tracking not supported');
  }
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; limit: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize / 1048576, // MB
      totalJSHeapSize: memory.totalJSHeapSize / 1048576, // MB
      limit: memory.jsHeapSizeLimit / 1048576 // MB
    };
  }
  return null;
}

/**
 * Report performance to console
 */
export function reportPerformance() {
  const monitor = getPerformanceMonitor();
  monitor.logSummary();

  const memory = getMemoryUsage();
  if (memory) {
    console.log('Memory Usage:', {
      used: `${memory.usedJSHeapSize.toFixed(2)} MB`,
      total: `${memory.totalJSHeapSize.toFixed(2)} MB`,
      limit: `${memory.limit.toFixed(2)} MB`
    });
  }
}

export default {
  PerformanceMonitor,
  getPerformanceMonitor,
  measurePerformance,
  trackLongTasks,
  getMemoryUsage,
  reportPerformance
};
