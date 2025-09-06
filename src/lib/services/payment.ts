import { post } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { errorDialogService } from './errorDialog';
import { cartService } from './cart';
import { sessionService } from './session';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'credit_card' | 'debit_card' | 'pix' | 'cash';
}

export interface PaymentRequest {
  sessionId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  total: number;
  subtotal: number;
  fees: number;
  discount: number;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'processing' | 'success' | 'failed' | 'cancelled';
  message: string;
  receipt?: {
    transactionId: string;
    timestamp: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    paymentMethod: string;
  };
}

class PaymentService {
  private readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      description: 'Pagamento em até 12x',
      icon: 'credit-card',
      type: 'credit_card'
    },
    {
      id: 'debit_card',
      name: 'Cartão de Débito',
      description: 'Débito direto em conta',
      icon: 'landmark',
      type: 'debit_card'
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: 'qr-code',
      type: 'pix'
    }
  ];

  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods;
  }

  async processPayment(paymentMethod: string): Promise<PaymentResponse> {
    try {
      const session = sessionService.getSession();
      if (!session || !session.isActive) {
        throw new Error('Sessão inválida ou expirada');
      }

      const cart = cartService.getCart();
      if (!cart.items || cart.items.length === 0) {
        throw new Error('Carrinho vazio');
      }

      const paymentRequest: PaymentRequest = {
        sessionId: session.sessionId,
        items: cart.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod,
        total: cart.total,
        subtotal: cart.subtotal,
        fees: cart.fees || 0,
        discount: cart.discount || 0
      };

      // For development mode, simulate payment processing
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return this.simulatePayment(paymentRequest);
      }

      // Production mode: call actual payment API
      const response = await post<PaymentResponse>(ENDPOINTS.payment, paymentRequest);
      
      // Clear cart on successful payment
      if (response.status === 'success') {
        cartService.clearCart();
      }
      
      return response;

    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // In development, simulate payment failure
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return {
          transactionId: `failed-${Date.now()}`,
          status: 'failed',
          message: 'Pagamento simulado falhou para demonstração'
        };
      }

      errorDialogService.showError({
        title: 'Erro no Pagamento',
        message: 'Não foi possível processar o pagamento. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => this.processPayment(paymentMethod),
            variant: 'primary'
          },
          {
            label: 'Cancelar',
            action: () => window.location.href = '/cart',
            variant: 'secondary'
          }
        ]
      });

      throw error;
    }
  }

  private async simulatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate random success/failure for demo
    const isSuccess = Math.random() > 0.2; // 80% success rate

    if (isSuccess) {
      cartService.clearCart();
      
      return {
        transactionId: `mock-${Date.now()}`,
        status: 'success',
        message: 'Pagamento processado com sucesso',
        receipt: {
          transactionId: `mock-${Date.now()}`,
          timestamp: new Date().toISOString(),
          items: request.items.map(item => {
            const product = cartService.getCart().items.find(p => p.id === item.productId);
            return {
              name: product?.name || 'Produto',
              quantity: item.quantity,
              price: item.price
            };
          }),
          total: request.total,
          paymentMethod: this.paymentMethods.find(pm => pm.id === request.paymentMethod)?.name || request.paymentMethod
        }
      };
    } else {
      return {
        transactionId: `failed-${Date.now()}`,
        status: 'failed',
        message: 'Falha na simulação do pagamento'
      };
    }
  }

  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(method => method.id === id);
  }

  calculateTotal(subtotal: number, fees: number = 0, discount: number = 0): number {
    return Math.max(0, subtotal + fees - discount);
  }
}

export const paymentService = new PaymentService();