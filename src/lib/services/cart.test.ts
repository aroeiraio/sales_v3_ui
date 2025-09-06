import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartService } from './cart';

// Mock fetch globally
global.fetch = vi.fn();

describe('CartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch to return successful responses
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
    
    // Clear cart before each test
    cartService.clearCart();
  });

  describe('getCartCount', () => {
    it('should return 0 for empty cart', () => {
      expect(cartService.getCartCount()).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      cartService.clearCart();
      expect(cartService.getCartCount()).toBe(0);
    });
  });

  describe('getCart (async)', () => {
    it('should return cart data', async () => {
      const cart = await cartService.getCart();
      
      expect(cart).toHaveProperty('items');
      expect(cart).toHaveProperty('total');
      expect(cart).toHaveProperty('subtotal');
      expect(Array.isArray(cart.items)).toBe(true);
    });
  });

  describe('API integration', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      // Should not throw, but handle error gracefully
      await expect(cartService.getCart()).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' })
      } as Response);
      
      await expect(cartService.getCart()).rejects.toThrow();
    });
  });

  describe('Development mode', () => {
    beforeEach(() => {
      // Ensure we're in development mode
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });
    });

    it('should work in development mode without API', async () => {
      const cart = await cartService.getCart();
      expect(cart).toBeDefined();
      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });
  });
});