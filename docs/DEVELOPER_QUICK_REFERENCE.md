# Developer Quick Reference - InoBag Sales V3 UI

## Quick Start

### 1. Setup
```bash
npm install
npm run dev
```

### 2. Key Files
- **Main App**: `src/routes/+layout.svelte`
- **Error Dialog**: `src/lib/components/ui/ErrorDialog.svelte`
- **Services**: `src/lib/services/`
- **Screens**: `src/lib/components/screens/`

## Error Dialog Usage

### Basic Error
```typescript
import { errorDialogService } from '$lib/services/errorDialog';

errorDialogService.showError({
  title: 'Erro de Conexão',
  message: 'Não foi possível conectar ao servidor.',
  actions: [
    {
      label: 'Tentar Novamente',
      action: () => retry(),
      variant: 'primary'
    }
  ]
});
```

### Success Message
```typescript
errorDialogService.showSuccess({
  title: 'Sucesso',
  message: 'Operação realizada com sucesso!',
  autoClose: true,
  autoCloseDelay: 2000
});
```

### Convenience Methods
```typescript
// Network error with retry
errorDialogService.showNetworkError(() => retry());

// Cart errors
errorDialogService.showCartError('stock'); // or 'limit', 'general'

// Payment errors
errorDialogService.showPaymentError('declined'); // or 'network', 'timeout'
```

## Visual Settings Integration

### Load Settings
```typescript
import { visualSettingsService } from '$lib/services/visualSettings';

const settings = await visualSettingsService.loadSettings();
```

### Apply in Component
```svelte
<div style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
  {#if settings?.logotype_image}
    <img src={settings.logotype_image} alt="Logo" />
  {/if}
</div>
```

## Service Patterns

### API Service
```typescript
class APIService {
  async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      errorDialogService.showNetworkError(() => this.request(endpoint));
      throw error;
    }
  }
}
```

### Cart Service
```typescript
import { cartService } from '$lib/services/cart';

// Add item
await cartService.addItem('product1', 1);

// Get cart
const cart = cartService.getCart();

// Subscribe to changes
const unsubscribe = cartService.subscribe((cart) => {
  console.log('Cart updated:', cart);
});
```

## Component Structure

### Screen Component Template
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { visualSettingsService } from '$lib/services/visualSettings';
  import { errorDialogService } from '$lib/services/errorDialog';

  let settings: any = null;
  let isLoading = true;

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
      // Load other data
    } catch (error) {
      errorDialogService.showError({
        title: 'Erro ao Carregar',
        message: 'Não foi possível carregar os dados.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      });
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="screen" style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
  <!-- Content -->
</div>

<style>
  .screen {
    min-height: 100vh;
    font-family: var(--font-sans);
  }
</style>
```

## Testing Patterns

### Service Test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { service } from '../service';

describe('Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle success case', async () => {
    const result = await service.method();
    expect(result).toBeDefined();
  });

  it('should handle error case', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    await expect(service.method()).rejects.toThrow();
  });
});
```

### Component Test
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import Component from '../Component.svelte';

describe('Component', () => {
  it('should render correctly', async () => {
    render(Component);
    
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

## Common Patterns

### Loading States
```svelte
{#if isLoading}
  <div class="skeleton">Loading...</div>
{:else}
  <!-- Content -->
{/if}
```

### Error Boundaries
```typescript
try {
  await riskyOperation();
} catch (error) {
  errorDialogService.showError({
    title: 'Erro',
    message: 'Algo deu errado.',
    actions: [
      {
        label: 'Tentar Novamente',
        action: () => riskyOperation(),
        variant: 'primary'
      }
    ]
  });
}
```

### Touch Targets
```css
.touch-button {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## API Endpoints

### Visual Settings
```
GET /interface/visual_settings
```

### Products
```
GET /interface/categories
GET /interface/products/{categoryId}
```

### Cart
```
GET /interface/cart
POST /interface/cart
DELETE /interface/cart
```

### Session
```
POST /interface/session
DELETE /interface/session
```

## Build Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview

# Test
npm run test
npm run test:ui
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Error Dialog Not Showing**
   - Check if ErrorDialog component is imported in +layout.svelte
   - Verify errorDialogService is imported correctly

2. **Visual Settings Not Applied**
   - Check if visualSettingsService.loadSettings() is called
   - Verify CSS custom properties are set correctly

3. **Touch Targets Too Small**
   - Ensure min-height: 44px and min-width: 44px
   - Check padding and margin values

4. **Offline Functionality Not Working**
   - Verify service worker is registered
   - Check workbox configuration in vite.config.js

### Debug Tips

```typescript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('SW ready:', registration);
});

// Monitor error dialogs
errorDialogService.subscribe(dialogs => {
  console.log('Active dialogs:', dialogs);
});
```

## Performance Tips

1. **Lazy Load Images**
   ```svelte
   <img src={image} loading="lazy" alt="Product" />
   ```

2. **Debounce Search**
   ```typescript
   import { debounce } from 'lodash-es';
   
   const debouncedSearch = debounce(searchFunction, 300);
   ```

3. **Virtual Scrolling**
   ```svelte
   <div class="virtual-scroll">
     {#each visibleItems as item}
       <div class="item">{item.name}</div>
     {/each}
   </div>
   ```

## Accessibility Checklist

- [ ] All buttons have proper ARIA labels
- [ ] Images have alt text
- [ ] Touch targets are at least 44px
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Screen reader announcements are clear

