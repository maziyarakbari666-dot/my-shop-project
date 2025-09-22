'use client';

import { useEffect } from 'react';

// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: {},
      resources: [],
      customMarks: new Map(),
      vitals: {}
    };
    this.observers = [];
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
  }

  // Initialize performance monitoring
  init() {
    if (!this.isSupported) return;

    this.observeNavigation();
    this.observeResources();
    this.observeWebVitals();
    this.setupCustomObservers();
  }

  // Observe navigation timing
  observeNavigation() {
    if (!this.isSupported) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.navigation = {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domParsing: navigation.domInteractive - navigation.responseEnd,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domComplete: navigation.domComplete - navigation.domInteractive,
        loadEvent: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoad: navigation.loadEventEnd - navigation.navigationStart
      };
    }
  }

  // Observe resource loading
  observeResources() {
    if (!this.isSupported) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
          };
          this.metrics.resources.push(resource);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  // Get resource type from URL
  getResourceType(url) {
    const extensions = {
      image: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
      script: /\.(js|mjs)$/i,
      style: /\.css$/i,
      font: /\.(woff|woff2|ttf|eot)$/i
    };

    for (const [type, regex] of Object.entries(extensions)) {
      if (regex.test(url)) return type;
    }
    return 'other';
  }

  // Observe Web Vitals
  observeWebVitals() {
    if (!this.isSupported) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.vitals.lcp = lastEntry.startTime;
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.metrics.vitals.fid = entry.processingStart - entry.startTime;
        }
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.vitals.cls = clsValue;
        }
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);
  }

  // Setup custom observers for React components
  setupCustomObservers() {
    if (!this.isSupported) return;

    // Mark custom events
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'mark') {
          this.metrics.customMarks.set(entry.name, entry.startTime);
        } else if (entry.entryType === 'measure') {
          this.metrics.customMarks.set(entry.name, entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['mark', 'measure'] });
    this.observers.push(observer);
  }

  // Mark custom performance points
  mark(name) {
    if (this.isSupported && performance.mark) {
      performance.mark(name);
    }
  }

  // Measure between two marks
  measure(name, startMark, endMark) {
    if (this.isSupported && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    };
  }

  // Calculate performance score
  getPerformanceScore() {
    const { vitals } = this.metrics;
    let score = 100;

    // LCP scoring (ideal < 2.5s, poor > 4s)
    if (vitals.lcp) {
      if (vitals.lcp > 4000) score -= 30;
      else if (vitals.lcp > 2500) score -= 15;
    }

    // FID scoring (ideal < 100ms, poor > 300ms)
    if (vitals.fid) {
      if (vitals.fid > 300) score -= 25;
      else if (vitals.fid > 100) score -= 10;
    }

    // CLS scoring (ideal < 0.1, poor > 0.25)
    if (vitals.cls) {
      if (vitals.cls > 0.25) score -= 25;
      else if (vitals.cls > 0.1) score -= 10;
    }

    return Math.max(0, score);
  }

  // Send metrics to analytics (example)
  sendMetrics() {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();

    // In a real app, you would send this to your analytics service
    console.group('Performance Metrics');
    console.log('Score:', score);
    console.log('Web Vitals:', metrics.vitals);
    console.log('Navigation:', metrics.navigation);
    console.log('Resources:', metrics.resources);
    console.groupEnd();

    // Example: Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_performance', {
        custom_parameter_lcp: metrics.vitals.lcp,
        custom_parameter_fid: metrics.vitals.fid,
        custom_parameter_cls: metrics.vitals.cls,
        custom_parameter_score: score
      });
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// React component for performance monitoring
function PerformanceMonitorComponent({ enabled = true, autoReport = true }) {
  useEffect(() => {
    if (!enabled) return;

    // Initialize monitoring
    performanceMonitor.init();

    // Mark page load start
    performanceMonitor.mark('page-load-start');

    // Report metrics after page is fully loaded
    if (autoReport) {
      const reportTimeout = setTimeout(() => {
        performanceMonitor.mark('page-load-end');
        performanceMonitor.measure('total-page-load', 'page-load-start', 'page-load-end');
        performanceMonitor.sendMetrics();
      }, 1000);

      return () => {
        clearTimeout(reportTimeout);
        performanceMonitor.cleanup();
      };
    }

    return () => performanceMonitor.cleanup();
  }, [enabled, autoReport]);

  // This component doesn't render anything
  return null;
}

// Export as default
export default PerformanceMonitorComponent;

// Export the monitor instance for manual use
export { performanceMonitor };

// Helper hook for component-level performance tracking
export function usePerformanceTracking(componentName) {
  useEffect(() => {
    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-render`;

    performanceMonitor.mark(startMark);

    return () => {
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(measureName, startMark, endMark);
    };
  }, [componentName]);
}
