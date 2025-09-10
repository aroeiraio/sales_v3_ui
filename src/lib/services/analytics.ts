import { performanceService } from './performance';

interface AnalyticsEvent {
  name: string;
  category: 'user_action' | 'system_event' | 'business_metric' | 'error';
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  value?: number;
}

interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActivityTime: number;
  pageViews: number;
  events: number;
  userAgent: string;
  screenResolution: string;
}

interface AnalyticsConfig {
  enableLogging: boolean;
  enableLocalStorage: boolean;
  flushInterval: number; // ms
  maxEvents: number;
  endpoint?: string;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionInfo: SessionInfo;
  private config: AnalyticsConfig = {
    enableLogging: true,
    enableLocalStorage: true,
    flushInterval: 30000, // 30 seconds
    maxEvents: 500
  };
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...config };
    this.sessionInfo = this.initializeSession();
    
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startPeriodicFlush();
      this.loadPersistedEvents();
    }
  }

  private initializeSession(): SessionInfo {
    const now = Date.now();
    return {
      sessionId: this.generateSessionId(),
      startTime: now,
      lastActivityTime: now,
      pageViews: 0,
      events: 0,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenResolution: typeof screen !== 'undefined' 
        ? `${screen.width}x${screen.height}` 
        : 'unknown'
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', 'system_event', {
        visible: !document.hidden
      });
    });

    // Before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // User activity tracking
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, this.updateLastActivity.bind(this), { passive: true });
    });
  }

  private updateLastActivity(): void {
    this.sessionInfo.lastActivityTime = Date.now();
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private loadPersistedEvents(): void {
    if (!this.config.enableLocalStorage) return;
    
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        const parsedEvents = JSON.parse(stored);
        this.events = parsedEvents.filter((event: AnalyticsEvent) => 
          // Only load events from the last 24 hours
          Date.now() - event.timestamp < 24 * 60 * 60 * 1000
        );
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics events:', error);
    }
  }

  private persistEvents(): void {
    if (!this.config.enableLocalStorage) return;
    
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to persist analytics events:', error);
    }
  }

  track(
    name: string, 
    category: AnalyticsEvent['category'] = 'user_action',
    properties?: Record<string, any>,
    value?: number
  ): void {
    const event: AnalyticsEvent = {
      name,
      category,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        timestamp_iso: new Date().toISOString()
      },
      timestamp: Date.now(),
      sessionId: this.sessionInfo.sessionId,
      value
    };

    this.events.push(event);
    this.sessionInfo.events++;
    this.updateLastActivity();

    // Keep events array manageable
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    if (this.config.enableLogging) {
      console.log('[Analytics]', name, properties);
    }

    this.persistEvents();
  }

  // Business-specific tracking methods
  trackPageView(page: string, title?: string): void {
    this.sessionInfo.pageViews++;
    this.track('page_view', 'user_action', {
      page,
      title: title || document.title,
      page_views_in_session: this.sessionInfo.pageViews
    });
  }

  trackProductView(product: any): void {
    this.track('product_view', 'business_metric', {
      product_id: product.itemId,
      product_name: product.name,
      product_price: product.price,
      product_category: product.categoryId,
      in_stock: product.amount > 0
    });
  }

  trackAddToCart(product: any, quantity: number): void {
    this.track('add_to_cart', 'business_metric', {
      product_id: product.itemId,
      product_name: product.name,
      product_price: product.price,
      quantity,
      cart_value: product.price * quantity
    }, product.price * quantity);
  }

  trackRemoveFromCart(product: any, quantity: number): void {
    this.track('remove_from_cart', 'business_metric', {
      product_id: product.itemId,
      product_name: product.name,
      quantity,
      cart_value_removed: product.price * quantity
    }, -(product.price * quantity));
  }

  trackCartView(cart: any): void {
    this.track('cart_view', 'business_metric', {
      item_count: cart.items?.length || 0,
      cart_total: cart.total,
      cart_subtotal: cart.subtotal,
      service_fee: cart.serviceFee,
      discount: cart.discount
    }, cart.total);
  }

  trackCheckoutStart(cart: any): void {
    this.track('checkout_start', 'business_metric', {
      item_count: cart.items?.length || 0,
      cart_total: cart.total,
      checkout_step: 1
    }, cart.total);
  }

  trackPaymentMethodSelect(paymentMethod: string): void {
    this.track('payment_method_select', 'business_metric', {
      payment_method: paymentMethod,
      checkout_step: 2
    });
  }

  trackPaymentStart(paymentMethod: string, amount: number): void {
    this.track('payment_start', 'business_metric', {
      payment_method: paymentMethod,
      amount,
      checkout_step: 3
    }, amount);
  }

  trackPaymentSuccess(transactionId: string, paymentMethod: string, amount: number): void {
    this.track('payment_success', 'business_metric', {
      transaction_id: transactionId,
      payment_method: paymentMethod,
      amount,
      checkout_step: 4
    }, amount);
  }

  trackPaymentFailure(paymentMethod: string, amount: number, error?: string): void {
    this.track('payment_failure', 'error', {
      payment_method: paymentMethod,
      amount,
      error_message: error,
      checkout_step: 4
    });
  }

  trackDeliveryStart(transactionId: string): void {
    this.track('delivery_start', 'business_metric', {
      transaction_id: transactionId,
      checkout_step: 5
    });
  }

  trackDeliveryComplete(transactionId: string, deliveryTime: number): void {
    this.track('delivery_complete', 'business_metric', {
      transaction_id: transactionId,
      delivery_time_ms: deliveryTime,
      checkout_step: 6
    }, deliveryTime);
  }

  trackError(error: Error, context?: string): void {
    this.track('javascript_error', 'error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      user_agent: navigator.userAgent
    });
  }

  trackCustomEvent(name: string, properties?: Record<string, any>, value?: number): void {
    this.track(`custom_${name}`, 'user_action', properties, value);
  }

  // User engagement metrics
  trackSessionStart(): void {
    this.track('session_start', 'system_event', {
      session_duration_expected: this.config.flushInterval
    });
  }

  trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionInfo.startTime;
    this.track('session_end', 'system_event', {
      session_duration_ms: sessionDuration,
      page_views: this.sessionInfo.pageViews,
      events_tracked: this.sessionInfo.events,
      last_activity_ago: Date.now() - this.sessionInfo.lastActivityTime
    }, sessionDuration);
  }

  // Funnel analysis helpers
  trackFunnelStep(funnelName: string, step: number, stepName: string, properties?: Record<string, any>): void {
    this.track(`funnel_${funnelName}_step_${step}`, 'business_metric', {
      funnel_name: funnelName,
      step_number: step,
      step_name: stepName,
      ...properties
    });
  }

  // Get analytics data
  getEvents(category?: AnalyticsEvent['category'], limit?: number): AnalyticsEvent[] {
    let filtered = category ? this.events.filter(e => e.category === category) : this.events;
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  // Analytics summary
  getAnalyticsSummary(): Record<string, any> {
    const now = Date.now();
    const sessionDuration = now - this.sessionInfo.startTime;
    
    const businessEvents = this.getEvents('business_metric');
    const userActions = this.getEvents('user_action');
    const errors = this.getEvents('error');

    return {
      session: {
        id: this.sessionInfo.sessionId,
        duration_ms: sessionDuration,
        page_views: this.sessionInfo.pageViews,
        events_count: this.sessionInfo.events,
        last_activity_ago_ms: now - this.sessionInfo.lastActivityTime
      },
      events: {
        total: this.events.length,
        business_metrics: businessEvents.length,
        user_actions: userActions.length,
        errors: errors.length
      },
      performance: performanceService.getPerformanceSummary()
    };
  }

  // Flush events to server/storage
  flush(): void {
    if (this.events.length === 0) return;

    const payload = {
      events: [...this.events],
      session: this.getSessionInfo(),
      timestamp: Date.now(),
      performance: performanceService.getPerformanceSummary()
    };

    if (this.config.endpoint) {
      this.sendToEndpoint(payload);
    }

    if (this.config.enableLogging) {
      console.log('[Analytics] Flushing events:', payload);
    }

    // Keep only recent events after flush
    this.events = this.events.slice(-100);
    this.persistEvents();
  }

  private async sendToEndpoint(payload: any): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  // Clear all data
  clear(): void {
    this.events = [];
    this.sessionInfo = this.initializeSession();
    
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('analytics_events');
    }
  }

  // Export data for debugging or analysis
  exportData(): string {
    return JSON.stringify({
      session: this.getSessionInfo(),
      events: this.events,
      summary: this.getAnalyticsSummary()
    }, null, 2);
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.flush();
    this.trackSessionEnd();
  }
}

