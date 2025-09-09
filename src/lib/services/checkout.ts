import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { errorDialogService } from './errorDialog';

export interface PaymentBroker {
  available: boolean;
  broker: string;
  methods: string[];
  qrcode?: string;
}

export interface CheckoutResponse {
  brokers: PaymentBroker[];
  timestamp: string;
}

class CheckoutService {
  private availablePaymentMethods: PaymentBroker[] = [];

  async performCheckout(): Promise<CheckoutResponse> {
    try {
      console.log('Performing checkout - calling GET', ENDPOINTS.checkout);
      
      // Call the checkout endpoint to get available payment methods
      const response = await get<PaymentBroker[]>(ENDPOINTS.checkout);
      console.log('Checkout API response:', response);
      
      // Parse the response structure
      let brokers: PaymentBroker[] = [];
      let timestamp = '';
      
      if (Array.isArray(response)) {
        // Filter out the timestamp object and extract brokers
        brokers = response.filter(item => 
          typeof item === 'object' && 
          item !== null && 
          'broker' in item
        ) as PaymentBroker[];
        
        // Find timestamp
        const timestampObj = response.find(item => 
          typeof item === 'object' && 
          item !== null && 
          'timestamp' in item
        ) as any;
        
        if (timestampObj) {
          timestamp = timestampObj.timestamp;
        }
      }
      
      // Store available payment methods
      this.availablePaymentMethods = brokers;
      
      console.log('Parsed checkout response:', {
        brokers,
        timestamp,
        availableCount: brokers.length
      });
      
      return {
        brokers,
        timestamp
      };
    } catch (error) {
      console.error('Checkout failed:', error);
      
      // Show error dialog for checkout failure
      errorDialogService.showError({
        title: 'Erro no Checkout',
        message: 'Não foi possível processar o checkout. Verifique sua conexão e tente novamente.',
        actions: [
          {
            label: 'Voltar ao Carrinho',
            action: () => {
              window.location.href = '/cart';
            },
            variant: 'primary'
          },
          {
            label: 'Tentar Novamente',
            action: () => {
              window.location.reload();
            },
            variant: 'secondary'
          }
        ]
      });
      
      throw error;
    }
  }

  getAvailablePaymentMethods(): PaymentBroker[] {
    return [...this.availablePaymentMethods];
  }

  isPaymentMethodAvailable(broker: string, method: string): boolean {
    return this.availablePaymentMethods.some(b => 
      b.broker === broker && 
      b.available && 
      b.methods.includes(method)
    );
  }

  getQRCodePath(broker: string): string | null {
    const brokerData = this.availablePaymentMethods.find(b => 
      b.broker === broker && b.available
    );
    return brokerData?.qrcode || null;
  }
}

export const checkoutService = new CheckoutService();

// Debug: Log checkout service initialization
console.log('CheckoutService initialized:', checkoutService);