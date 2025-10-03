import { post } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { errorDialogService } from './errorDialog';
import { cartService } from './cart';
import { sessionService } from './session';
import { paymentNavigationService } from './paymentNavigation';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'credit_card' | 'debit_card' | 'pix' | 'cash';
}

export interface PaymentRequest {
  sessionId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  total: number;
  subtotal: number;
  fees: number;
  discount: number;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'processing' | 'success' | 'failed' | 'cancelled';
  message: string;
  receipt?: {
    transactionId: string;
    timestamp: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    paymentMethod: string;
  };
}

// PoS Payment API Types
export interface PosPaymentRequest {
  broker: 'MERCADOPAGO_PINPAD' | 'MERCADOPAGO' | 'TEST_PAYMENT';
  method: 'credit' | 'debit' | 'mercadopago' | 'pix';
}

export interface PosPaymentStatus {
  action: 'WAIT' | 'INSERT_TAP_CARD' | 'RELEASE' | 'SHOW_RETRY' | 'SHOW_QRCODE';
  status: 'idle' | 'PAYMENT_APPROVED' | 'PAYMENT_REFUSED' | string;
  broker: string;
  session: string;
  timestamp: string;
  pending_messages: number;
  read: boolean;
  transactionId?: string;
  amount?: number;
  qrcode_source?: string;
}

export type PaymentState = 
  | 'idle' 
  | 'wait' 
  | 'show_qrcode'
  | 'insert_tap_card' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'retry'
  | 'payment_timeout';

