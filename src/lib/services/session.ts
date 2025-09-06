import { post, del } from '../utils/api';
import { ENDPOINTS, SESSION_TIMEOUT } from '../utils/constants';
import { errorDialogService } from './errorDialog';

export interface Session {
  sessionId: string;
  expiresAt: string;
  isActive: boolean;
}

class SessionService {
  private session: Session | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = SESSION_TIMEOUT;

  async startSession(): Promise<Session> {
    try {
      // Call the session endpoint with empty body as per API specification
      const data = await post<Session>(ENDPOINTS.session, '');
      this.session = data;
      this.startTimeout();
      
      return this.session;
    } catch (error) {
      console.error('Failed to start session:', error);
      
      // Show error dialog for session initialization failure
      errorDialogService.showError({
        title: 'Erro de Sessão',
        message: 'Não foi possível iniciar a sessão. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => this.startSession(),
            variant: 'primary'
          }
        ]
      });
      throw error;
    }
  }

  async endSession(): Promise<void> {
    try {
      if (this.session) {
        // Call the session endpoint to end the session
        await del(ENDPOINTS.session);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      this.session = null;
      this.clearTimeout();
    }
  }

  private startTimeout(): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleTimeout(): void {
    errorDialogService.showWarning({
      title: 'Sessão Expirada',
      message: 'Sua sessão expirou por inatividade. Você será redirecionado para a tela inicial.',
      actions: [
        {
          label: 'OK',
          action: () => {
            this.endSession();
            window.location.href = '/';
          },
          variant: 'primary'
        }
      ]
    });
  }

  getSession(): Session | null {
    return this.session;
  }

  isSessionActive(): boolean {
    return this.session?.isActive ?? false;
  }
}

export const sessionService = new SessionService();