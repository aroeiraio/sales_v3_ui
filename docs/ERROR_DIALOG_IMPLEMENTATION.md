# Error Dialog Implementation Guide

## Overview

This guide outlines the implementation of error dialogs to replace snackbars for error messages in the InoBag Sales V3 UI. The new approach provides better user experience with clear error communication and appropriate actions.

## Design Philosophy

### Why Dialogs Instead of Snackbars?

1. **Better Visibility**: Dialogs are more prominent and harder to miss
2. **Clear Actions**: Users can take specific actions to resolve errors
3. **Context Preservation**: Dialogs maintain context while showing errors
4. **Accessibility**: Better screen reader support and keyboard navigation
5. **Touch-Friendly**: Larger touch targets for mobile/tablet interfaces

### Error Dialog Types

- **Critical Errors**: System failures, network issues
- **Validation Errors**: Form validation, input errors
- **Business Logic Errors**: Cart limits, payment failures
- **Warning Dialogs**: Non-blocking warnings with optional actions

## Implementation Architecture

### 1. Error Dialog Service

**File**: `src/services/errorDialog.ts`

```typescript
export interface ErrorDialogConfig {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  icon?: string;
  actions?: ErrorDialogAction[];
  autoClose?: boolean;
  autoCloseDelay?: number;
  persistent?: boolean;
}

export interface ErrorDialogAction {
  label: string;
  action: () => void;
  variant: 'primary' | 'secondary' | 'destructive';
  autoClose?: boolean;
}

class ErrorDialogService {
  private dialogs: ErrorDialogConfig[] = [];
  private subscribers: ((dialogs: ErrorDialogConfig[]) => void)[] = [];

  showError(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'error',
      autoClose: false,
      persistent: true,
      ...config
    };
    
    this.addDialog(dialog);
  }

  showWarning(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'warning',
      autoClose: true,
      autoCloseDelay: 5000,
      persistent: false,
      ...config
    };
    
    this.addDialog(dialog);
  }

  showInfo(config: Omit<ErrorDialogConfig, 'type'>): void {
    const dialog: ErrorDialogConfig = {
      type: 'info',
      autoClose: true,
      autoCloseDelay: 3000,
      persistent: false,
      ...config
    };
    
    this.addDialog(dialog);
  }

  private addDialog(dialog: ErrorDialogConfig): void {
    this.dialogs.push(dialog);
    this.notifySubscribers();

    // Auto-close if configured
    if (dialog.autoClose && dialog.autoCloseDelay) {
      setTimeout(() => {
        this.closeDialog(dialog);
      }, dialog.autoCloseDelay);
    }
  }

  closeDialog(dialog: ErrorDialogConfig): void {
    const index = this.dialogs.indexOf(dialog);
    if (index > -1) {
      this.dialogs.splice(index, 1);
      this.notifySubscribers();
    }
  }

  closeAllDialogs(): void {
    this.dialogs = [];
    this.notifySubscribers();
  }

  subscribe(callback: (dialogs: ErrorDialogConfig[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.dialogs]));
  }

  getDialogs(): ErrorDialogConfig[] {
    return [...this.dialogs];
  }
}

export const errorDialogService = new ErrorDialogService();
```

### 2. Error Dialog Component

**File**: `src/components/ui/ErrorDialog.svelte`

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { errorDialogService, type ErrorDialogConfig } from '../../services/errorDialog';
  import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-svelte';
  import { visualSettingsService } from '../../services/visualSettings';

  let dialogs: ErrorDialogConfig[] = [];
  let settings: any = null;

  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  };

  onMount(async () => {
    settings = await visualSettingsService.loadSettings();
    
    const unsubscribe = errorDialogService.subscribe((newDialogs) => {
      dialogs = newDialogs;
    });
    
    dialogs = errorDialogService.getDialogs();

    return unsubscribe;
  });

  function handleAction(dialog: ErrorDialogConfig, action: any) {
    action.action();
    if (action.autoClose !== false) {
      errorDialogService.closeDialog(dialog);
    }
  }

  function handleClose(dialog: ErrorDialogConfig) {
    if (!dialog.persistent) {
      errorDialogService.closeDialog(dialog);
    }
  }

  function getIconComponent(type: string) {
    return iconMap[type] || AlertCircle;
  }

  function getDialogStyles(type: string) {
    switch (type) {
      case 'error':
        return {
          borderColor: 'var(--destructive)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)'
        };
      case 'warning':
        return {
          borderColor: 'var(--warning)',
          backgroundColor: 'rgba(245, 158, 11, 0.05)'
        };
      case 'info':
        return {
          borderColor: 'var(--primary)',
          backgroundColor: 'rgba(0, 129, 167, 0.05)'
        };
      default:
        return {
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)'
        };
    }
  }
