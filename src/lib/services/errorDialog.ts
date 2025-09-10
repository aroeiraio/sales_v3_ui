export interface ErrorDialogConfig {
  id?: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  icon?: string;
  actions?: ErrorDialogAction[];
  autoClose?: boolean;
  autoCloseDelay?: number;
  persistent?: boolean;
}

export interface ErrorDialogAction {
  label: string;
  action: () => void;
  variant: 'primary' | 'secondary' | 'destructive';
  autoClose?: boolean;
}

class ErrorDialogService {
  private dialogs: ErrorDialogConfig[] = [];
  private subscribers: ((dialogs: ErrorDialogConfig[]) => void)[] = [];
  private nextId = 0;

  showError(config: Omit<ErrorDialogConfig, 'type'>): void {
    console.log('🚨 ErrorDialogService.showError called:', config);
    console.trace('Error dialog creation stack trace:');
    
    const dialog: ErrorDialogConfig = {
      type: 'error',
      autoClose: false,
      persistent: true,
      ...config
    };
    
    console.log('🚨 Final dialog config:', dialog);
    this.addDialog(dialog);
  }

  showWarning(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'warning',
      autoClose: true,
      autoCloseDelay: 5000,
      persistent: false,
      ...config
    };
    
    this.addDialog(dialog);
  }

  showInfo(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'info',
      autoClose: true,
      autoCloseDelay: 3000,
      persistent: false,
      ...config
    };
    
    this.addDialog(dialog);
  }

  showSuccess(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'success',
      autoClose: true,
      autoCloseDelay: 3000,
      persistent: false,
      ...config
    };
    
    this.addDialog(dialog);
  }

  private addDialog(dialog: ErrorDialogConfig): void {
    // Generate unique ID for dialog
    dialog.id = `dialog-${this.nextId++}`;
    console.log('Adding dialog:', dialog);
    this.dialogs.push(dialog);
    this.notifySubscribers();

    // Auto-close if configured
    if (dialog.autoClose && dialog.autoCloseDelay) {
      setTimeout(() => {
        this.closeDialog(dialog);
      }, dialog.autoCloseDelay);
    }
  }

  closeDialog(dialog: ErrorDialogConfig): void {
    console.log('closeDialog called:', dialog);
    console.log('Current dialogs before:', this.dialogs.length);
    
    // Find dialog by ID instead of object reference
    const index = this.dialogs.findIndex(d => d.id === dialog.id);
    console.log('Dialog index by ID:', index);
    
    if (index > -1) {
      this.dialogs.splice(index, 1);
      console.log('Dialog removed, remaining:', this.dialogs.length);
      this.notifySubscribers();
    } else {
      console.log('Dialog not found in array by ID:', dialog.id);
    }
  }

  closeAllDialogs(): void {
    this.dialogs = [];
    this.notifySubscribers();
  }

  subscribe(callback: (dialogs: ErrorDialogConfig[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.dialogs]));
  }

  getDialogs(): ErrorDialogConfig[] {
    return [...this.dialogs];
  }

  // Convenience methods for common error scenarios
  showNetworkError(retryAction?: () => void): void {
    this.showError({
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      actions: retryAction ? [
        {
          label: 'Tentar Novamente',
          action: retryAction,
          variant: 'primary'
        },
        {
          label: 'Cancelar',
          action: () => {},
          variant: 'secondary'
        }
      ] : [
        {
          label: 'OK',
          action: () => {},
          variant: 'primary'
        }
      ]
    });
  }

  showValidationError(field: string, message: string): void {
    this.showError({
      title: 'Dados Inválidos',
      message: `${field}: ${message}`,
      actions: [
        {
          label: 'Corrigir',
          action: () => {},
          variant: 'primary'
        }
      ]
    });
  }

  showCartError(errorType: 'stock' | 'limit' | 'general'): void {
    switch (errorType) {
      case 'stock':
        this.showError({
          title: 'Produto Indisponível',
          message: 'Este produto está temporariamente fora de estoque.',
          actions: [
            {
              label: 'Ver Outros Produtos',
              action: () => window.location.href = '/products',
              variant: 'primary'
            }
          ]
        });
        break;
      case 'limit':
        this.showError({
          title: 'Limite Atingido',
          message: 'Você atingiu o número máximo de itens permitidos no carrinho.',
          actions: [
            {
              label: 'Ver Carrinho',
              action: () => window.location.href = '/cart',
              variant: 'primary'
            }
          ]
        });
        break;
      default:
        this.showError({
          title: 'Erro no Carrinho',
          message: 'Não foi possível processar sua solicitação. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => window.location.reload(),
              variant: 'primary'
            }
          ]
        });
    }
  }

  showPaymentError(errorType: 'declined' | 'network' | 'timeout' | 'general'): void {
    switch (errorType) {
      case 'declined':
        this.showError({
          title: 'Pagamento Negado',
          message: 'Seu pagamento foi negado. Verifique os dados do cartão ou tente outro método de pagamento.',
          actions: [
            {
              label: 'Tentar Outro Cartão',
              action: () => window.location.href = '/checkout',
              variant: 'primary'
            },
            {
              label: 'Usar PIX',
              action: () => window.location.href = '/payment/pix',
              variant: 'secondary'
            },
            {
              label: 'Cancelar',
              action: () => window.location.href = '/cart',
              variant: 'secondary'
            }
          ]
        });
        break;
      case 'network':
        this.showError({
          title: 'Erro de Conexão',
          message: 'Não foi possível processar o pagamento devido a problemas de conexão.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => window.location.reload(),
              variant: 'primary'
            },
            {
              label: 'Verificar Conexão',
              action: () => {},
              variant: 'secondary'
            }
          ]
        });
        break;
      case 'timeout':
        this.showError({
          title: 'Tempo Esgotado',
          message: 'O tempo para processar o pagamento expirou. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => window.location.href = '/checkout',
              variant: 'primary'
            }
          ]
        });
        break;
      default:
        this.showError({
          title: 'Erro no Pagamento',
          message: 'Ocorreu um erro inesperado durante o processamento do pagamento.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => window.location.href = '/checkout',
              variant: 'primary'
            },
            {
              label: 'Voltar ao Carrinho',
              action: () => window.location.href = '/cart',
              variant: 'secondary'
            }
          ]
        });
    }
  }
}

export const errorDialogService = new ErrorDialogService();
