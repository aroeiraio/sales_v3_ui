import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentService } from './payment';
import { cartService } from './cart';
import { sessionService } from './session';
import { errorDialogService } from './errorDialog';

// Mock dependencies
vi.mock('./cart', () => ({
  cartService: {
    getCart: vi.fn(),
    clearCart: vi.fn()
  }
}));

vi.mock('./session', () => ({
  sessionService: {
    getSession: vi.fn()
  }
}));

vi.mock('./errorDialog', () => ({
  errorDialogService: {
    showError: vi.fn()
  }
}));

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default session
    vi.mocked(sessionService.getSession).mockReturnValue({
      sessionId: 'test-session',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      isActive: true
    });
    
    // Mock default cart
    vi.mocked(cartService.getCart).mockReturnValue({
      items: [
        {
          id: '1',
          productId: 'prod-1',
          name: 'Test Product',
          price: 10.0,
          quantity: 2
        }
      ],
      total: 20.0,
      subtotal: 20.0,
      fees: 0,
      discount: 0
    });
  });

  describe('getPaymentMethods', () => {
    it('should return available payment methods', () => {
      const methods = paymentService.getPaymentMethods();
      
      expect(methods).toHaveLength(3);
      expect(methods[0].id).toBe('credit_card');
      expect(methods[1].id).toBe('debit_card');
      expect(methods[2].id).toBe('pix');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully in development mode', async () => {
      // Mock successful payment
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // > 0.2, so success
      
      const result = await paymentService.processPayment('credit_card');
      
      expect(result.status).toBe('success');
      expect(result.transactionId).toMatch(/^mock-\d+$/);
      expect(result.receipt).toBeDefined();
      expect(cartService.clearCart).toHaveBeenCalled();
    });

    it('should handle payment failure in development mode', async () => {
      // Mock payment failure
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.2, so failure
      
      const result = await paymentService.processPayment('credit_card');
      
      expect(result.status).toBe('failed');
      expect(result.transactionId).toMatch(/^failed-\d+$/);
      expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('should throw error for invalid session', async () => {
      vi.mocked(sessionService.getSession).mockReturnValue(null);
      
      await expect(paymentService.processPayment('credit_card'))
        .rejects.toThrow('Sessão inválida ou expirada');
    });

    it('should throw error for empty cart', async () => {
      vi.mocked(cartService.getCart).mockReturnValue({
        items: [],
        total: 0,
        subtotal: 0,
        fees: 0,
        discount: 0
      });
      
      await expect(paymentService.processPayment('credit_card'))
        .rejects.toThrow('Carrinho vazio');
    });

    it('should throw error for inactive session', async () => {
      vi.mocked(sessionService.getSession).mockReturnValue({
        sessionId: 'test-session',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        isActive: false
      });
      
      await expect(paymentService.processPayment('credit_card'))
        .rejects.toThrow('Sessão inválida ou expirada');
    });
  });

  describe('getPaymentMethodById', () => {
    it('should return payment method by id', () => {
      const method = paymentService.getPaymentMethodById('pix');
      
      expect(method).toBeDefined();
      expect(method?.name).toBe('PIX');
      expect(method?.type).toBe('pix');
    });

    it('should return undefined for invalid id', () => {
      const method = paymentService.getPaymentMethodById('invalid');
      
      expect(method).toBeUndefined();
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      const total = paymentService.calculateTotal(100, 10, 5);
      
      expect(total).toBe(105); // 100 + 10 - 5
    });

    it('should not return negative total', () => {
      const total = paymentService.calculateTotal(100, 0, 150);
      
      expect(total).toBe(0); // Math.max(0, 100 + 0 - 150)
    });

    it('should handle default fees and discount', () => {
      const total = paymentService.calculateTotal(100);
      
      expect(total).toBe(100); // 100 + 0 - 0
    });
  });
});