// Singleton instance
let _analyticsService: AnalyticsService | null = null;

export const analyticsService = {
  get instance(): AnalyticsService {
    if (!_analyticsService) {
      _analyticsService = new AnalyticsService();
    }
    return _analyticsService;
  },

  // Delegate commonly used methods
  track(name: string, category: AnalyticsEvent['category'] = 'user_action', properties?: Record<string, any>, value?: number): void {
    return this.instance.track(name, category, properties, value);
  },

  trackPageView(page: string, title?: string): void {
    return this.instance.trackPageView(page, title);
  },

  trackProductView(product: any): void {
    return this.instance.trackProductView(product);
  },

  trackAddToCart(product: any, quantity: number): void {
    return this.instance.trackAddToCart(product, quantity);
  },

  trackPaymentSuccess(transactionId: string, paymentMethod: string, amount: number): void {
    return this.instance.trackPaymentSuccess(transactionId, paymentMethod, amount);
  },

  trackError(error: Error, context?: string): void {
    return this.instance.trackError(error, context);
  },

  trackSessionStart(): void {
    return this.instance.trackSessionStart();
  },

  trackSessionEnd(): void {
    return this.instance.trackSessionEnd();
  },

  getAnalyticsSummary(): Record<string, any> {
    return this.instance.getAnalyticsSummary();
  },

  flush(): void {
    return this.instance.flush();
  },

  exportData(): string {
    return this.instance.exportData();
  }
};

export type { AnalyticsEvent, SessionInfo, AnalyticsConfig };