import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deliveryService, type DeliveryStatus } from './delivery';

// Mock the API utilities
vi.mock('../utils/api', () => ({
  get: vi.fn()
}));

import { get } from '../utils/api';

describe('DeliveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    deliveryService.stopPolling();
  });

  describe('getDeliveryStatus', () => {
    it('should return delivery status from API', async () => {
      const mockStatus: DeliveryStatus = {
        msg_code: 'DISPENSER_DELIVERY_ACTIVE',
        message: 'Produtos sendo entregues',
        STATUS: 'ACTIVE'
      };

      vi.mocked(get).mockResolvedValueOnce(mockStatus);

      const result = await deliveryService.getDeliveryStatus();
      
      expect(result).toEqual(mockStatus);
      expect(get).toHaveBeenCalledWith('/delivery');
    });

    it('should return mock status when API fails', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('API Error'));
      
      const result = await deliveryService.getDeliveryStatus();
      
      expect(result).toEqual({
        msg_code: 'DISPENSER_DELIVERY_IDLE',
        message: 'Preparando produtos para entrega',
        STATUS: 'IDLE'
      });
    });
  });

  describe('startPolling', () => {
    it('should call callback with delivery status at intervals', async () => {
      const callback = vi.fn();
      const mockStatus: DeliveryStatus = {
        msg_code: 'DISPENSER_DELIVERY_ACTIVE',
        message: 'Produtos sendo entregues',
        STATUS: 'ACTIVE'
      };

      vi.mocked(get).mockResolvedValue(mockStatus);

      deliveryService.startPolling(callback, 1000);
      
      // Initial call
      await vi.advanceTimersByTimeAsync(0);
      expect(callback).toHaveBeenCalledWith(mockStatus);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // After interval
      await vi.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(2);
      
      // After another interval
      await vi.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should stop existing polling before starting new one', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const mockStatus: DeliveryStatus = {
        msg_code: 'DISPENSER_DELIVERY_IDLE',
        message: 'Aguardando',
        STATUS: 'IDLE'
      };

      vi.mocked(get).mockResolvedValue(mockStatus);

      // Start first polling
      deliveryService.startPolling(callback1, 1000);
      await vi.advanceTimersByTimeAsync(0);
      expect(callback1).toHaveBeenCalledTimes(1);

      // Start second polling (should stop first)
      deliveryService.startPolling(callback2, 1000);
      await vi.advanceTimersByTimeAsync(1000);
      
      // Only callback2 should be called after the interval
      expect(callback1).toHaveBeenCalledTimes(1); // Only initial call
      expect(callback2).toHaveBeenCalledTimes(2); // Initial + interval call
    });

    it('should handle polling errors gracefully', async () => {
      const callback = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(get).mockRejectedValue(new Error('Network error'));

      deliveryService.startPolling(callback, 1000);
      
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Polling error:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should use default interval when not specified', async () => {
      const callback = vi.fn();
      const mockStatus: DeliveryStatus = {
        msg_code: 'DISPENSER_DELIVERY_IDLE',
        message: 'Aguardando',
        STATUS: 'IDLE'
      };

      vi.mocked(get).mockResolvedValue(mockStatus);

      deliveryService.startPolling(callback); // No interval specified
      
      await vi.advanceTimersByTimeAsync(0);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Default should be 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopPolling', () => {
    it('should stop polling interval', async () => {
      const callback = vi.fn();
      const mockStatus: DeliveryStatus = {
        msg_code: 'DISPENSER_DELIVERY_IDLE',
        message: 'Aguardando',
        STATUS: 'IDLE'
      };

      vi.mocked(get).mockResolvedValue(mockStatus);

      deliveryService.startPolling(callback, 1000);
      await vi.advanceTimersByTimeAsync(0);
      expect(callback).toHaveBeenCalledTimes(1);

      deliveryService.stopPolling();
      
      // Advance time, callback should not be called again
      await vi.advanceTimersByTimeAsync(2000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle stopping when no polling is active', () => {
      expect(() => {
        deliveryService.stopPolling();
      }).not.toThrow();
    });
  });

  describe('getDeliverySteps', () => {
    it('should return delivery steps based on status', () => {
      const idleSteps = deliveryService.getDeliverySteps('IDLE');
      expect(idleSteps).toHaveLength(4);
      expect(idleSteps[0].status).toBe('active');
      expect(idleSteps[1].status).toBe('pending');
      expect(idleSteps[2].status).toBe('pending');
      expect(idleSteps[3].status).toBe('pending');
    });

    it('should mark steps as completed for DISPENSING status', () => {
      const dispensingSteps = deliveryService.getDeliverySteps('DISPENSING');
      expect(dispensingSteps[0].status).toBe('completed');
      expect(dispensingSteps[1].status).toBe('completed');
      expect(dispensingSteps[2].status).toBe('active');
      expect(dispensingSteps[3].status).toBe('pending');
    });

    it('should mark all steps as completed for COMPLETED status', () => {
      const completedSteps = deliveryService.getDeliverySteps('COMPLETED');
      expect(completedSteps[0].status).toBe('completed');
      expect(completedSteps[1].status).toBe('completed');
      expect(completedSteps[2].status).toBe('completed');
      expect(completedSteps[3].status).toBe('completed');
    });

    it('should handle unknown status gracefully', () => {
      const unknownSteps = deliveryService.getDeliverySteps('UNKNOWN_STATUS');
      expect(unknownSteps).toHaveLength(4);
      expect(unknownSteps[0].status).toBe('active');
    });
  });

  describe('isDeliveryComplete', () => {
    it('should return true for completed delivery', () => {
      expect(deliveryService.isDeliveryComplete('COMPLETED')).toBe(true);
    });

    it('should return false for non-completed delivery', () => {
      expect(deliveryService.isDeliveryComplete('IDLE')).toBe(false);
      expect(deliveryService.isDeliveryComplete('DISPENSING')).toBe(false);
      expect(deliveryService.isDeliveryComplete('PREPARING')).toBe(false);
    });

    it('should handle undefined status', () => {
      expect(deliveryService.isDeliveryComplete(undefined)).toBe(false);
    });
  });
});