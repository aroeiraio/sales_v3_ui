/**
 * Timer Manager Service
 * 
 * Centralized timer management to ensure timers are properly cleaned up
 * when navigating between payment screens. This prevents timer conflicts
 * and ensures context-specific timer behavior.
 */

export type TimerType = 'inactivity' | 'qr_generation' | 'qr_scanning' | 'card_payment';

export interface TimeoutState {
  showDialog: boolean;
  showProgressBar: boolean;
  progressWidth: number;
}

interface Timer {
  id: NodeJS.Timeout;
  type: TimerType;
  context: string;
  createdAt: number;
  progressInterval?: NodeJS.Timeout;
  onTimeoutStateChange?: (state: TimeoutState) => void;
}

class TimerManager {
  private timers = new Map<string, Timer>();
  private isNavigating = false;

  /**
   * Create a new timer with automatic cleanup
   */
  createTimer(
    key: string,
    callback: () => void,
    duration: number,
    type: TimerType,
    context: string
  ): string {
    // Clear any existing timer with the same key
    this.clearTimer(key);
    
    console.log(`TimerManager: Creating ${type} timer for ${context} (${duration}ms)`);
    
    const timerId = setTimeout(() => {
      console.log(`TimerManager: Timer ${key} expired in ${context}`);
      this.clearTimer(key);
      if (!this.isNavigating) {
        callback();
      }
    }, duration);

    this.timers.set(key, {
      id: timerId,
      type,
      context,
      createdAt: Date.now()
    });

    return key;
  }

