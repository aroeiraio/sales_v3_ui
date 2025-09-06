# Migration Guide: Snackbar to Error Dialog

## Overview

This guide provides step-by-step instructions for migrating from snackbar notifications to the new error dialog system in the InoBag Sales V3 UI.

## Migration Steps

### Step 1: Install Dependencies

Ensure you have the required dependencies installed:

```bash
npm install lucide-svelte
```

### Step 2: Import Error Dialog Service

Replace snackbar imports with the error dialog service:

```typescript
// Before
import { snackbarService } from './services/snackbar';

// After
import { errorDialogService } from './services/errorDialog';
```

### Step 3: Replace Snackbar Calls

#### Simple Error Messages

```typescript
// Before
snackbarService.showError('Erro ao carregar produtos');

// After
errorDialogService.showError({
  title: 'Erro ao Carregar Produtos',
  message: 'Não foi possível carregar a lista de produtos. Tente novamente.',
  actions: [
    {
      label: 'Tentar Novamente',
      action: () => loadProducts(),
      variant: 'primary'
    }
  ]
});
```

#### Success Messages

```typescript
// Before
snackbarService.showSuccess('Item adicionado ao carrinho');

// After
errorDialogService.showSuccess({
  title: 'Item Adicionado',
  message: 'Produto adicionado ao carrinho com sucesso!',
  autoClose: true,
  autoCloseDelay: 2000
});
```

#### Warning Messages

```typescript
// Before
snackbarService.showWarning('Produto com estoque baixo');

// After
errorDialogService.showWarning({
  title: 'Estoque Baixo',
  message: 'Este produto está com estoque limitado.',
  autoClose: true,
  autoCloseDelay: 5000
});
```

### Step 4: Update Component Integration

#### Add Error Dialog to App.svelte

```svelte
<!-- App.svelte -->
<script lang="ts">
  import ErrorDialog from './components/ui/ErrorDialog.svelte';
  import { visualSettingsService } from './services/visualSettings';
  
  let settings: any = null;

  onMount(async () => {
    settings = await visualSettingsService.loadSettings();
  });
</script>

<main class="app">
  <slot />
  <ErrorDialog />
</main>
```

#### Update Service Error Handling

```typescript
// Before - API Service
class APIService {
  async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        snackbarService.showError('Erro de conexão');
        throw new Error('Request failed');
      }
      return await response.json();
    } catch (error) {
      snackbarService.showError('Erro inesperado');
      throw error;
    }
  }
}

// After - API Service
class APIService {
  async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        errorDialogService.showNetworkError(() => this.request(endpoint));
        throw new Error('Request failed');
      }
      return await response.json();
    } catch (error) {
      if (error.message.includes('network')) {
        errorDialogService.showNetworkError(() => this.request(endpoint));
      } else {
        errorDialogService.showError({
          title: 'Erro Inesperado',
          message: 'Ocorreu um erro inesperado. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.request(endpoint),
              variant: 'primary'
            }
          ]
        });
      }
      throw error;
    }
  }
}
```

### Step 5: Update Cart Service

```typescript
// Before - Cart Service
class CartService {
  async addItem(productId: string): Promise<void> {
    try {
      // API call
      snackbarService.showSuccess('Item adicionado');
    } catch (error) {
      if (error.code === 'STOCK_UNAVAILABLE') {
        snackbarService.showError('Produto indisponível');
      } else {
        snackbarService.showError('Erro ao adicionar item');
      }
    }
  }
}

// After - Cart Service
class CartService {
  async addItem(productId: string): Promise<void> {
    try {
      // API call
      errorDialogService.showSuccess({
        title: 'Item Adicionado',
        message: 'Produto adicionado ao carrinho com sucesso!',
        autoClose: true,
        autoCloseDelay: 2000
      });
    } catch (error) {
      if (error.code === 'STOCK_UNAVAILABLE') {
        errorDialogService.showCartError('stock');
      } else if (error.code === 'MAX_ITEMS_REACHED') {
        errorDialogService.showCartError('limit');
      } else {
        errorDialogService.showError({
          title: 'Erro ao Adicionar Item',
          message: 'Não foi possível adicionar o item ao carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.addItem(productId),
              variant: 'primary'
            }
          ]
        });
      }
    }
  }
}
```

### Step 6: Update Payment Service

```typescript
// Before - Payment Service
class PaymentService {
  async processPayment(data: any): Promise<void> {
    try {
      // Payment processing
      snackbarService.showSuccess('Pagamento aprovado');
    } catch (error) {
      if (error.code === 'PAYMENT_DECLINED') {
        snackbarService.showError('Pagamento negado');
      } else {
        snackbarService.showError('Erro no pagamento');
      }
    }
  }
}

// After - Payment Service
class PaymentService {
  async processPayment(data: any): Promise<void> {
    try {
      // Payment processing
      errorDialogService.showSuccess({
        title: 'Pagamento Aprovado',
        message: 'Seu pagamento foi processado com sucesso!',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } catch (error) {
      if (error.code === 'PAYMENT_DECLINED') {
        errorDialogService.showPaymentError('declined');
      } else if (error.code === 'NETWORK_ERROR') {
        errorDialogService.showPaymentError('network');
      } else {
        errorDialogService.showPaymentError('general');
      }
    }
  }
}
```

