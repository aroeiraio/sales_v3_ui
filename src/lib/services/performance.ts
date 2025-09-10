interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'interaction' | 'api' | 'error';
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  enableLogging: boolean;
  sampleRate: number;
  endpoint?: string;
  maxMetrics: number;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceConfig = {
    enableLogging: true,
    sampleRate: 1.0,
    maxMetrics: 1000
  };

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };
    
    // Initialize performance observers if available
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    try {
      // Temporarily disable performance observers to debug dialog issue
      console.log('Performance observers temporarily disabled for debugging');
      
      // Listen for unhandled errors
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  private observeNavigationTiming(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          this.recordMetric({
            name: 'page_load_time',
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            category: 'navigation',
            metadata: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              firstPaint: this.getFirstPaint(),
              transferSize: navEntry.transferSize
            }
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
  }

  private observeLargestContentfulPaint(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        name: 'largest_contentful_paint',
        value: lastEntry.startTime,
        category: 'navigation',
        metadata: {
          element: (lastEntry as any).element?.tagName || 'unknown'
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      // LCP not supported in some browsers
    }
  }

  private observeFirstInputDelay(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'first_input_delay',
          value: (entry as any).processingStart - entry.startTime,
          category: 'interaction',
          metadata: {
            name: entry.name,
            startTime: entry.startTime
          }
        });
      }
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      // FID not supported in some browsers
    }
  }

  private observeCumulativeLayoutShift(): void {
    let clsValue = 0;
    let lastRecorded = 0;
    const RECORDING_THRESHOLD = 0.1; // Only record significant changes
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      // Only record if there's a significant change to prevent loops
      if (Math.abs(clsValue - lastRecorded) > RECORDING_THRESHOLD) {
        this.recordMetric({
          name: 'cumulative_layout_shift',
          value: clsValue,
          category: 'navigation'
        });
        lastRecorded = clsValue;
      }
    });
    
    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // CLS not supported in some browsers
    }
  }

  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint?.startTime;
  }

  private handleError(event: ErrorEvent): void {
    this.recordMetric({
      name: 'javascript_error',
      value: 1,
      category: 'error',
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.recordMetric({
      name: 'unhandled_promise_rejection',
      value: 1,
      category: 'error',
      metadata: {
        reason: event.reason?.toString() || 'Unknown rejection',
        stack: event.reason?.stack
      }
    });
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.shouldSample()) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);
    
    // Keep metrics array size manageable
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    if (this.config.enableLogging && metric.category !== 'navigation') {
      console.log(`[Performance] ${metric.name}:`, metric.value, metric.metadata);
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  // API timing helper
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        category: 'api',
        metadata: {
          ...metadata,
          status: 'success'
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        category: 'api',
        metadata: {
          ...metadata,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }

  // User interaction timing
  measureInteraction(name: string, duration: number, metadata?: Record<string, any>): void {
    this.recordMetric({
      name: `interaction_${name}`,
      value: duration,
      category: 'interaction',
      metadata
    });
  }

  // Get metrics for analysis
  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  // Get performance summary
  getPerformanceSummary(): Record<string, any> {
    const navigationMetrics = this.getMetrics('navigation');
    const apiMetrics = this.getMetrics('api');
    const interactionMetrics = this.getMetrics('interaction');
    const errorMetrics = this.getMetrics('error');

    return {
      navigation: {
        count: navigationMetrics.length,
        avgPageLoadTime: this.getAverage(navigationMetrics, 'page_load_time'),
        avgLCP: this.getAverage(navigationMetrics, 'largest_contentful_paint'),
        avgFID: this.getAverage(interactionMetrics, 'first_input_delay'),
        avgCLS: this.getAverage(navigationMetrics, 'cumulative_layout_shift')
      },
      api: {
        count: apiMetrics.length,
        avgResponseTime: this.getAverage(apiMetrics),
        errorRate: this.getErrorRate(apiMetrics)
      },
      interactions: {
        count: interactionMetrics.length,
        avgDuration: this.getAverage(interactionMetrics)
      },
      errors: {
        count: errorMetrics.length,
        jsErrors: errorMetrics.filter(m => m.name === 'javascript_error').length,
        promiseRejections: errorMetrics.filter(m => m.name === 'unhandled_promise_rejection').length
      }
    };
  }

  private getAverage(metrics: PerformanceMetric[], name?: string): number {
    const filteredMetrics = name ? metrics.filter(m => m.name === name) : metrics;
    if (filteredMetrics.length === 0) return 0;
    
    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / filteredMetrics.length;
  }

  private getErrorRate(apiMetrics: PerformanceMetric[]): number {
    if (apiMetrics.length === 0) return 0;
    
    const errorCount = apiMetrics.filter(m => 
      m.metadata?.status === 'error'
    ).length;
    
    return errorCount / apiMetrics.length;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics (for sending to analytics service)
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      summary: this.getPerformanceSummary()
    });
  }
}

// Singleton instance
let _performanceService: PerformanceService | null = null;

export const performanceService = {
  get instance(): PerformanceService {
    if (!_performanceService) {
      _performanceService = new PerformanceService();
    }
    return _performanceService;
  },

  // Delegate methods for easier usage
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    return this.instance.recordMetric(metric);
  },

  measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.instance.measureApiCall(name, apiCall, metadata);
  },

  measureInteraction(name: string, duration: number, metadata?: Record<string, any>): void {
    return this.instance.measureInteraction(name, duration, metadata);
  },

  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    return this.instance.getMetrics(category);
  },

  getPerformanceSummary(): Record<string, any> {
    return this.instance.getPerformanceSummary();
  },

  exportMetrics(): string {
    return this.instance.exportMetrics();
  },

  clearMetrics(): void {
    return this.instance.clearMetrics();
  }
};

export type { PerformanceMetric, PerformanceConfig };