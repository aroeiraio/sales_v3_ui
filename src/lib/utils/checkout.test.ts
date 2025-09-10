import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  getDisplayPaymentMethods,
  isPixPayment,
  getPaymentMethodName,
  isValidPaymentMethod,
  registerPaymentMethod,
  isPaymentMethodRegistered,
  type PaymentBroker,
  type PaymentMethodConfig
} from './checkout';

describe('checkout utilities', () => {
  describe('formatPrice', () => {
    it('should format valid numbers in BRL currency', () => {
      expect(formatPrice(1000)).toBe('R$\u00A01.000,00'); // Unicode non-breaking space
      expect(formatPrice(123.45)).toBe('R$\u00A0123,45');
      expect(formatPrice(0)).toBe('R$\u00A00,00');
      expect(formatPrice(0.99)).toBe('R$\u00A00,99');
    });

    it('should handle edge cases gracefully', () => {
      expect(formatPrice(undefined)).toBe('R$\u00A00,00');
      expect(formatPrice(null)).toBe('R$\u00A00,00');
      expect(formatPrice(NaN)).toBe('R$\u00A00,00');
    });

    it('should format large numbers correctly', () => {
      expect(formatPrice(1234567.89)).toBe('R$\u00A01.234.567,89');
    });
  });

  describe('getDisplayPaymentMethods', () => {
    const mockBrokers: PaymentBroker[] = [
      {
        broker: 'MERCADOPAGO',
        available: true,
        methods: ['pix']
      },
      {
        broker: 'MERCADOPAGO_PINPAD',
        available: true,
        methods: ['credit', 'debit']
      },
      {
        broker: 'UNAVAILABLE_BROKER',
        available: false,
        methods: ['test']
      }
    ];

    it('should transform available payment methods correctly', () => {
      const result = getDisplayPaymentMethods(mockBrokers);
      
      expect(result).toHaveLength(3);
      
      // PIX method
      expect(result[0]).toEqual({
        id: 'MERCADOPAGO-pix',
        broker: 'MERCADOPAGO',
        method: 'pix',
        name: 'PIX',
        description: 'Pagamento instantâneo via QR Code',
        icon: 'qr-code'
      });
      
      // Credit card method
      expect(result[1]).toEqual({
        id: 'MERCADOPAGO_PINPAD-credit',
        broker: 'MERCADOPAGO_PINPAD',
        method: 'credit',
        name: 'Cartão de Crédito',
        description: 'Insira ou aproxime seu cartão',
        icon: 'credit-card'
      });
      
      // Debit card method
      expect(result[2]).toEqual({
        id: 'MERCADOPAGO_PINPAD-debit',
        broker: 'MERCADOPAGO_PINPAD',
        method: 'debit',
        name: 'Cartão de Débito',
        description: 'Insira ou aproxime seu cartão',
        icon: 'landmark'
      });
    });

    it('should exclude unavailable brokers', () => {
      const result = getDisplayPaymentMethods(mockBrokers);
      
      // Should not include methods from unavailable broker
      const unavailableMethods = result.filter(method => 
        method.broker === 'UNAVAILABLE_BROKER'
      );
      expect(unavailableMethods).toHaveLength(0);
    });

    it('should handle empty broker list', () => {
      const result = getDisplayPaymentMethods([]);
      expect(result).toHaveLength(0);
    });

    it('should handle brokers with unknown methods using fallbacks', () => {
      const unknownBrokers: PaymentBroker[] = [
        {
          broker: 'UNKNOWN_BROKER',
          available: true,
          methods: ['pix', 'credit', 'unknown_method']
        }
      ];
      
      const result = getDisplayPaymentMethods(unknownBrokers);
      expect(result).toHaveLength(3);
      
      // Should use default fallback for pix
      expect(result[0]).toEqual({
        id: 'UNKNOWN_BROKER-pix',
        broker: 'UNKNOWN_BROKER',
        method: 'pix',
        name: 'PIX',
        description: 'Pagamento instantâneo',
        icon: 'qr-code'
      });
      
      // Should use default fallback for credit
      expect(result[1]).toEqual({
        id: 'UNKNOWN_BROKER-credit',
        broker: 'UNKNOWN_BROKER',
        method: 'credit',
        name: 'Cartão de Crédito',
        description: 'Pagamento com cartão',
        icon: 'credit-card'
      });
      
      // Should auto-generate for unknown method
      expect(result[2]).toEqual({
        id: 'UNKNOWN_BROKER-unknown_method',
        broker: 'UNKNOWN_BROKER',
        method: 'unknown_method',
        name: 'Unknown_method',
        description: 'Pagamento via unknown_method',
        icon: 'credit-card'
      });
    });

    it('should allow registering new payment methods dynamically', () => {
      // Register a new broker/method combination
      registerPaymentMethod('TEST_BROKER', 'wallet', {
        name: 'Carteira Digital',
        description: 'Pagamento via carteira',
        icon: 'wallet'
      });

      // Check if it's registered
      expect(isPaymentMethodRegistered('TEST_BROKER', 'wallet')).toBe(true);
      expect(isPaymentMethodRegistered('TEST_BROKER', 'unknown')).toBe(false);

      // Test with the new broker
      const brokers = [
        {
          broker: 'TEST_BROKER',
          available: true,
          methods: ['wallet']
        }
      ];

      const result = getDisplayPaymentMethods(brokers);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'TEST_BROKER-wallet',
        broker: 'TEST_BROKER',
        method: 'wallet',
        name: 'Carteira Digital',
        description: 'Pagamento via carteira',
        icon: 'wallet'
      });
    });
  });

  describe('isPixPayment', () => {
    it('should identify PIX payments correctly', () => {
      expect(isPixPayment('MERCADOPAGO-pix')).toBe(true);
      expect(isPixPayment('ANY_BROKER-pix')).toBe(true);
      expect(isPixPayment('UNKNOWN_BROKER-pix')).toBe(true);
    });

    it('should not identify non-PIX payments as PIX', () => {
      expect(isPixPayment('MERCADOPAGO_PINPAD-credit')).toBe(false);
      expect(isPixPayment('MERCADOPAGO_PINPAD-debit')).toBe(false);
      expect(isPixPayment('OTHER_BROKER-method')).toBe(false);
      expect(isPixPayment('MERCADOPAGO-mercadopago')).toBe(false); // Legacy method name
    });

    it('should handle empty or invalid input', () => {
      expect(isPixPayment('')).toBe(false);
      expect(isPixPayment('invalid')).toBe(false);
    });
  });

  describe('getPaymentMethodName', () => {
    const displayMethods: PaymentMethodConfig[] = [
      {
        id: 'MERCADOPAGO-pix',
        broker: 'MERCADOPAGO',
        method: 'pix',
        name: 'PIX',
        description: 'Pagamento instantâneo via QR Code',
        icon: 'qr-code'
      },
      {
        id: 'MERCADOPAGO_PINPAD-credit',
        broker: 'MERCADOPAGO_PINPAD',
        method: 'credit',
        name: 'Cartão de Crédito',
        description: 'Insira ou aproxime seu cartão',
        icon: 'credit-card'
      }
    ];

    it('should return correct payment method name', () => {
      expect(getPaymentMethodName('MERCADOPAGO-pix', displayMethods))
        .toBe('PIX');
      expect(getPaymentMethodName('MERCADOPAGO_PINPAD-credit', displayMethods))
        .toBe('Cartão de Crédito');
    });

    it('should return empty string for unknown method', () => {
      expect(getPaymentMethodName('UNKNOWN-method', displayMethods))
        .toBe('');
    });

    it('should handle empty display methods array', () => {
      expect(getPaymentMethodName('MERCADOPAGO-pix', []))
        .toBe('');
    });
  });

  describe('isValidPaymentMethod', () => {
    const availableBrokers: PaymentBroker[] = [
      {
        broker: 'MERCADOPAGO',
        available: true,
        methods: ['pix']
      },
      {
        broker: 'MERCADOPAGO_PINPAD',
        available: true,
        methods: ['credit', 'debit']
      },
      {
        broker: 'UNAVAILABLE_BROKER',
        available: false,
        methods: ['test']
      }
    ];

    it('should validate available payment methods', () => {
      expect(isValidPaymentMethod('MERCADOPAGO-pix', availableBrokers))
        .toBe(true);
      expect(isValidPaymentMethod('MERCADOPAGO_PINPAD-credit', availableBrokers))
        .toBe(true);
      expect(isValidPaymentMethod('MERCADOPAGO_PINPAD-debit', availableBrokers))
        .toBe(true);
    });

    it('should reject unavailable brokers', () => {
      expect(isValidPaymentMethod('UNAVAILABLE_BROKER-test', availableBrokers))
        .toBe(false);
    });

    it('should reject unknown brokers', () => {
      expect(isValidPaymentMethod('UNKNOWN_BROKER-method', availableBrokers))
        .toBe(false);
    });

    it('should reject invalid method for valid broker', () => {
      expect(isValidPaymentMethod('MERCADOPAGO-invalid_method', availableBrokers))
        .toBe(false);
    });

    it('should reject empty or malformed payment method IDs', () => {
      expect(isValidPaymentMethod('', availableBrokers)).toBe(false);
      expect(isValidPaymentMethod('invalid', availableBrokers)).toBe(false);
      expect(isValidPaymentMethod('missing-broker', availableBrokers)).toBe(false);
    });
  });
});