</script>

{#if dialogs.length > 0}
  <div class="dialog-overlay">
    {#each dialogs as dialog, index (dialog)}
      <div 
        class="error-dialog"
        style:z-index={1000 + index}
        style:border-color={getDialogStyles(dialog.type).borderColor}
        style:background-color={getDialogStyles(dialog.type).backgroundColor}
      >
        <div class="dialog-header">
          <div class="dialog-icon">
            {@const IconComponent = getIconComponent(dialog.type)}
            <IconComponent 
              size={24} 
              color={dialog.type === 'error' ? 'var(--destructive)' : 
                     dialog.type === 'warning' ? 'var(--warning)' : 
                     'var(--primary)'}
            />
          </div>
          <h3 class="dialog-title" style:color={settings?.font_color || 'var(--foreground)'}>
            {dialog.title}
          </h3>
          {#if !dialog.persistent}
            <button 
              class="close-button"
              on:click={() => handleClose(dialog)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          {/if}
        </div>

        <div class="dialog-content">
          <p class="dialog-message" style:color={settings?.font_color || 'var(--muted-foreground)'}>
            {dialog.message}
          </p>
        </div>

        {#if dialog.actions && dialog.actions.length > 0}
          <div class="dialog-actions">
            {#each dialog.actions as action}
              <button
                class="action-button"
                class:primary={action.variant === 'primary'}
                class:secondary={action.variant === 'secondary'}
                class:destructive={action.variant === 'destructive'}
                on:click={() => handleAction(dialog, action)}
              >
                {action.label}
              </button>
            {/each}
          </div>
        {:else if !dialog.persistent}
          <div class="dialog-actions">
            <button
              class="action-button primary"
              on:click={() => handleClose(dialog)}
            >
              OK
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .error-dialog {
    background: var(--card);
    border-radius: var(--radius-lg);
    border: 2px solid;
    box-shadow: var(--shadow-xl);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    animation: dialogSlideIn 0.3s ease-out;
  }

  @keyframes dialogSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1.5rem 0;
  }

  .dialog-icon {
    flex-shrink: 0;
  }

  .dialog-title {
    flex: 1;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .close-button {
    background: transparent;
    border: none;
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: var(--muted);
    color: var(--foreground);
  }

  .dialog-content {
    padding: 1rem 1.5rem;
  }

  .dialog-message {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }

  .dialog-actions {
    display: flex;
    gap: 1rem;
    padding: 0 1.5rem 1.5rem;
    justify-content: flex-end;
  }

  .action-button {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button.primary {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .action-button.primary:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .action-button.secondary {
    background: transparent;
    color: var(--foreground);
    border: 1px solid var(--border);
  }

  .action-button.secondary:hover {
    background: var(--muted);
  }

  .action-button.destructive {
    background: var(--destructive);
    color: var(--destructive-foreground);
  }

  .action-button.destructive:hover {
    background: var(--destructive);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .dialog-overlay {
      padding: 0.5rem;
    }

    .error-dialog {
      max-width: 100%;
    }

    .dialog-header {
      padding: 1rem 1rem 0;
    }

    .dialog-content {
      padding: 1rem;
    }

    .dialog-actions {
      padding: 0 1rem 1rem;
      flex-direction: column;
    }

    .action-button {
      width: 100%;
    }
  }
</style>
```

### 3. Global Error Dialog Container

**File**: `src/App.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ErrorDialog from './components/ui/ErrorDialog.svelte';
  import { visualSettingsService } from './services/visualSettings';
  import { errorDialogService } from './services/errorDialog';

  let settings: any = null;

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
    } catch (error) {
      // Show error dialog for visual settings failure
      errorDialogService.showError({
        title: 'Erro de Configuração',
        message: 'Não foi possível carregar as configurações visuais. Usando configurações padrão.',
        icon: 'settings'
      });
    }
  });

  // Global error handler
  function handleGlobalError(event: ErrorEvent) {
    errorDialogService.showError({
      title: 'Erro do Sistema',
      message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      actions: [
        {
          label: 'Recarregar Página',
          action: () => window.location.reload(),
          variant: 'primary'
        },
        {
          label: 'Continuar',
          action: () => {},
          variant: 'secondary'
        }
      ]
    });
  }

  onMount(() => {
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  });
</script>

<main class="app" style:background-color={settings?.background_color || 'var(--fallground)'}>
  <slot />
  <ErrorDialog />
</main>

<style>
  .app {
    min-height: 100vh;
    font-family: var(--font-sans);
  }
</style>
```

## Usage Examples

### 1. API Error Handling

**File**: `src/services/api.ts`

```typescript
import { errorDialogService } from './errorDialog';

class APIService {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // Show error dialog instead of snackbar
      errorDialogService.showError({
        title: 'Erro de Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => this.request(endpoint, options),
            variant: 'primary'
          },
          {
            label: 'Cancelar',
            action: () => {},
            variant: 'secondary'
          }
        ]
      });
      
      throw error;
    }
  }
}
```

### 2. Cart Service Error Handling

**File**: `src/services/cart.ts`

```typescript
import { errorDialogService } from './errorDialog';

class CartService {
  async addItem(productId: string, quantity: number): Promise<void> {
    try {
      // API call logic
    } catch (error) {
      if (error.code === 'STOCK_UNAVAILABLE') {
        errorDialogService.showError({
          title: 'Produto Indisponível',
          message: 'Este produto está temporariamente fora de estoque.',
          actions: [
            {
              label: 'Ver Outros Produtos',
              action: () => goto('/products'),
              variant: 'primary'
            }
          ]
        });
      } else if (error.code === 'MAX_ITEMS_REACHED') {
        errorDialogService.showError({
          title: 'Limite Atingido',
          message: 'Você atingiu o número máximo de itens permitidos no carrinho.',
          actions: [
            {
              label: 'Ver Carrinho',
              action: () => goto('/cart'),
              variant: 'primary'
            }
          ]
        });
      } else {
        errorDialogService.showError({
          title: 'Erro ao Adicionar Item',
          message: 'Não foi possível adicionar o item ao carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.addItem(productId, quantity),
              variant: 'primary'
            }
          ]
        });
      }
    }
  }
}
```

### 3. Payment Error Handling

**File**: `src/services/payment.ts`

```typescript
import { errorDialogService } from './errorDialog';

