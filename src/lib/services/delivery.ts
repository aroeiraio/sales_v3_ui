import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';

export interface DeliveryStatus {
  msg_code: string;
  message: string;
  STATUS: string;
}

export interface DeliveryStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: string;
}

class DeliveryService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentStatus: DeliveryStatus | null = null;
  
  async getDeliveryStatus(): Promise<DeliveryStatus> {
    try {
      const response = await get<DeliveryStatus>('/delivery');
      this.currentStatus = response;
      return response;
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      // Return mock status for development
      return {
        msg_code: 'DISPENSER_DELIVERY_IDLE',
        message: 'Preparando produtos para entrega',
        STATUS: 'IDLE'
      };
    }
  }

  startPolling(callback: (status: DeliveryStatus) => void, intervalMs: number = 2000): void {
    this.stopPolling();
    
    this.pollingInterval = setInterval(async () => {
      try {
        const status = await this.getDeliveryStatus();
        callback(status);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, intervalMs);

    // Initial call
    this.getDeliveryStatus().then(callback);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getCurrentStatus(): DeliveryStatus | null {
    return this.currentStatus;
  }

  getStepsForStatus(status: DeliveryStatus): DeliveryStep[] {
    const steps: DeliveryStep[] = [
      {
        id: 'payment',
        title: 'Pagamento Confirmado',
        description: 'Transação aprovada com sucesso',
        status: 'completed',
        icon: 'check'
      },
      {
        id: 'processing',
        title: 'Liberando Produtos',
        description: 'Seus produtos estão sendo preparados para entrega',
        status: 'pending',
        icon: 'package'
      },
      {
        id: 'delivered',
        title: 'Entrega Concluída',
        description: 'Retire seus produtos no compartimento de entrega',
        status: 'pending',
        icon: 'check-circle'
      }
    ];

    // Update steps based on current status
    switch (status.msg_code) {
      case 'DISPENSER_DELIVERY_IDLE':
        steps[1].status = 'active';
        break;
      case 'DISPENSER_DELIVERY_PROCESSING':
        steps[1].status = 'completed';
        steps[2].status = 'active';
        break;
      case 'DISPENSER_DELIVERY_DELIVERED':
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        break;
    }

    return steps;
  }

  isDeliveryComplete(status: DeliveryStatus): boolean {
    return status.msg_code === 'DISPENSER_DELIVERY_DELIVERED';
  }
}

export const deliveryService = new DeliveryService();