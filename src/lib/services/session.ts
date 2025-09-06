import { get, del } from '../utils/api';
import { ENDPOINTS, SESSION_TIMEOUT, API_BASE_URL } from '../utils/constants';
import { errorDialogService } from './errorDialog';

export interface Session {
  sessionId: string;
  expiresAt: string;
  isActive: boolean;
}

class SessionService {
  private session: Session | null = null;
  private timeoutId: number | null = null;
  private readonly TIMEOUT_DURATION = SESSION_TIMEOUT;

  async startSession(): Promise<Session> {
    try {
      console.log('Starting session - calling GET', `${API_BASE_URL}${ENDPOINTS.session}`);
      // Call the session endpoint with GET method as per API specification
      const apiResponse = await get<any>(ENDPOINTS.session);
      console.log('API response:', apiResponse);
      
      // Map API response to Session interface
      const session: Session = {
        sessionId: apiResponse.id || `session-${Date.now()}`,
        expiresAt: new Date(Date.now() + this.TIMEOUT_DURATION).toISOString(),
        isActive: true
      };
      
      console.log('Session created successfully:', session);
      this.session = session;
      this.startTimeout();
      
      return this.session;
    } catch (error) {
      console.error('Failed to start session:', error);
      
      // Show error dialog for session initialization failure
      errorDialogService.showError({
        title: 'Erro de Sessão',
        message: 'Não foi possível iniciar a sessão. Verifique sua conexão e tente novamente.',
        actions: [
          {
            label: 'Fechar',
            action: () => {},
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
        console.log('Ending session - calling DELETE', `${API_BASE_URL}${ENDPOINTS.session}`);
        // Call the session endpoint to end the session as per API specification
        await del(ENDPOINTS.session);
        console.log('Session ended successfully');
      } else {
        console.log('No active session to end');
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

// Debug: Log session service initialization
console.log('SessionService initialized:', sessionService);