class PaymentService {
  private readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'credit',
      name: 'Cartão de Crédito',
      description: 'Aproxime, insira ou passe o cartão',
      icon: 'credit-card',
      type: 'credit_card'
    },
    {
      id: 'debit',
      name: 'Cartão de Débito',
      description: 'Aproxime, insira ou passe o cartão',
      icon: 'landmark',
      type: 'debit_card'
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: 'qr-code',
      type: 'pix'
    }
  ];

  private pollingInterval: number | null = null;
  private currentState: PaymentState = 'idle';
  private waitTimeoutId: number | null = null;
  private waitStartTime: number | null = null;
  private currentPaymentMethod = '';
  // Status retry mechanism removed

  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  getCurrentState(): PaymentState {
    return this.currentState;
  }

  onStateChange(callback: (state: PaymentState, data?: any) => void) {
    console.warn('PaymentService: onStateChange is deprecated. Use route-based navigation instead.');
    // Keep for backward compatibility but don't store callback
  }

  private setState(newState: PaymentState, data?: any) {
    // Prevent rapid repeated state changes to the same state
    if (this.currentState === newState) {
      console.log(`Payment service: Ignoring duplicate state change to '${newState}'`);
      return;
    }
    
    console.log(`Payment service: State change from '${this.currentState}' to '${newState}'`);
    console.log(`Payment service: State change data:`, data);
    console.log(`Payment service: Current payment method:`, this.currentPaymentMethod);
    this.currentState = newState;
    
    // Use navigation service for route-based navigation
    console.log(`Payment service: Calling navigation service with state: ${newState}`);
    paymentNavigationService.navigateToState(newState, data, this.currentPaymentMethod);
    console.log(`Payment service: Navigation service called`);
  }

  private startWaitTimeout() {
    // Clear any existing timeout first
    this.clearWaitTimeout();
    
    this.waitStartTime = Date.now();
    console.log('Starting 20-second QR code generation timeout');
    this.waitTimeoutId = setTimeout(async () => {
      console.log('PIX payment QR code generation timeout reached (20s), showing payment failure');
      try {
        // Cancel the payment
        await fetch(`${ENDPOINTS.baseUrl}/payment`, {
          method: 'DELETE'
        });
        this.stopPolling();
        this.setState('failed', { error: 'QR code generation timeout - payment failed' });
      } catch (error) {
        console.error('Error canceling payment:', error);
        this.stopPolling();
        this.setState('failed', { error: 'QR code generation timeout - payment failed' });
      }
    }, 20000); // 20 seconds - QR code generation timeout
  }

  clearWaitTimeout() {
    if (this.waitTimeoutId) {
      console.log('Clearing 20-second QR code generation timeout');
      clearTimeout(this.waitTimeoutId);
      this.waitTimeoutId = null;
      this.waitStartTime = null;
    }
  }

  private isCancellingPayment: boolean = false;
  private isResettingPayment: boolean = false;

  async cancelPayment(): Promise<void> {
    // Prevent multiple simultaneous DELETE requests
    if (this.isCancellingPayment) {
      console.log('Payment cancellation already in progress, ignoring duplicate request');
      return;
    }

    this.isCancellingPayment = true;
    
    try {
      await fetch(`${ENDPOINTS.baseUrl}/payment`, {
        method: 'DELETE'
      });
      console.log('Payment canceled successfully');
    } catch (error) {
      console.error('Error canceling payment:', error);
    } finally {
      this.isCancellingPayment = false;
    }
  }

  async processPayment(paymentMethod: string): Promise<PaymentResponse> {
    try {
      // Store current payment method for navigation
      this.currentPaymentMethod = paymentMethod;

      // Store cart total at payment start as backup
      if (typeof window !== 'undefined') {
        try {
          const { get } = await import('svelte/store');
          const { cart } = await import('../stores/cart');
          const currentCart = get(cart);
          if (currentCart.total > 0) {
            sessionStorage.setItem('paymentStartAmount', currentCart.total.toString());
            console.log('Payment service: Stored cart total at payment start:', currentCart.total);
          }
        } catch (error) {
          console.warn('Payment service: Could not store cart total:', error);
        }
      }

      this.setState('processing');
      
      // Session is optional - checkout flow doesn't require sessions
      const session = sessionService.getSession();
      console.log('Payment processing:', {
        hasSession: session?.isActive,
        paymentMethod: paymentMethod
      });
      
      // Map UI payment methods to PoS API format
      const posRequest: PosPaymentRequest = this.mapToPosRequest(paymentMethod);
      
      console.log('Payment method mapping:', {
        inputPaymentMethod: paymentMethod,
        mappedRequest: posRequest,
        broker: posRequest.broker,
        method: posRequest.method
      });
      console.log('Starting payment with:', posRequest);
      console.log('Session ID:', session?.sessionId || 'No session (checkout flow)');
      
      // Start payment with PoS API
      console.log('Payment API URL being called:', `${ENDPOINTS.baseUrl}/payment`);
      console.log('ENDPOINTS.baseUrl value:', ENDPOINTS.baseUrl);
      const response = await fetch(`${ENDPOINTS.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(posRequest)
      });

      console.log('Payment API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Payment API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const paymentData = await response.json();
      console.log('Payment data received:', paymentData);
      
      // Wait 3 seconds before starting status polling
      console.log('Waiting 3 seconds before starting polling...');
      setTimeout(() => {
        console.log('Starting status polling...');
        this.startStatusPolling();
      }, 3000);
      
      return {
        transactionId: paymentData.transactionId || paymentData.id || `pos-${Date.now()}`,
        status: 'processing',
        message: 'Payment started, waiting for completion'
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      this.setState('failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      throw new Error('Failed to start payment process');
    }
  }

  private mapToPosRequest(paymentMethod: string): PosPaymentRequest {
    // Handle both old format (credit, debit, pix) and new format (BROKER-METHOD)
    if (paymentMethod.includes('-')) {
      // New checkout API format: "MERCADOPAGO-pix" or "MERCADOPAGO_PINPAD-credit"
      const [broker, method] = paymentMethod.split('-');
      
      if (broker === 'MERCADOPAGO' && method === 'pix') {
        return { broker: 'MERCADOPAGO', method: 'pix' };
      } else if (broker === 'MERCADOPAGO_PINPAD' && method === 'credit') {
        return { broker: 'MERCADOPAGO_PINPAD', method: 'credit' };
      } else if (broker === 'MERCADOPAGO_PINPAD' && method === 'debit') {
        return { broker: 'MERCADOPAGO_PINPAD', method: 'debit' };
      } else if (broker === 'TEST_PAYMENT' && method === 'credit') {
        return { broker: 'TEST_PAYMENT', method: 'credit' };
      } else if (broker === 'TEST_PAYMENT' && method === 'debit') {
        return { broker: 'TEST_PAYMENT', method: 'debit' };
      } else if (broker === 'TEST_PAYMENT' && method === 'pix') {
        return { broker: 'TEST_PAYMENT', method: 'pix' };
      } else {
        throw new Error(`Unsupported payment method combination: ${broker}-${method}`);
      }
    } else {
      // Legacy format for backward compatibility
      switch (paymentMethod) {
        case 'credit':
          return { broker: 'MERCADOPAGO_PINPAD', method: 'credit' };
        case 'debit':
          return { broker: 'MERCADOPAGO_PINPAD', method: 'debit' };
        case 'pix':
          return { broker: 'MERCADOPAGO', method: 'pix' };
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    }
  }

  private async startStatusPolling() {
    // Don't start polling if we're already in success state
    if (this.currentState === 'success') {
      console.log('Payment service: Not starting polling - already in success state');
      return;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log('Payment service: Starting status polling');
    this.pollingInterval = setInterval(async () => {
      try {
        // Stop polling if we're in success state
        if (this.currentState === 'success') {
          console.log('Payment service: Stopping polling - success state detected');
          this.stopPolling();
          return;
        }

        const response = await fetch(`${ENDPOINTS.baseUrl}/payment/status`);
        
        if (!response.ok) {
          throw new Error(`Status API error: ${response.status}`);
        }

        const status: PosPaymentStatus = await response.json();
        await this.handleStatusUpdate(status);

      } catch (error) {
        console.error('Status polling failed:', error);
        // No retry mechanism - just log the error and continue
      }
    }, 1000); // Poll every second
  }

  private async handleStatusUpdate(status: PosPaymentStatus) {
    console.log('Payment status update:', status);
    console.log('Current payment method:', this.currentPaymentMethod);
    console.log('Status broker:', status.broker);
    console.log('Status action:', status.action);
    console.log('Status status:', status.status);
    
    switch (status.action) {
      case 'WAIT':
        console.log('WAIT state received for broker:', status.broker);
        console.log('Current payment method:', this.currentPaymentMethod);
        
        // Check if this is a PIX payment based on the payment method, not just broker
        const isPixPayment = this.currentPaymentMethod && (
          this.currentPaymentMethod.includes('pix') || 
          this.currentPaymentMethod.includes('MERCADOPAGO-pix') ||
          this.currentPaymentMethod === 'pix'
        );
        
        if (isPixPayment && this.currentState !== 'show_qrcode') {
          console.log('PIX payment in WAIT state - starting QR code generation timeout');
          // For PIX, WAIT state is handled in processing - just continue waiting for SHOW_QRCODE
          // Start 30-second timeout for QR code generation (if SHOW_QRCODE doesn't come)
          this.startWaitTimeout();
        } else if (!isPixPayment && (status.broker === 'TEST_PAYMENT' || status.broker === 'MERCADOPAGO_PINPAD')) {
          console.log(`${status.broker} in WAIT state - navigating to card instructions`);
          // For card payments (TEST_PAYMENT or MERCADOPAGO_PINPAD), WAIT state means ready for card interaction
          // Navigate to card instructions page
          this.setState('insert_tap_card');
        }
        break;
      
      case 'SHOW_QRCODE':
        console.log('QR code ready, clearing generation timeout and starting user payment timer');
        // Clear timeout since QR code is ready
        this.clearWaitTimeout();
        this.setState('show_qrcode', {
          qrcode_source: status.qrcode_source,
          amount: status.amount,
          session: status.session
        });
        break;
      
      case 'INSERT_TAP_CARD':
        console.log('INSERT_TAP_CARD action received - navigating to card instructions');
        console.log('INSERT_TAP_CARD: Current state before setState:', this.currentState);
        console.log('INSERT_TAP_CARD: Current payment method:', this.currentPaymentMethod);
        console.log('INSERT_TAP_CARD: Broker:', status.broker);
        console.log('INSERT_TAP_CARD: Full status object:', status);
        
        // INSERT_TAP_CARD always means navigate to card instructions
        // Keep polling active to monitor for payment completion/failure
        this.setState('insert_tap_card');
        console.log('INSERT_TAP_CARD: setState called, new state should be insert_tap_card');
        break;
      
      case 'RELEASE':
        // Handle successful payment - status field contains the payment result
        if (status.status === 'PAYMENT_APPROVED') {
          console.log('Payment approved - stopping polling and transitioning to success state');
          this.stopPolling();

          // Get cart total BEFORE clearing it, in case payment amount is missing
          let paymentAmount = status.amount;
          if (!paymentAmount || paymentAmount === 0) {
            // Import cart dynamically to avoid circular dependencies
            const { get } = await import('svelte/store');
            const { cart } = await import('../stores/cart');
            const currentCart = get(cart);
            paymentAmount = currentCart.total;
            console.log('Payment service: Using cart total as payment amount:', paymentAmount);

            // Store in sessionStorage as backup for success page
            if (typeof window !== 'undefined' && paymentAmount > 0) {
              sessionStorage.setItem('lastPaymentAmount', paymentAmount.toString());
              console.log('Payment service: Stored payment amount in session storage:', paymentAmount);
            }
          }

          this.setState('success', {
            transactionId: status.transactionId,
            amount: paymentAmount
          });

          // Clear cart on successful payment (non-blocking, no error dialog)
          cartService.clearCart(false).catch(error => {
            console.warn('Cart clearing failed after successful payment:', error);
            // Don't show error dialog for cart clearing failures after successful payment
          });
        } else {
          console.log('RELEASE case without PAYMENT_APPROVED status:', status);
        }
        break;
      
      case 'SHOW_RETRY':
        // Handle payment refusal - status field contains the payment result
        if (status.status === 'PAYMENT_REFUSED') {
          this.stopPolling();
          paymentNavigationService.handleRetry();
          this.setState('retry', {
            canRetry: paymentNavigationService.getRetryStatus().canRetry,
            message: 'Payment was refused, you can try again'
          });
        }
        break;
      
      default:
        console.log('Unknown status action:', status.action);
        console.log('Status data:', status);
        // Don't change state for unknown actions, just log them
        break;
    }
  }

  stopPolling() {
    console.log('Payment service: stopPolling called', {
      hasPollingInterval: !!this.pollingInterval,
      currentState: this.currentState
    });
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Payment service: Polling stopped successfully');
    } else {
      console.log('Payment service: No polling interval to stop');
    }
  }

  resetPayment() {
    // Prevent multiple simultaneous reset calls
    if (this.isResettingPayment) {
      console.log('Payment reset already in progress, ignoring duplicate request');
      return;
    }

    this.isResettingPayment = true;

    try {
      console.log('Payment service: Resetting payment state');
      this.stopPolling();
      this.clearWaitTimeout();
      this.currentPaymentMethod = '';
      // Status retry mechanism removed
      paymentNavigationService.resetRetryCount();

      // Clear payment session storage on reset (but not when navigating to success)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('paymentStartAmount');
        sessionStorage.removeItem('lastPaymentAmount');
        console.log('Payment service: Cleared payment amounts from session storage');
      }

      this.setState('idle');
    } finally {
      // Use setTimeout to prevent immediate subsequent calls
      setTimeout(() => {
        this.isResettingPayment = false;
      }, 100);
    }
  }

  retryPayment() {
    paymentNavigationService.resetRetryCount();
    this.setState('idle');
  }

  /**
   * Get current payment method
   */
  getCurrentPaymentMethod(): string {
    return this.currentPaymentMethod;
  }

  /**
   * Get retry status from navigation service
   */
  getRetryStatus() {
    return paymentNavigationService.getRetryStatus();
  }

  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(method => method.id === id);
  }

  calculateTotal(subtotal: number, fees: number = 0, discount: number = 0): number {
    return Math.max(0, subtotal + fees - discount);
  }
}

export const paymentService = new PaymentService();