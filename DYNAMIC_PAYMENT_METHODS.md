# Dynamic Payment Method System

This document explains how the payment method system has been refactored to be more dynamic and extensible.

## Overview

The payment system now uses a registry-based approach that can handle any broker + method combination dynamically, making it easy to add new payment providers without code changes.

## Current Configuration

### Existing Payment Methods

The system currently supports:

```typescript
MERCADOPAGO:
  - pix: "PIX" (Pagamento instantâneo via QR Code)

MERCADOPAGO_PINPAD:
  - credit: "Cartão de Crédito" (Insira ou aproxime seu cartão)
  - debit: "Cartão de Débito" (Insira ou aproxime seu cartão)
```

## How It Works

### 1. Payment Method Registry

The system uses a registry that maps broker + method combinations to display properties:

```typescript
const PAYMENT_METHOD_REGISTRY = {
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
    }
  }
}
```

### 2. Fallback System

If a broker + method combination is not registered, the system falls back to:

1. **Default method displays** - Generic configurations for common methods like 'pix', 'credit', 'debit'
2. **Auto-generated displays** - Creates display properties based on the method name

### 3. Dynamic Processing

The `getDisplayPaymentMethods()` function processes the API response dynamically:

```typescript
// Input from API
[
  {
    broker: "MERCADOPAGO",
    available: true,
    methods: ["pix"]
  },
  {
    broker: "MERCADOPAGO_PINPAD", 
    available: true,
    methods: ["debit", "credit"]
  }
]

// Output for UI
[
  {
    id: "MERCADOPAGO-pix",
    broker: "MERCADOPAGO",
    method: "pix",
    name: "PIX",
    description: "Pagamento instantâneo via QR Code",
    icon: "qr-code"
  },
  {
    id: "MERCADOPAGO_PINPAD-debit",
    broker: "MERCADOPAGO_PINPAD",
    method: "debit", 
    name: "Cartão de Débito",
    description: "Insira ou aproxime seu cartão",
    icon: "landmark"
  }
]
```

## Adding New Payment Methods

### Option 1: Register at Runtime

```typescript
import { registerPaymentMethod } from '$lib/utils/checkout';

// Add support for a new broker
registerPaymentMethod('NEW_BROKER', 'wallet', {
  name: 'Carteira Digital',
  description: 'Pagamento via carteira digital',
  icon: 'wallet'
});
```

### Option 2: Modify Registry (for permanent additions)

Edit `/src/lib/utils/checkout.ts` and add to `PAYMENT_METHOD_REGISTRY`:

```typescript
const PAYMENT_METHOD_REGISTRY = {
  // existing entries...
  'NEW_BROKER': {
    'wallet': {
      name: 'Carteira Digital', 
      description: 'Pagamento via carteira digital',
      icon: 'wallet'
    },
    'crypto': {
      name: 'Criptomoeda',
      description: 'Pagamento com Bitcoin/Ethereum',
      icon: 'bitcoin'
    }
  }
}
```

## Key Benefits

1. **Zero Code Changes**: New brokers can be added without modifying the checkout logic
2. **Fallback Support**: Unknown methods get reasonable default displays
3. **Type Safety**: All configurations are properly typed
4. **Extensible**: Easy to add new brokers and methods
5. **Backward Compatible**: Existing MERCADOPAGO systems continue to work

## API Response Examples

### Current Structure
```json
[
  {
    "broker": "MERCADOPAGO",
    "available": true,
    "methods": ["pix"]
  },
  {
    "broker": "MERCADOPAGO_PINPAD",
    "available": true, 
    "methods": ["debit", "credit"]
  }
]
```

### Future Example (automatically supported)
```json
[
  {
    "broker": "PAYPAL",
    "available": true,
    "methods": ["paypal", "credit"]
  },
  {
    "broker": "STRIPE",
    "available": true,
    "methods": ["card", "apple_pay"]
  }
]
```

The system will automatically generate reasonable displays for these new methods, and you can register custom displays as needed.

## Utility Functions

- `getDisplayPaymentMethods(brokers)` - Convert broker data to UI display format
- `registerPaymentMethod(broker, method, display)` - Add new payment method
- `isPixPayment(methodId)` - Check if payment method is PIX
- `isPaymentMethodRegistered(broker, method)` - Check if method is registered
- `getRegisteredPaymentMethods()` - Get all registered methods for debugging