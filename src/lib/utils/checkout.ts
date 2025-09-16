/**
 * Format price for display in Brazilian Real (BRL)
 * @param price - The price value to format
 * @returns Formatted price string in BRL format
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return (0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Payment method configuration registry
 * Maps broker + method combinations to display properties
 */
const PAYMENT_METHOD_REGISTRY: Record<string, Record<string, PaymentMethodDisplay>> = {
  'MERCADOPAGO': {
    'pix': {
      name: 'PIX',
      description: 'Pagamento instantâneo via QR Code',
      icon: 'qr-code'
    }
  },
  'MERCADOPAGO_PINPAD': {
    'credit': {
      name: 'Cartão de Crédito',
      description: 'Insira ou aproxime seu cartão',
      icon: 'credit-card'
    },
    'debit': {
      name: 'Cartão de Débito',
      description: 'Insira ou aproxime seu cartão',
      icon: 'landmark'
    }
  },
  'TEST_PAYMENT': {
    'pix': {
      name: 'PIX para Testes',
      description: 'Pagamento instantâneo para testes',
      icon: 'qr-code'
    },
    'credit': {
      name: 'Cartão de Crédito para Testes',
      description: 'Cartão de crédito para testes',
      icon: 'credit-card'
    },
    'debit': {
      name: 'Cartão de Débito para Testes',
      description: 'Cartão de débito para testes',
      icon: 'landmark'
    }
  }
};

/**
 * Default fallback configurations for unknown brokers/methods
 */
const DEFAULT_PAYMENT_DISPLAYS: Record<string, PaymentMethodDisplay> = {
  'pix': {
    name: 'PIX',
    description: 'Pagamento instantâneo',
    icon: 'qr-code'
  },
  'credit': {
    name: 'Cartão de Crédito',
    description: 'Pagamento com cartão',
    icon: 'credit-card'
  },
  'debit': {
    name: 'Cartão de Débito',
    description: 'Pagamento com cartão',
    icon: 'landmark'
  },
  'card': {
    name: 'Cartão',
    description: 'Pagamento com cartão',
    icon: 'credit-card'
  }
};

/**
 * Get display properties for a broker + method combination
 * @param broker - Payment broker name
 * @param method - Payment method name
 * @returns Display properties or null if not supported
 */
function getPaymentMethodDisplay(broker: string, method: string): PaymentMethodDisplay | null {
  // First try exact broker + method match
  const brokerMethods = PAYMENT_METHOD_REGISTRY[broker];
  if (brokerMethods && brokerMethods[method]) {
    return brokerMethods[method];
  }
  
  // Fall back to default method display
  if (DEFAULT_PAYMENT_DISPLAYS[method]) {
    return DEFAULT_PAYMENT_DISPLAYS[method];
  }
  
  // Last resort: generic display based on method name
  return {
    name: method.charAt(0).toUpperCase() + method.slice(1),
    description: `Pagamento via ${method}`,
    icon: 'credit-card'
  };
}

/**
 * Transform payment broker methods into display format
 * @param availablePaymentMethods - Array of payment brokers with their methods
 * @returns Array of display-formatted payment methods
 */
export function getDisplayPaymentMethods(availablePaymentMethods: any[]): any[] {
  const displayMethods = [];
  
  for (const broker of availablePaymentMethods) {
    if (!broker.available) continue;
    
    for (const method of broker.methods) {
      const displayProperties = getPaymentMethodDisplay(broker.broker, method);
      
      if (displayProperties) {
        const displayMethod = {
          id: `${broker.broker}-${method}`,
          broker: broker.broker,
          method: method,
          name: displayProperties.name,
          description: displayProperties.description,
          icon: displayProperties.icon
        };
        
        displayMethods.push(displayMethod);
      }
    }
  }
  
  return displayMethods;
}

/**
 * Register a new payment method configuration
 * @param broker - Broker name
 * @param method - Method name
 * @param display - Display properties
 */
export function registerPaymentMethod(broker: string, method: string, display: PaymentMethodDisplay): void {
  if (!PAYMENT_METHOD_REGISTRY[broker]) {
    PAYMENT_METHOD_REGISTRY[broker] = {};
  }
  PAYMENT_METHOD_REGISTRY[broker][method] = display;
}

/**
 * Check if payment method is PIX based on method name
 * @param selectedPayment - Selected payment method ID
 * @returns True if payment is PIX, false otherwise
 */
export function isPixPayment(selectedPayment: string): boolean {
  if (!selectedPayment) return false;
  
  const [broker, method] = selectedPayment.split('-');
  return method === 'pix';
}

/**
 * Get payment method display name from ID
 * @param methodId - Payment method ID
 * @param displayMethods - Array of display methods
 * @returns Display name or empty string if not found
 */
export function getPaymentMethodName(methodId: string, displayMethods: any[]): string {
  const method = displayMethods.find(m => m.id === methodId);
  return method?.name || '';
}

/**
 * Validate payment method selection
 * @param selectedPayment - Selected payment method ID
 * @param availablePaymentMethods - Array of available payment brokers
 * @returns True if valid, false otherwise
 */
export function isValidPaymentMethod(selectedPayment: string, availablePaymentMethods: any[]): boolean {
  if (!selectedPayment) return false;
  
  const [broker, method] = selectedPayment.split('-');
  if (!broker || !method) return false;
  
  const brokerData = availablePaymentMethods.find(b => b.broker === broker);
  
  return !!(brokerData?.available && brokerData?.methods.includes(method));
}

/**
 * Payment state type definitions for better type safety
 */
export type PaymentState = 
  | 'idle' 
  | 'processing' 
  | 'show_qrcode' 
  | 'insert_tap_card' 
  | 'payment_timeout' 
  | 'success' 
  | 'failed' 
  | 'retry';

/**
 * Payment method display properties
 */
export interface PaymentMethodDisplay {
  name: string;
  description: string;
  icon: string;
}

/**
 * Payment method configuration interface
 */
export interface PaymentMethodConfig {
  id: string;
  broker: string;
  method: string;
  icon: string;
  name: string;
  description: string;
}

/**
 * Payment broker interface
 */
export interface PaymentBroker {
  broker: string;
  available: boolean;
  methods: string[];
}

/**
 * Get all registered payment method configurations
 * @returns Object with all registered broker and method combinations
 */
export function getRegisteredPaymentMethods(): Record<string, Record<string, PaymentMethodDisplay>> {
  return { ...PAYMENT_METHOD_REGISTRY };
}

/**
 * Check if a broker + method combination is registered
 * @param broker - Broker name
 * @param method - Method name
 * @returns True if registered, false otherwise
 */
export function isPaymentMethodRegistered(broker: string, method: string): boolean {
  return !!(PAYMENT_METHOD_REGISTRY[broker]?.[method]);
}