import { describe, it, expect, vi, beforeEach } from 'vitest';
import { videoErrorHandler } from '../videoErrorHandler';
import { errorDialogService } from '../errorDialog';

// Mock error dialog service
vi.mock('../errorDialog');

describe('VideoErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    videoErrorHandler.resetErrorCount();
  });

  describe('analyzeError', () => {
    it('should identify network errors', () => {
      const error = new Error('Network error');
      const result = videoErrorHandler.analyzeError(error, 'http://example.com/video.mp4');

      expect(result.type).toBe('network');
      expect(result.message).toBe('Erro de conexão. Verifique sua internet.');
      expect(result.retryable).toBe(true);
      expect(result.url).toBe('http://example.com/video.mp4');
    });

    it('should identify format errors', () => {
      const error = new Error('Unsupported format');
      const result = videoErrorHandler.analyzeError(error);

      expect(result.type).toBe('format');
      expect(result.message).toBe('Formato de vídeo não suportado.');
      expect(result.retryable).toBe(false);
    });

    it('should identify permission errors', () => {
      const error = new Error('403 Forbidden');
      const result = videoErrorHandler.analyzeError(error);

      expect(result.type).toBe('permission');
      expect(result.message).toBe('Sem permissão para acessar este vídeo.');
      expect(result.retryable).toBe(false);
    });

    it('should identify not found errors', () => {
      const error = new Error('404 Not Found');
      const result = videoErrorHandler.analyzeError(error);

      expect(result.type).toBe('notfound');
      expect(result.message).toBe('Vídeo não encontrado.');
      expect(result.retryable).toBe(false);
    });

    it('should identify unknown errors', () => {
      const error = new Error('Some random error');
      const result = videoErrorHandler.analyzeError(error);

      expect(result.type).toBe('unknown');
      expect(result.message).toBe('Erro desconhecido ao carregar vídeo.');
      expect(result.retryable).toBe(true);
    });
  });

  describe('handleVideoError', () => {
    it('should handle network errors with retry option', () => {
      const error = new Error('Network error');
      const onRetry = vi.fn();

      videoErrorHandler.handleVideoError(error, 'http://example.com/video.mp4', onRetry);

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Erro de Conexão',
        message: 'Erro de conexão. Verifique sua internet.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: expect.any(Function),
            variant: 'primary'
          },
          {
            label: 'Pular Vídeo',
            action: expect.any(Function),
            variant: 'secondary'
          }
        ]
      });
    });

    it('should handle format errors without retry', () => {
      const error = new Error('Unsupported format');

      videoErrorHandler.handleVideoError(error);

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Formato Não Suportado',
        message: 'Formato de vídeo não suportado.',
        actions: [
          {
            label: 'OK',
            action: expect.any(Function),
            variant: 'primary'
          }
        ]
      });
    });

    it('should handle permission errors', () => {
      const error = new Error('403 Forbidden');

      videoErrorHandler.handleVideoError(error);

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Sem Permissão',
        message: 'Sem permissão para acessar este vídeo.',
        actions: [
          {
            label: 'OK',
            action: expect.any(Function),
            variant: 'primary'
          }
        ]
      });
    });

    it('should handle not found errors', () => {
      const error = new Error('404 Not Found');

      videoErrorHandler.handleVideoError(error);

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Vídeo Não Encontrado',
        message: 'Vídeo não encontrado.',
        actions: [
          {
            label: 'OK',
            action: expect.any(Function),
            variant: 'primary'
          }
        ]
      });
    });

    it('should handle generic errors with retry option', () => {
      const error = new Error('Some random error');
      const onRetry = vi.fn();

      videoErrorHandler.handleVideoError(error, 'http://example.com/video.mp4', onRetry);

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Erro de Vídeo',
        message: 'Erro desconhecido ao carregar vídeo.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: expect.any(Function),
            variant: 'primary'
          },
          {
            label: 'Pular Vídeo',
            action: expect.any(Function),
            variant: 'secondary'
          }
        ]
      });
    });

    it('should show too many errors dialog when threshold is reached', () => {
      // Simulate multiple errors
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Error ${i}`);
        videoErrorHandler.handleVideoError(error);
      }

      expect(errorDialogService.showError).toHaveBeenCalledWith({
        title: 'Muitos Erros de Vídeo',
        message: 'Muitos vídeos falharam ao carregar. Verificando conexão...',
        actions: [
          {
            label: 'Recarregar Página',
            action: expect.any(Function),
            variant: 'primary'
          },
          {
            label: 'Continuar',
            action: expect.any(Function),
            variant: 'secondary'
          }
        ]
      });
    });
  });

  describe('error tracking', () => {
    it('should track error history', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Format error');

      videoErrorHandler.handleVideoError(error1, 'http://example.com/video1.mp4');
      videoErrorHandler.handleVideoError(error2, 'http://example.com/video2.mp4');

      const history = videoErrorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('network');
      expect(history[1].type).toBe('format');
    });

    it('should track error count', () => {
      const error = new Error('Network error');

      videoErrorHandler.handleVideoError(error);
      videoErrorHandler.handleVideoError(error);

      expect(videoErrorHandler.getErrorCount()).toBe(2);
    });

    it('should reset error count', () => {
      const error = new Error('Network error');

      videoErrorHandler.handleVideoError(error);
      videoErrorHandler.handleVideoError(error);
      expect(videoErrorHandler.getErrorCount()).toBe(2);

      videoErrorHandler.resetErrorCount();
      expect(videoErrorHandler.getErrorCount()).toBe(0);
      expect(videoErrorHandler.getErrorHistory()).toHaveLength(0);
    });

    it('should check error threshold', () => {
      const error = new Error('Network error');

      // Add 4 errors (below threshold)
      for (let i = 0; i < 4; i++) {
        videoErrorHandler.handleVideoError(error);
      }
      expect(videoErrorHandler.isErrorThresholdReached()).toBe(false);

      // Add 1 more error (at threshold)
      videoErrorHandler.handleVideoError(error);
      expect(videoErrorHandler.isErrorThresholdReached()).toBe(true);
    });
  });

  describe('retry functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      const error = new Error('Network error');
      const onRetry = vi.fn();

      videoErrorHandler.handleVideoError(error, 'http://example.com/video.mp4', onRetry);

      // Get the retry action from the last call
      const lastCall = (errorDialogService.showError as any).mock.calls[
        (errorDialogService.showError as any).mock.calls.length - 1
      ];
      const retryAction = lastCall[0].actions[0].action;

      // Execute the retry action
      retryAction();

      expect(onRetry).toHaveBeenCalled();
    });

    it('should reset error count when retry is successful', () => {
      const error = new Error('Network error');
      const onRetry = vi.fn();

      videoErrorHandler.handleVideoError(error, 'http://example.com/video.mp4', onRetry);

      // Get the retry action from the last call
      const lastCall = (errorDialogService.showError as any).mock.calls[
        (errorDialogService.showError as any).mock.calls.length - 1
      ];
      const retryAction = lastCall[0].actions[0].action;

      // Execute the retry action
      retryAction();

      expect(videoErrorHandler.getErrorCount()).toBe(0);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = videoErrorHandler;
      const instance2 = videoErrorHandler;

      expect(instance1).toBe(instance2);
    });
  });
});
