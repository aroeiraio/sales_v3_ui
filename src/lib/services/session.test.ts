import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sessionService } from './session';
import { errorDialogService } from './errorDialog';

// Mock the error dialog service
vi.mock('./errorDialog', () => ({
  errorDialogService: {
    showError: vi.fn(),
    showWarning: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Reset location hostname to localhost for development mode
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', href: '/' },
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionService.endSession();
  });

  describe('startSession', () => {
    it('should create mock session in development mode', async () => {
      const session = await sessionService.startSession();
      
      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^dev-session-\d+$/);
      expect(session.isActive).toBe(true);
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should create fallback session on API error in development', async () => {
      // Change hostname to trigger API call, then mock fetch to fail
      Object.defineProperty(window, 'location', {
        value: { hostname: 'production.com', href: '/' },
        writable: true
      });
      
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      // Change back to localhost to trigger fallback
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost', href: '/' },
        writable: true
      });
      
      const session = await sessionService.startSession();
      
      expect(session.sessionId).toMatch(/^dev-session-\d+$/);
      expect(session.isActive).toBe(true);
    });

    it('should show error dialog in production mode on failure', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'production.com', href: '/' },
        writable: true
      });
      
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(sessionService.startSession()).rejects.toThrow();
      expect(errorDialogService.showError).toHaveBeenCalled();
    });
  });

  describe('endSession', () => {
    it('should end session in development mode', async () => {
      await sessionService.startSession();
      expect(sessionService.getSession()).not.toBeNull();
      
      await sessionService.endSession();
      expect(sessionService.getSession()).toBeNull();
    });

    it('should call API in production mode', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'production.com', href: '/' },
        writable: true
      });
      
      // Mock successful session start
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'prod-session-123',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          isActive: true
        })
      } as Response);
      
      await sessionService.startSession();
      expect(sessionService.getSession()).not.toBeNull();
      
      // Mock successful session end
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response);
      
      await sessionService.endSession();
      
      expect(sessionService.getSession()).toBeNull();
    });
  });

  describe('session timeout', () => {
    it('should handle session timeout', async () => {
      await sessionService.startSession();
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(61000); // 61 seconds (timeout is 60s)
      
      expect(errorDialogService.showWarning).toHaveBeenCalledWith({
        title: 'Sessão Expirada',
        message: 'Sua sessão expirou por inatividade. Você será redirecionado para a tela inicial.',
        actions: expect.any(Array)
      });
    });
  });

  describe('isSessionActive', () => {
    it('should return true for active session', async () => {
      await sessionService.startSession();
      expect(sessionService.isSessionActive()).toBe(true);
    });

    it('should return false for no session', () => {
      expect(sessionService.isSessionActive()).toBe(false);
    });

    it('should return false for inactive session', async () => {
      await sessionService.startSession();
      const session = sessionService.getSession();
      
      if (session) {
        session.isActive = false;
      }
      
      expect(sessionService.isSessionActive()).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      const session = await sessionService.startSession();
      const retrieved = sessionService.getSession();
      
      expect(retrieved).toEqual(session);
    });

    it('should return null when no session', () => {
      expect(sessionService.getSession()).toBeNull();
    });
  });
});