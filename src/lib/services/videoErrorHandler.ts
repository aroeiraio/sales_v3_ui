import { errorDialogService } from './errorDialog';

export interface VideoError {
  type: 'network' | 'format' | 'permission' | 'notfound' | 'unknown';
  message: string;
  url?: string;
  retryable: boolean;
}

export class VideoErrorHandler {
  private static instance: VideoErrorHandler;
  private errorCount = 0;
  private maxErrors = 5;
  private errorHistory: VideoError[] = [];

  static getInstance(): VideoErrorHandler {
    if (!VideoErrorHandler.instance) {
      VideoErrorHandler.instance = new VideoErrorHandler();
    }
    return VideoErrorHandler.instance;
  }

  analyzeError(error: any, url?: string): VideoError {
    const errorMessage = error.message || error.toString();
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network',
        message: 'Erro de conexão. Verifique sua internet.',
        url,
        retryable: true
      };
    }

    // Format errors
    if (errorMessage.includes('format') || errorMessage.includes('codec')) {
      return {
        type: 'format',
        message: 'Formato de vídeo não suportado.',
        url,
        retryable: false
      };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('403')) {
      return {
        type: 'permission',
        message: 'Sem permissão para acessar este vídeo.',
        url,
        retryable: false
      };
    }

    // Not found errors
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        type: 'notfound',
        message: 'Vídeo não encontrado.',
        url,
        retryable: false
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: 'Erro desconhecido ao carregar vídeo.',
      url,
      retryable: true
    };
  }

  handleVideoError(error: any, url?: string, onRetry?: () => void): void {
    const videoError = this.analyzeError(error, url);
    this.errorHistory.push(videoError);
    this.errorCount++;

    console.error('Video error:', videoError);

    // If too many errors, show a different message
    if (this.errorCount >= this.maxErrors) {
      this.showTooManyErrorsDialog();
      return;
    }

    // Show appropriate error dialog based on error type
    switch (videoError.type) {
      case 'network':
        this.showNetworkErrorDialog(videoError, onRetry);
        break;
      case 'format':
        this.showFormatErrorDialog(videoError);
        break;
      case 'permission':
        this.showPermissionErrorDialog(videoError);
        break;
      case 'notfound':
        this.showNotFoundErrorDialog(videoError);
        break;
      default:
        this.showGenericErrorDialog(videoError, onRetry);
    }
  }

  private showNetworkErrorDialog(error: VideoError, onRetry?: () => void): void {
    errorDialogService.showError({
      title: 'Erro de Conexão',
      message: error.message,
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => {
            if (onRetry) onRetry();
            this.resetErrorCount();
          },
          variant: 'primary'
        },
        {
          label: 'Pular Vídeo',
          action: () => {
            // Skip to next video
            this.resetErrorCount();
          },
          variant: 'secondary'
        }
      ]
    });
  }

  private showFormatErrorDialog(error: VideoError): void {
    errorDialogService.showError({
      title: 'Formato Não Suportado',
      message: error.message,
      actions: [
        {
          label: 'OK',
          action: () => {
            // Skip to next video
            this.resetErrorCount();
          },
          variant: 'primary'
        }
      ]
    });
  }

  private showPermissionErrorDialog(error: VideoError): void {
    errorDialogService.showError({
      title: 'Sem Permissão',
      message: error.message,
      actions: [
        {
          label: 'OK',
          action: () => {
            // Skip to next video
            this.resetErrorCount();
          },
          variant: 'primary'
        }
      ]
    });
  }

  private showNotFoundErrorDialog(error: VideoError): void {
    errorDialogService.showError({
      title: 'Vídeo Não Encontrado',
      message: error.message,
      actions: [
        {
          label: 'OK',
          action: () => {
            // Skip to next video
            this.resetErrorCount();
          },
          variant: 'primary'
        }
      ]
    });
  }

  private showGenericErrorDialog(error: VideoError, onRetry?: () => void): void {
    errorDialogService.showError({
      title: 'Erro de Vídeo',
      message: error.message,
      actions: [
        {
          label: 'Tentar Novamente',
          action: () => {
            if (onRetry) onRetry();
            this.resetErrorCount();
          },
          variant: 'primary'
        },
        {
          label: 'Pular Vídeo',
          action: () => {
            // Skip to next video
            this.resetErrorCount();
          },
          variant: 'secondary'
        }
      ]
    });
  }

  private showTooManyErrorsDialog(): void {
    errorDialogService.showError({
      title: 'Muitos Erros de Vídeo',
      message: 'Muitos vídeos falharam ao carregar. Verificando conexão...',
      actions: [
        {
          label: 'Recarregar Página',
          action: () => {
            window.location.reload();
          },
          variant: 'primary'
        },
        {
          label: 'Continuar',
          action: () => {
            this.resetErrorCount();
          },
          variant: 'secondary'
        }
      ]
    });
  }

  resetErrorCount(): void {
    this.errorCount = 0;
    this.errorHistory = [];
  }

  getErrorHistory(): VideoError[] {
    return [...this.errorHistory];
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  isErrorThresholdReached(): boolean {
    return this.errorCount >= this.maxErrors;
  }
}

export const videoErrorHandler = VideoErrorHandler.getInstance();
