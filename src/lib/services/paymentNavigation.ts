import { goto } from '$app/navigation';
import type { PaymentState } from './payment';
import { get } from 'svelte/store';
import { cart } from '../stores/cart';

/**
 * Payment Navigation Service
 * 
 * Handles navigation between payment routes based on payment state changes.
 * This service replaces the complex state management in components with 
 * simple route-based navigation.
 */
class PaymentNavigationService {
  private retryCount = 0;
  private maxRetries = 3;
  private lastPaymentMethod = '';

  /**
   * Navigate to the appropriate route based on payment state
   */
  navigateToState(state: PaymentState, data?: any, paymentMethod?: string) {
    console.log(`PaymentNavigation: Navigating to state '${state}'`, data);
    console.log(`PaymentNavigation: Payment method:`, paymentMethod);
    console.log(`PaymentNavigation: Current URL:`, typeof window !== 'undefined' ? window.location.pathname : 'unknown');
    console.log(`PaymentNavigation: Navigation called at:`, new Date().toISOString());

    if (paymentMethod) {
      this.lastPaymentMethod = paymentMethod;
    }

    switch (state) {
      case 'idle':
        goto('/payment/method-selection');
        break;

      case 'processing':
        goto('/payment/processing');
        break;

      case 'wait':
        // Stay on processing page during wait state
        break;

      case 'show_qrcode':
        // Navigate to PIX route with QR code data
        const qrParams = new URLSearchParams();
        if (data?.qrcode_source) {
          qrParams.set('qrcode', encodeURIComponent(data.qrcode_source));
        }
        if (data?.amount) {
          qrParams.set('amount', data.amount.toString());
        }
        if (data?.session) {
          qrParams.set('session', data.session);
        }
        const paramString = qrParams.toString();
        goto(`/payment/pix${paramString ? '?' + paramString : ''}`);
        break;

      case 'insert_tap_card':
        // Navigate to card route only if not already on card page
        const cardParams = new URLSearchParams();
        let method = this.lastPaymentMethod || 'credit';
        
        // Extract the actual method from the payment method string
        // Handle formats like "TEST_PAYMENT-credit" or "MERCADOPAGO_PINPAD-debit"
        if (method.includes('-')) {
          method = method.split('-')[1];
        }
        
        // Ensure method is valid for card page
        if (!['credit', 'debit'].includes(method)) {
          method = 'credit'; // fallback
        }
        
        cardParams.set('method', method);
        const cardUrl = `/payment/card?${cardParams.toString()}`;
        
        console.log('PaymentNavigation: INSERT_TAP_CARD received');
        console.log('PaymentNavigation: Last payment method:', this.lastPaymentMethod);
        console.log('PaymentNavigation: Extracted method:', method);
        console.log('PaymentNavigation: Current URL:', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
        console.log('PaymentNavigation: Target card URL:', cardUrl);
        
        // Check if we're already on the card page with the correct method
        if (typeof window !== 'undefined' && window.location.pathname === '/payment/card') {
          const currentMethod = new URLSearchParams(window.location.search).get('method');
          if (currentMethod === method) {
            console.log('PaymentNavigation: Already on card page with correct method, not navigating');
            return; // Don't navigate, just stay on current page
          }
        }
        
        console.log('PaymentNavigation: Navigating to card route');
        goto(cardUrl);
        break;

      case 'success':
        // Navigate to success page with transaction data
        console.log('PaymentNavigation: SUCCESS case - received data:', data);
        console.log('PaymentNavigation: SUCCESS - transactionId:', data?.transactionId);
        console.log('PaymentNavigation: SUCCESS - amount:', data?.amount);

        // If amount is missing or zero, try to get it from cart
        let amount = data?.amount;
        if (!amount || amount === 0) {
          const currentCart = get(cart);
          amount = currentCart.total;
          console.log('PaymentNavigation: SUCCESS - amount was missing/zero, using cart total:', amount);
        }

        const successParams = new URLSearchParams({
          transactionId: data?.transactionId || '',
          amount: amount?.toString() || '0'
        });

        console.log('PaymentNavigation: SUCCESS - URL params:', successParams.toString());
        goto(`/payment/success?${successParams.toString()}`);
        break;

      case 'failed':
        // Navigate to failed page with error info
        const failedParams = new URLSearchParams({
          type: 'failed',
          error: data?.error || 'Unknown error occurred'
        });
        goto(`/payment/failed?${failedParams.toString()}`);
        break;

      case 'retry':
        // Navigate to retry page with attempt count
        const retryParams = new URLSearchParams({
          retryCount: this.retryCount.toString(),
          reason: data?.message || 'Payment was refused'
        });
        goto(`/payment/retry?${retryParams.toString()}`);
        break;

      case 'payment_timeout':
        // Navigate to timeout page
        goto('/payment/timeout');
        break;

      default:
        console.warn(`PaymentNavigation: Unknown state '${state}', navigating to method selection`);
        console.warn(`PaymentNavigation: Data received:`, data);
        console.warn(`PaymentNavigation: Payment method:`, paymentMethod);
        goto('/payment/method-selection');
        break;
    }
  }

  /**
   * Handle retry attempt
   */
  handleRetry() {
    this.retryCount++;
    console.log(`PaymentNavigation: Retry attempt ${this.retryCount}/${this.maxRetries}`);
  }

  /**
   * Reset retry counter
   */
  resetRetryCount() {
    this.retryCount = 0;
  }

  /**
   * Get current retry status
   */
  getRetryStatus() {
    return {
      count: this.retryCount,
      max: this.maxRetries,
      canRetry: this.retryCount < this.maxRetries
    };
  }

  /**
   * Navigate back to checkout/cart
   */
  navigateToCart() {
    goto('/payment/method-selection');
  }

  /**
   * Navigate to home page
   */
  navigateToHome() {
    goto('/');
  }

  /**
   * Navigate to end screen (delivery)
   */
  navigateToEnd() {
    goto('/end');
  }
}

export const paymentNavigationService = new PaymentNavigationService();