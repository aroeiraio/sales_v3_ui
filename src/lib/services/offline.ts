import { errorDialogService } from './errorDialog';

class OfflineService {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private offlineQueue: Array<() => Promise<void>> = [];

  constructor() {
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.processOfflineQueue();
    
    errorDialogService.showSuccess({
      title: 'Conexão Restaurada',
      message: 'Sua conexão com a internet foi restaurada.',
      autoClose: true,
      autoCloseDelay: 3000
    });
  }

  private handleOffline(): void {
    this.isOnline = false;
    
    errorDialogService.showWarning({
      title: 'Modo Offline',
      message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
      persistent: true
    });
  }

  async queueAction(action: () => Promise<void>): Promise<void> {
    if (this.isOnline) {
      try {
        await action();
      } catch (error) {
        console.error('Action failed:', error);
        throw error;
      }
    } else {
      this.offlineQueue.push(action);
      
      errorDialogService.showInfo({
        title: 'Ação Enfileirada',
        message: 'Esta ação será executada quando a conexão for restaurada.',
        autoClose: true,
        autoCloseDelay: 2000
      });
    }
  }

  private async processOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0 && this.isOnline) {
      const action = this.offlineQueue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error('Failed to process queued action:', error);
        }
      }
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  getQueueLength(): number {
    return this.offlineQueue.length;
  }
}

let _offlineService: OfflineService | null = null;

export const offlineService = {
  get instance(): OfflineService {
    if (!_offlineService) {
      _offlineService = new OfflineService();
    }
    return _offlineService;
  },
  
  // Delegate methods for easier usage
  isOnline(): boolean {
    return this.instance.getOnlineStatus();
  },
  
  isOffline(): boolean {
    return this.instance.isOffline();
  },
  
  queueAction(operation: () => Promise<void>): Promise<void> {
    return this.instance.queueAction(operation);
  },
  
  getQueueLength(): number {
    return this.instance.getQueueLength();
  }
};