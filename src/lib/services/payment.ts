import { post } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { errorDialogService } from './errorDialog';
import { cartService } from './cart';
import { sessionService } from './session';

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
  broker: 'MERCADOPAGO_PINPAD' | 'MERCADOPAGO';
  method: 'credit' | 'debit' | 'mercadopago';
}

export interface PosPaymentStatus {
  action: 'WAIT' | 'INSERT_TAP_CARD' | 'RELEASE' | 'SHOW_RETRY';
  status: 'idle' | 'PAYMENT_APPROVED' | 'PAYMENT_REFUSED' | string;
  broker: string;
  session: string;
  timestamp: string;
  pending_messages: number;
  read: boolean;
  transactionId?: string;
  amount?: number;
}

export type PaymentState = 
  | 'idle' 
  | 'wait' 
  | 'insert_tap_card' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'retry';

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

  private pollingInterval: NodeJS.Timeout | null = null;
  private currentState: PaymentState = 'idle';
  private stateChangeCallback: ((state: PaymentState, data?: any) => void) | null = null;

  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  getCurrentState(): PaymentState {
    return this.currentState;
  }

  onStateChange(callback: (state: PaymentState, data?: any) => void) {
    this.stateChangeCallback = callback;
  }

  private setState(newState: PaymentState, data?: any) {
    this.currentState = newState;
    if (this.stateChangeCallback) {
      this.stateChangeCallback(newState, data);
    }
  }

  async processPayment(paymentMethod: string): Promise<PaymentResponse> {
    try {
      this.setState('processing');
      
      // Check if cart has items (cart is required for both session and checkout flows)
      const cartItems = cartService.getCartItems();
      const cartTotal = cartService.getCartTotal();
      
      console.log('Payment service cart check:', {
        cartItems: cartItems,
        cartItemsLength: cartItems?.length || 0,
        cartTotal: cartTotal,
        hasCartItems: !!(cartItems && cartItems.length > 0)
      });
      
      if (!cartItems || cartItems.length === 0) {
        console.error('Payment failed: Cart appears to be empty', {
          cartItems,
          cartTotal,
          cartItemsType: typeof cartItems,
          cartItemsArray: Array.isArray(cartItems)
        });
        throw new Error('Cart is empty');
      }
      
      // Build cart object for logging and processing
      const cart = {
        items: cartItems,
        total: cartTotal,
        subtotal: cartTotal, // Simplified for now
        serviceFee: 0,
        discount: 0
      };

      // Session is optional - checkout flow doesn't require sessions
      const session = sessionService.getSession();
      console.log('Payment processing:', {
        hasSession: session?.isActive,
        cartTotal: cart.total,
        paymentMethod: paymentMethod
      });
      
      // Map UI payment methods to PoS API format
      const posRequest: PosPaymentRequest = this.mapToPosRequest(paymentMethod);
      
      console.log('Starting payment with:', posRequest);
      console.log('Session ID:', session?.sessionId || 'No session (checkout flow)');
      console.log('Cart total:', cart.total);
      
      // Start payment with PoS API
      const response = await fetch('http://localhost:8090/interface/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(posRequest)
      });

      console.log('Payment API response:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Payment API error: ${response.status} ${response.statusText}`);
      }

      const paymentData = await response.json();
      console.log('Payment data received:', paymentData);
      
      // Wait 2 seconds before starting status polling
      console.log('Waiting 2 seconds before starting polling...');
      setTimeout(() => {
        console.log('Starting status polling...');
        this.startStatusPolling();
      }, 2000);
      
      return {
        transactionId: paymentData.transactionId || paymentData.id || `pos-${Date.now()}`,
        status: 'processing',
        message: 'Payment started, waiting for completion'
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      this.setState('failed', { error: error.message });
      
      throw new Error('Failed to start payment process');
    }
  }

  private mapToPosRequest(paymentMethod: string): PosPaymentRequest {
    // Handle both old format (credit, debit, pix) and new format (BROKER-METHOD)
    if (paymentMethod.includes('-')) {
      // New checkout API format: "MERCADOPAGO-mercadopago" or "MERCADOPAGO_PINPAD-credit"
      const [broker, method] = paymentMethod.split('-');
      
      if (broker === 'MERCADOPAGO' && method === 'mercadopago') {
        return { broker: 'MERCADOPAGO', method: 'mercadopago' };
      } else if (broker === 'MERCADOPAGO_PINPAD' && method === 'credit') {
        return { broker: 'MERCADOPAGO_PINPAD', method: 'credit' };
      } else if (broker === 'MERCADOPAGO_PINPAD' && method === 'debit') {
        return { broker: 'MERCADOPAGO_PINPAD', method: 'debit' };
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
          return { broker: 'MERCADOPAGO', method: 'mercadopago' };
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    }
  }

  private async startStatusPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:8090/interface/payment/status');
        
        if (!response.ok) {
          throw new Error(`Status API error: ${response.status}`);
        }

        const status: PosPaymentStatus = await response.json();
        this.handleStatusUpdate(status);

      } catch (error) {
        console.error('Status polling failed:', error);
        this.stopPolling();
        this.setState('failed', { error: 'Connection lost during payment' });
      }
    }, 1000); // Poll every second
  }

  private handleStatusUpdate(status: PosPaymentStatus) {
    console.log('Payment status update:', status);
    
    switch (status.action) {
      case 'WAIT':
        this.setState('wait');
        break;
      
      case 'INSERT_TAP_CARD':
        this.setState('insert_tap_card');
        break;
      
      case 'RELEASE':
        // Handle successful payment - status field contains the payment result
        if (status.status === 'PAYMENT_APPROVED') {
          this.stopPolling();
          this.setState('success', {
            transactionId: status.transactionId,
            amount: status.amount
          });
          // Clear cart on successful payment (non-blocking, no error dialog)
          cartService.clearCart(false).catch(error => {
            console.warn('Cart clearing failed after successful payment:', error);
            // Don't show error dialog for cart clearing failures after successful payment
          });
        }
        break;
      
      case 'SHOW_RETRY':
        // Handle payment refusal - status field contains the payment result
        if (status.status === 'PAYMENT_REFUSED') {
          this.stopPolling();
          this.setState('retry', {
            canRetry: true,
            message: 'Payment was refused, you can try again'
          });
        }
        break;
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  resetPayment() {
    this.stopPolling();
    this.setState('idle');
  }

  retryPayment() {
    this.setState('idle');
  }

  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(method => method.id === id);
  }

  calculateTotal(subtotal: number, fees: number = 0, discount: number = 0): number {
    return Math.max(0, subtotal + fees - discount);
  }
}

export const paymentService = new PaymentService();