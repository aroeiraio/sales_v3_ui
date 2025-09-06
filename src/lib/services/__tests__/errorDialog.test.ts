import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorDialogService } from '../errorDialog';

describe('ErrorDialogService', () => {
  beforeEach(() => {
    errorDialogService.closeAllDialogs();
  });

  describe('showError', () => {
    it('should show error dialog with correct configuration', () => {
      const config = {
        title: 'Test Error',
        message: 'This is a test error message',
        actions: [
          {
            label: 'OK',
            action: vi.fn(),
            variant: 'primary' as const
          }
        ]
      };

      errorDialogService.showError(config);
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].type).toBe('error');
      expect(dialogs[0].title).toBe('Test Error');
      expect(dialogs[0].message).toBe('This is a test error message');
      expect(dialogs[0].persistent).toBe(true);
      expect(dialogs[0].autoClose).toBe(false);
    });

    it('should set default values for error dialogs', () => {
      errorDialogService.showError({
        title: 'Test Error',
        message: 'Test message'
      });
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs[0].persistent).toBe(true);
      expect(dialogs[0].autoClose).toBe(false);
    });
  });

  describe('showWarning', () => {
    it('should show warning dialog with correct configuration', () => {
      const config = {
        title: 'Test Warning',
        message: 'This is a test warning message'
      };

      errorDialogService.showWarning(config);
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].type).toBe('warning');
      expect(dialogs[0].title).toBe('Test Warning');
      expect(dialogs[0].persistent).toBe(false);
      expect(dialogs[0].autoClose).toBe(true);
      expect(dialogs[0].autoCloseDelay).toBe(5000);
    });
  });

  describe('showInfo', () => {
    it('should show info dialog with correct configuration', () => {
      const config = {
        title: 'Test Info',
        message: 'This is a test info message'
      };

      errorDialogService.showInfo(config);
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].type).toBe('info');
      expect(dialogs[0].title).toBe('Test Info');
      expect(dialogs[0].persistent).toBe(false);
      expect(dialogs[0].autoClose).toBe(true);
      expect(dialogs[0].autoCloseDelay).toBe(3000);
    });
  });

  describe('showSuccess', () => {
    it('should show success dialog with correct configuration', () => {
      const config = {
        title: 'Test Success',
        message: 'This is a test success message'
      };

      errorDialogService.showSuccess(config);
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].type).toBe('success');
      expect(dialogs[0].title).toBe('Test Success');
      expect(dialogs[0].persistent).toBe(false);
      expect(dialogs[0].autoClose).toBe(true);
      expect(dialogs[0].autoCloseDelay).toBe(3000);
    });
  });

  describe('auto-close functionality', () => {
    it('should auto-close warning dialogs after delay', (done) => {
      errorDialogService.showWarning({
        title: 'Test Warning',
        message: 'This is a test warning',
        autoCloseDelay: 100
      });
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);

      setTimeout(() => {
        const updatedDialogs = errorDialogService.getDialogs();
        expect(updatedDialogs).toHaveLength(0);
        done();
      }, 150);
    });

    it('should not auto-close persistent dialogs', (done) => {
      errorDialogService.showError({
        title: 'Test Error',
        message: 'This is a persistent error',
        persistent: true,
        autoClose: true,
        autoCloseDelay: 100
      });
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);

      setTimeout(() => {
        const updatedDialogs = errorDialogService.getDialogs();
        expect(updatedDialogs).toHaveLength(1);
        done();
      }, 150);
    });
  });

  describe('subscription system', () => {
    it('should notify subscribers when dialogs change', () => {
      const callback = vi.fn();
      const unsubscribe = errorDialogService.subscribe(callback);

      errorDialogService.showError({
        title: 'Test',
        message: 'Test message'
      });

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Test',
            message: 'Test message'
          })
        ])
      );

      unsubscribe();
    });

    it('should allow unsubscribing from notifications', () => {
      const callback = vi.fn();
      const unsubscribe = errorDialogService.subscribe(callback);
      
      unsubscribe();
      
      errorDialogService.showError({
        title: 'Test',
        message: 'Test message'
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    it('should show network error with retry action', () => {
      const retryAction = vi.fn();
      errorDialogService.showNetworkError(retryAction);
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].type).toBe('error');
      expect(dialogs[0].title).toBe('Erro de Conexão');
      expect(dialogs[0].actions).toHaveLength(2);
      expect(dialogs[0].actions?.[0].label).toBe('Tentar Novamente');
      expect(dialogs[0].actions?.[0].action).toBe(retryAction);
    });

    it('should show network error without retry action', () => {
      errorDialogService.showNetworkError();
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].actions).toHaveLength(1);
      expect(dialogs[0].actions?.[0].label).toBe('OK');
    });

    it('should show cart error for stock issues', () => {
      errorDialogService.showCartError('stock');
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].title).toBe('Produto Indisponível');
      expect(dialogs[0].actions?.[0].label).toBe('Ver Outros Produtos');
    });

    it('should show cart error for limit issues', () => {
      errorDialogService.showCartError('limit');
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].title).toBe('Limite Atingido');
      expect(dialogs[0].actions?.[0].label).toBe('Ver Carrinho');
    });

    it('should show payment error for declined payments', () => {
      errorDialogService.showPaymentError('declined');
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].title).toBe('Pagamento Negado');
      expect(dialogs[0].actions).toHaveLength(3);
      expect(dialogs[0].actions?.[0].label).toBe('Tentar Outro Cartão');
      expect(dialogs[0].actions?.[1].label).toBe('Usar PIX');
      expect(dialogs[0].actions?.[2].label).toBe('Cancelar');
    });

    it('should show payment error for network issues', () => {
      errorDialogService.showPaymentError('network');
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].title).toBe('Erro de Conexão');
      expect(dialogs[0].actions).toHaveLength(2);
      expect(dialogs[0].actions?.[0].label).toBe('Tentar Novamente');
      expect(dialogs[0].actions?.[1].label).toBe('Verificar Conexão');
    });
  });

  describe('dialog management', () => {
    it('should close specific dialog', () => {
      errorDialogService.showError({
        title: 'Error 1',
        message: 'Message 1'
      });
      
      errorDialogService.showError({
        title: 'Error 2',
        message: 'Message 2'
      });
      
      let dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(2);
      
      errorDialogService.closeDialog(dialogs[0]);
      
      dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].title).toBe('Error 2');
    });

    it('should close all dialogs', () => {
      errorDialogService.showError({
        title: 'Error 1',
        message: 'Message 1'
      });
      
      errorDialogService.showWarning({
        title: 'Warning 1',
        message: 'Message 1'
      });
      
      let dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(2);
      
      errorDialogService.closeAllDialogs();
      
      dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(0);
    });

    it('should handle multiple dialogs with correct z-index', () => {
      errorDialogService.showError({
        title: 'Error 1',
        message: 'Message 1'
      });
      
      errorDialogService.showWarning({
        title: 'Warning 1',
        message: 'Message 1'
      });
      
      const dialogs = errorDialogService.getDialogs();
      expect(dialogs).toHaveLength(2);
      // First dialog should have lower z-index than second
      expect(dialogs[0]).toBeDefined();
      expect(dialogs[1]).toBeDefined();
    });
  });
});