## Common Migration Patterns

### Pattern 1: Simple Success Messages

```typescript
// Before
snackbarService.showSuccess('Operação realizada com sucesso');

// After
errorDialogService.showSuccess({
  title: 'Sucesso',
  message: 'Operação realizada com sucesso!',
  autoClose: true,
  autoCloseDelay: 2000
});
```

### Pattern 2: Error with Retry Action

```typescript
// Before
snackbarService.showError('Erro de conexão');

// After
errorDialogService.showError({
  title: 'Erro de Conexão',
  message: 'Não foi possível conectar ao servidor. Tente novamente.',
  actions: [
    {
      label: 'Tentar Novamente',
      action: () => retryOperation(),
      variant: 'primary'
    }
  ]
});
```

### Pattern 3: Warning with Auto-Close

```typescript
// Before
snackbarService.showWarning('Aviso importante');

// After
errorDialogService.showWarning({
  title: 'Aviso',
  message: 'Aviso importante que requer atenção.',
  autoClose: true,
  autoCloseDelay: 5000
});
```

### Pattern 4: Complex Error with Multiple Actions

```typescript
// Before
snackbarService.showError('Erro no pagamento');

// After
errorDialogService.showError({
  title: 'Erro no Pagamento',
  message: 'Não foi possível processar seu pagamento. Escolha uma das opções abaixo.',
  actions: [
    {
      label: 'Tentar Novamente',
      action: () => retryPayment(),
      variant: 'primary'
    },
    {
      label: 'Alterar Método',
      action: () => changePaymentMethod(),
      variant: 'secondary'
    },
    {
      label: 'Cancelar',
      action: () => cancelOrder(),
      variant: 'secondary'
    }
  ]
});
```

## Testing Migration

### Update Test Files

```typescript
// Before - Test
import { snackbarService } from '../services/snackbar';

describe('CartService', () => {
  it('should show success message when item is added', () => {
    const spy = vi.spyOn(snackbarService, 'showSuccess');
    
    cartService.addItem('product1');
    
    expect(spy).toHaveBeenCalledWith('Item adicionado ao carrinho');
  });
});

// After - Test
import { errorDialogService } from '../services/errorDialog';

describe('CartService', () => {
  it('should show success dialog when item is added', () => {
    const spy = vi.spyOn(errorDialogService, 'showSuccess');
    
    cartService.addItem('product1');
    
    expect(spy).toHaveBeenCalledWith({
      title: 'Item Adicionado',
      message: 'Produto adicionado ao carrinho com sucesso!',
      autoClose: true,
      autoCloseDelay: 2000
    });
  });
});
```

## Benefits of Migration

### 1. Better User Experience
- **Clear Actions**: Users know exactly what to do when errors occur
- **Context Preservation**: Users stay in their current workflow
- **Better Visibility**: Dialogs are harder to miss than snackbars

### 2. Improved Accessibility
- **Screen Reader Support**: Better announcements and navigation
- **Keyboard Navigation**: Full keyboard support for all actions
- **Focus Management**: Proper focus handling when dialogs open/close

### 3. Enhanced Functionality
- **Multiple Actions**: Support for complex error scenarios
- **Custom Styling**: Integration with visual settings
- **Auto-Close Options**: Configurable timing for different message types

### 4. Better Error Handling
- **Specific Error Types**: Dedicated methods for common error scenarios
- **Retry Mechanisms**: Built-in support for retry actions
- **Error Context**: More detailed error information and guidance

## Rollback Plan

If you need to rollback the migration:

1. **Keep Snackbar Service**: Don't remove the old snackbar service immediately
2. **Feature Flag**: Use a feature flag to switch between snackbar and dialog
3. **Gradual Migration**: Migrate one service at a time
4. **Testing**: Test each migration step thoroughly

```typescript
// Feature flag approach
const USE_ERROR_DIALOGS = import.meta.env.VITE_USE_ERROR_DIALOGS === 'true';

if (USE_ERROR_DIALOGS) {
  errorDialogService.showError(config);
} else {
  snackbarService.showError(message);
}
```

## Conclusion

The migration from snackbars to error dialogs provides significant improvements in user experience, accessibility, and functionality. Follow this guide step by step to ensure a smooth transition while maintaining all existing functionality.

Remember to:
- Test each migration step thoroughly
- Update all related test files
- Consider using feature flags for gradual rollout
- Monitor user feedback during the transition
- Keep the old snackbar service as a fallback during migration