  /**
   * Clear a specific timer
   */
  clearTimer(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer) {
      console.log(`TimerManager: Clearing ${timer.type} timer for ${timer.context}`);
      clearTimeout(timer.id);
      if (timer.progressInterval) {
        clearInterval(timer.progressInterval);
      }
      // Reset timeout state
      if (timer.onTimeoutStateChange) {
        timer.onTimeoutStateChange({
          showDialog: false,
          showProgressBar: false,
          progressWidth: 100
        });
      }
      this.timers.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Clear all timers of a specific type
   */
  clearTimersByType(type: TimerType): number {
    let cleared = 0;
    for (const [key, timer] of this.timers.entries()) {
      if (timer.type === type) {
        this.clearTimer(key);
        cleared++;
      }
    }
    console.log(`TimerManager: Cleared ${cleared} timers of type ${type}`);
    return cleared;
  }

  /**
   * Clear all timers for a specific context
   */
  clearTimersByContext(context: string): number {
    let cleared = 0;
    for (const [key, timer] of this.timers.entries()) {
      if (timer.context === context) {
        this.clearTimer(key);
        cleared++;
      }
    }
    console.log(`TimerManager: Cleared ${cleared} timers for context ${context}`);
    return cleared;
  }

  /**
   * Clear all timers
   */
  clearAllTimers(): number {
    const count = this.timers.size;
    for (const [key] of this.timers.entries()) {
      this.clearTimer(key);
    }
    console.log(`TimerManager: Cleared all ${count} timers`);
    return count;
  }

  /**
   * Set navigation state to prevent timers from firing during navigation
   */
  setNavigating(navigating: boolean): void {
    this.isNavigating = navigating;
    if (navigating) {
      console.log('TimerManager: Navigation started - timers will not fire');
    } else {
      console.log('TimerManager: Navigation completed');
    }
  }

  /**
   * Get timer information
   */
  getTimer(key: string): Timer | undefined {
    return this.timers.get(key);
  }

  /**
   * Get all active timers
   */
  getActiveTimers(): { key: string; timer: Timer }[] {
    return Array.from(this.timers.entries()).map(([key, timer]) => ({ key, timer }));
  }

  /**
   * Check if a timer exists
   */
  hasTimer(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * Get timer status for debugging
   */
  getStatus(): {
    totalTimers: number;
    timersByType: Record<TimerType, number>;
    isNavigating: boolean;
  } {
    const timersByType = {
      inactivity: 0,
      qr_generation: 0,
      qr_scanning: 0,
      card_payment: 0
    };

    for (const timer of this.timers.values()) {
      timersByType[timer.type]++;
    }

    return {
      totalTimers: this.timers.size,
      timersByType,
      isNavigating: this.isNavigating
    };
  }

  /**
   * Create convenience methods for common timer types
   */
  createInactivityTimer(context: string, callback: () => void, duration: number = 60000): string {
    return this.createTimer(`inactivity-${context}`, callback, duration, 'inactivity', context);
  }

  /**
   * Create inactivity timer with cart-like progress bar and dialog
   */
  createInactivityTimerWithDialog(
    context: string, 
    callback: () => void, 
    onTimeoutStateChange: (state: TimeoutState) => void,
    onContinue: () => void,
    duration: number = 60000
  ): string {
    const key = `inactivity-dialog-${context}`;
    
    // Clear any existing timer with the same key
    this.clearTimer(key);
    
    const PROGRESS_THRESHOLD = 11000; // Show dialog when less than 11 seconds remain
    const sessionStartTime = Date.now();
    
    console.log(`TimerManager: Creating inactivity timer with dialog for ${context} (${duration}ms)`);
    
    // Initialize state
    onTimeoutStateChange({
      showDialog: false,
      showProgressBar: false,
      progressWidth: 100
    });
    
    const timerId = setTimeout(() => {
      console.log(`TimerManager: Inactivity timer ${key} expired in ${context}`);
      this.clearTimer(key);
      if (!this.isNavigating) {
        callback();
      }
    }, duration);

    // Progress interval
    const progressInterval = setInterval(() => {
      if (this.isNavigating) {
        return;
      }

      const elapsed = Date.now() - sessionStartTime;
      const remaining = duration - elapsed;
      
      if (remaining <= PROGRESS_THRESHOLD && remaining > 0) {
        const progressWidth = Math.max(0, (remaining / PROGRESS_THRESHOLD) * 100);
        
        onTimeoutStateChange({
          showDialog: true,
          showProgressBar: true,
          progressWidth
        });
      } else if (remaining <= 0) {
        clearInterval(progressInterval);
      } else {
        onTimeoutStateChange({
          showDialog: false,
          showProgressBar: false,
          progressWidth: 100
        });
      }
    }, 100); // Update every 100ms for smooth animation

    this.timers.set(key, {
      id: timerId,
      type: 'inactivity',
      context,
      createdAt: Date.now(),
      progressInterval,
      onTimeoutStateChange
    });

    return key;
  }

  /**
   * Continue/reset an inactivity timer with dialog
   */
  continueInactivityTimer(context: string, onTimeoutStateChange: (state: TimeoutState) => void, onContinue: () => void): void {
    const key = `inactivity-dialog-${context}`;
    const timer = this.timers.get(key);
    
    if (timer && timer.onTimeoutStateChange) {
      // Reset dialog state
      timer.onTimeoutStateChange({
        showDialog: false,
        showProgressBar: false,
        progressWidth: 100
      });
      
      // Recreate the timer
      const callback = () => {
        // This will be the original callback
        console.log('Session timeout - navigating home');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      };
      
      this.createInactivityTimerWithDialog(context, callback, onTimeoutStateChange, onContinue);
      
      // Call the continue callback
      onContinue();
    }
  }

  createQRGenerationTimer(context: string, callback: () => void, duration: number = 20000): string {
    return this.createTimer(`qr-generation-${context}`, callback, duration, 'qr_generation', context);
  }

  createQRScanningTimer(context: string, callback: () => void, duration: number = 60000): string {
    return this.createTimer(`qr-scanning-${context}`, callback, duration, 'qr_scanning', context);
  }

  createCardPaymentTimer(context: string, callback: () => void, duration: number = 180000): string {
    return this.createTimer(`card-payment-${context}`, callback, duration, 'card_payment', context);
  }
}

export const timerManager = new TimerManager();

// Debug: Log timer manager initialization
console.log('TimerManager initialized:', timerManager);