class PaymentService {
  async processPayment(paymentData: any): Promise<void> {
    try {
      // Payment processing logic
    } catch (error) {
      if (error.code === 'PAYMENT_DECLINED') {
        errorDialogService.showError({
          title: 'Pagamento Negado',
          message: 'Seu pagamento foi negado. Verifique os dados do cartão ou tente outro método de pagamento.',
          actions: [
            {
              label: 'Tentar Outro Cartão',
              action: () => goto('/checkout'),
              variant: 'primary'
            },
            {
              label: 'Usar PIX',
              action: () => this.selectPaymentMethod('pix'),
              variant: 'secondary'
            },
            {
              label: 'Cancelar',
              action: () => goto('/cart'),
              variant: 'secondary'
            }
          ]
        });
      } else if (error.code === 'NETWORK_ERROR') {
        errorDialogService.showError({
          title: 'Erro de Conexão',
          message: 'Não foi possível processar o pagamento devido a problemas de conexão.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.processPayment(paymentData),
              variant: 'primary'
            },
            {
              label: 'Verificar Conexão',
              action: () => {},
              variant: 'secondary'
            }
          ]
        });
      }
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests for Error Dialog Service

**File**: `src/services/__tests__/errorDialog.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorDialogService } from '../errorDialog';

describe('ErrorDialogService', () => {
  beforeEach(() => {
    errorDialogService.closeAllDialogs();
  });

  it('should show error dialog with correct configuration', () => {
    const config = {
      title: 'Test Error',
      message: 'This is a test error message',
      actions: [
        {
          label: 'OK',
          action: vi.fn(),
          variant: 'primary' as const
        }
      ]
    };

    errorDialogService.showError(config);
    
    const dialogs = errorDialogService.getDialogs();
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0].type).toBe('error');
    expect(dialogs[0].title).toBe('Test Error');
    expect(dialogs[0].persistent).toBe(true);
  });

  it('should auto-close warning dialogs after delay', (done) => {
    const config = {
      title: 'Test Warning',
      message: 'This is a test warning',
      autoCloseDelay: 100
    };

    errorDialogService.showWarning(config);
    
    const dialogs = errorDialogService.getDialogs();
    expect(dialogs).toHaveLength(1);

    setTimeout(() => {
      const updatedDialogs = errorDialogService.getDialogs();
      expect(updatedDialogs).toHaveLength(0);
      done();
    }, 150);
  });

  it('should notify subscribers when dialogs change', () => {
    const callback = vi.fn();
    const unsubscribe = errorDialogService.subscribe(callback);

    errorDialogService.showError({
      title: 'Test',
      message: 'Test message'
    });

    expect(callback).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test',
          message: 'Test message'
        })
      ])
    );

    unsubscribe();
  });
});
```

### 2. Component Tests for Error Dialog

**File**: `src/components/ui/__tests__/ErrorDialog.test.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import ErrorDialog from '../ErrorDialog.svelte';
import { errorDialogService } from '../../../services/errorDialog';
import { visualSettingsService } from '../../../services/visualSettings';

vi.mock('../../../services/visualSettings');

describe('ErrorDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorDialogService.closeAllDialogs();
    (visualSettingsService.loadSettings as any).mockResolvedValue({});
  });

  it('should render error dialog with title and message', async () => {
    errorDialogService.showError({
      title: 'Test Error',
      message: 'This is a test error message'
    });

    render(ErrorDialog);
    
    await waitFor(() => {
      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('This is a test error message')).toBeInTheDocument();
    });
  });

  it('should render custom actions when provided', async () => {
    const mockAction = vi.fn();
    
    errorDialogService.showError({
      title: 'Test Error',
      message: 'Test message',
      actions: [
        {
          label: 'Custom Action',
          action: mockAction,
          variant: 'primary'
        }
      ]
    });

    render(ErrorDialog);
    
    await waitFor(() => {
      const actionButton = screen.getByText('Custom Action');
      fireEvent.click(actionButton);
    });

    expect(mockAction).toHaveBeenCalled();
  });

  it('should close dialog when close button is clicked', async () => {
    errorDialogService.showWarning({
      title: 'Test Warning',
      message: 'Test message'
    });

    render(ErrorDialog);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Fechar');
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Warning')).not.toBeInTheDocument();
    });
  });

  it('should apply visual settings when available', async () => {
    const mockSettings = {
      font_color: '#ff0000'
    };

    (visualSettingsService.loadSettings as any).mockResolvedValue(mockSettings);

    errorDialogService.showError({
      title: 'Test Error',
      message: 'Test message'
    });

    render(ErrorDialog);
    
    await waitFor(() => {
      const title = screen.getByText('Test Error');
      expect(title).toHaveStyle('color: #ff0000');
    });
  });
});
```

## Migration Strategy

### Phase 1: Service Implementation
1. Create `ErrorDialogService` with all methods
2. Implement basic error dialog component
3. Add unit tests for service

### Phase 2: Component Integration
1. Integrate error dialog into main app
2. Replace snackbar calls with dialog calls
3. Test all error scenarios

### Phase 3: Visual Integration
1. Apply visual settings to error dialogs
2. Ensure responsive design
3. Add accessibility features

### Phase 4: Testing & Refinement
1. Comprehensive testing of all error scenarios
2. Performance optimization
3. User experience refinement

## Accessibility Considerations

### ARIA Labels
- Proper `aria-label` for close buttons
- `role="dialog"` for dialog containers
- `aria-describedby` for dialog content

### Keyboard Navigation
- ESC key to close non-persistent dialogs
- Tab navigation between action buttons
- Focus management when dialogs open/close

### Screen Reader Support
- Clear error messages
- Action button descriptions
- Dialog state announcements

## Performance Considerations

### Dialog Management
- Limit maximum number of open dialogs
- Auto-close old dialogs when new ones appear
- Efficient re-rendering with Svelte reactivity

### Memory Management
- Proper cleanup of event listeners
- Unsubscribe from services when components unmount
- Avoid memory leaks in dialog actions

## Conclusion

This implementation provides a robust, user-friendly error handling system that:

1. **Improves User Experience**: Clear, actionable error messages
2. **Maintains Context**: Users stay in their current workflow
3. **Provides Actions**: Specific steps to resolve errors
4. **Supports Accessibility**: Screen reader and keyboard friendly
5. **Integrates with Design System**: Consistent with visual settings

The migration from snackbars to dialogs will significantly improve error communication and user satisfaction in the InoBag Sales V3 UI.
