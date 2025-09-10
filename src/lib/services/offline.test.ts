import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineService } from './offline';

// Mock errorDialogService
vi.mock('./errorDialog', () => ({
  errorDialogService: {
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn()
  }
}));

import { errorDialogService } from './errorDialog';

// Mock navigator and window
const mockNavigator = {
  onLine: true
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('OfflineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.onLine = true;
    
    // Reset service instance
    (offlineService as any)._offlineService = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with online status', () => {
      mockNavigator.onLine = true;
      expect(offlineService.isOnline()).toBe(true);
      expect(offlineService.isOffline()).toBe(false);
    });

    it('should initialize with offline status', () => {
      mockNavigator.onLine = false;
      // Reset service to pick up new navigator state
      (offlineService as any)._offlineService = null;
      
      expect(offlineService.isOnline()).toBe(false);
      expect(offlineService.isOffline()).toBe(true);
    });

    it('should add event listeners for online/offline events', () => {
      // Initialize service
      offlineService.isOnline();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('online/offline event handling', () => {
    it('should handle online event', async () => {
      const service = offlineService.instance;
      const handleOnline = service['handleOnline'].bind(service);
      
      // Simulate going offline first
      mockNavigator.onLine = false;
      service['isOnline'] = false;
      
      // Then going online
      handleOnline();
      
      expect(offlineService.isOnline()).toBe(true);
      expect(errorDialogService.showSuccess).toHaveBeenCalledWith({
        title: 'Conexão Restaurada',
        message: 'Sua conexão com a internet foi restaurada.',
        autoClose: true,
        autoCloseDelay: 3000
      });
    });

    it('should handle offline event', () => {
      const service = offlineService.instance;
      const handleOffline = service['handleOffline'].bind(service);
      
      handleOffline();
      
      expect(offlineService.isOffline()).toBe(true);
      expect(errorDialogService.showWarning).toHaveBeenCalledWith({
        title: 'Modo Offline',
        message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
        persistent: true
      });
    });
  });

  describe('queueAction', () => {
    it('should execute action immediately when online', async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      
      await offlineService.instance.queueAction(mockAction);
      
      expect(mockAction).toHaveBeenCalled();
      expect(offlineService.getQueueLength()).toBe(0);
    });

    it('should queue action when offline', async () => {
      const service = offlineService.instance;
      service['isOnline'] = false;
      
      const mockAction = vi.fn().mockResolvedValue(undefined);
      
      await service.queueAction(mockAction);
      
      expect(mockAction).not.toHaveBeenCalled();
      expect(offlineService.getQueueLength()).toBe(1);
      expect(errorDialogService.showInfo).toHaveBeenCalledWith({
        title: 'Ação Enfileirada',
        message: 'Esta ação será executada quando a conexão for restaurada.',
        autoClose: true,
        autoCloseDelay: 2000
      });
    });

    it('should throw error when online action fails', async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      
      await expect(offlineService.instance.queueAction(mockAction))
        .rejects.toThrow('Action failed');
    });
  });

  describe('processOfflineQueue', () => {
    it('should process all queued actions when going online', async () => {
      const service = offlineService.instance;
      const mockAction1 = vi.fn().mockResolvedValue(undefined);
      const mockAction2 = vi.fn().mockResolvedValue(undefined);
      
      // Go offline and queue actions
      service['isOnline'] = false;
      await service.queueAction(mockAction1);
      await service.queueAction(mockAction2);
      
      expect(offlineService.getQueueLength()).toBe(2);
      
      // Go online and process queue
      service['isOnline'] = true;
      await service['processOfflineQueue']();
      
      expect(mockAction1).toHaveBeenCalled();
      expect(mockAction2).toHaveBeenCalled();
      expect(offlineService.getQueueLength()).toBe(0);
    });

    it('should handle errors in queued actions gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const service = offlineService.instance;
      
      const mockAction1 = vi.fn().mockRejectedValue(new Error('Action 1 failed'));
      const mockAction2 = vi.fn().mockResolvedValue(undefined);
      
      // Queue actions while offline
      service['isOnline'] = false;
      await service.queueAction(mockAction1);
      await service.queueAction(mockAction2);
      
      // Process queue when online
      service['isOnline'] = true;
      await service['processOfflineQueue']();
      
      expect(mockAction1).toHaveBeenCalled();
      expect(mockAction2).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to process queued action:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should stop processing if goes offline during queue processing', async () => {
      const service = offlineService.instance;
      
      const mockAction1 = vi.fn().mockResolvedValue(undefined);
      const mockAction2 = vi.fn().mockImplementation(async () => {
        // Simulate going offline during processing
        service['isOnline'] = false;
        return Promise.resolve();
      });
      const mockAction3 = vi.fn().mockResolvedValue(undefined);
      
      // Queue actions while offline
      service['isOnline'] = false;
      await service.queueAction(mockAction1);
      await service.queueAction(mockAction2);
      await service.queueAction(mockAction3);
      
      // Start processing
      service['isOnline'] = true;
      await service['processOfflineQueue']();
      
      expect(mockAction1).toHaveBeenCalled();
      expect(mockAction2).toHaveBeenCalled();
      expect(mockAction3).not.toHaveBeenCalled(); // Should not be called as we went offline
      expect(offlineService.getQueueLength()).toBe(1); // Action 3 remains in queue
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = offlineService.instance;
      const instance2 = offlineService.instance;
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('delegate methods', () => {
    it('should delegate isOnline method', () => {
      const service = offlineService.instance;
      vi.spyOn(service, 'getOnlineStatus').mockReturnValue(true);
      
      expect(offlineService.isOnline()).toBe(true);
      expect(service.getOnlineStatus).toHaveBeenCalled();
    });

    it('should delegate isOffline method', () => {
      const service = offlineService.instance;
      vi.spyOn(service, 'isOffline').mockReturnValue(false);
      
      expect(offlineService.isOffline()).toBe(false);
      expect(service.isOffline).toHaveBeenCalled();
    });

    it('should delegate getQueueLength method', () => {
      const service = offlineService.instance;
      vi.spyOn(service, 'getQueueLength').mockReturnValue(5);
      
      expect(offlineService.getQueueLength()).toBe(5);
      expect(service.getQueueLength).toHaveBeenCalled();
    });
  });

  describe('SSR compatibility', () => {
    it('should handle undefined navigator gracefully', () => {
      // Simulate SSR environment
      const originalNavigator = global.navigator;
      const originalWindow = global.window;
      
      // @ts-ignore
      delete global.navigator;
      // @ts-ignore  
      delete global.window;
      
      // Reset service to test SSR initialization
      (offlineService as any)._offlineService = null;
      
      expect(() => {
        offlineService.isOnline();
      }).not.toThrow();
      
      // Should default to online in SSR
      expect(offlineService.isOnline()).toBe(true);
      
      // Restore globals
      global.navigator = originalNavigator;
      global.window = originalWindow;
    });
  });
});