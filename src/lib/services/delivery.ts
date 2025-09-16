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
  private pollingInterval: number | null = null;
  private currentStatus: DeliveryStatus | null = null;
  
  async getDeliveryStatus(): Promise<DeliveryStatus> {
    try {
      console.log('Consulting delivery endpoint: http://localhost:8090/sales/v1/delivery');
      const response = await fetch('http://localhost:8090/sales/v1/delivery');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.currentStatus = data;
      console.log('Delivery status response:', data);
      return data;
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
    console.log('Delivery service: Starting polling with interval:', intervalMs);
    this.stopPolling();
    
    this.pollingInterval = setInterval(async () => {
      try {
        console.log('Delivery service: Polling interval tick');
        const status = await this.getDeliveryStatus();
        callback(status);
      } catch (error) {
        console.error('Delivery service: Polling error:', error);
      }
    }, intervalMs);

    // Initial call
    console.log('Delivery service: Making initial delivery status call');
    this.getDeliveryStatus().then(callback).catch(error => {
      console.error('Delivery service: Initial call error:', error);
    });
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