# PWA Development Guide - InoBag Sales V3 UI

## Overview

This guide covers the complete development of the InoBag Sales V3 UI as a Progressive Web App (PWA), integrating the error dialog system and all core features for vending machine interfaces.

## Table of Contents

1. [PWA Setup & Configuration](#pwa-setup--configuration)
2. [Project Structure](#project-structure)
3. [Core Services Implementation](#core-services-implementation)
4. [Screen Development](#screen-development)
5. [Error Dialog Integration](#error-dialog-integration)
6. [Offline Capabilities](#offline-capabilities)
7. [Testing Strategy](#testing-strategy)
8. [Build & Deployment](#build--deployment)

## PWA Setup & Configuration

### 1. Project Initialization

```bash
# Create Svelte project
npm create svelte@latest sales-v3-ui
cd sales-v3-ui
npm install

# Install PWA dependencies
npm install -D vite-plugin-pwa workbox-window
npm install lucide-svelte

# Install testing dependencies
npm install -D vitest @testing-library/svelte @testing-library/jest-dom
```

### 2. Vite PWA Configuration

**File**: `vite.config.js`

```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'InoBag Sales V3',
        short_name: 'InoBag',
        description: 'Point of Sale interface for vending machines',
        theme_color: '#0081a7',
        background_color: '#fdfcdc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8090\/interface\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 3. Service Worker Registration

**File**: `src/app.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0081a7" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

## Project Structure

```
src/
├── app.html
├── app.css
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── ErrorDialog.svelte
│   │   │   ├── LoadingSpinner.svelte
│   │   │   └── TouchButton.svelte
│   │   └── screens/
│   │       ├── StartScreen.svelte
│   │       ├── ProductsScreen.svelte
│   │       ├── CartScreen.svelte
│   │       ├── CheckoutScreen.svelte
│   │       ├── PaymentScreen.svelte
│   │       └── ThankYouScreen.svelte
│   ├── services/
│   │   ├── errorDialog.ts
│   │   ├── visualSettings.ts
│   │   ├── session.ts
│   │   ├── cart.ts
│   │   ├── payment.ts
│   │   └── offline.ts
│   ├── stores/
│   │   ├── session.ts
│   │   ├── cart.ts
│   │   └── ui.ts
│   └── utils/
│       ├── api.ts
│       ├── validation.ts
│       └── constants.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── products/
│   │   └── +page.svelte
│   ├── cart/
│   │   └── +page.svelte
│   ├── checkout/
│   │   └── +page.svelte
│   └── payment/
│       └── +page.svelte
└── static/
    ├── manifest.json
    ├── sw.js
    └── icons/
```

## Core Services Implementation

### 1. Visual Settings Service

**File**: `src/lib/services/visualSettings.ts`

```typescript
export interface VisualSettings {
  background_color: string;
  background_image: string;
  font_color: string;
  logotype_image: string;
  logotype_pos_x: string;
  logotype_pos_y: string;
  timestamp: string;
}

class VisualSettingsService {
  private settings: VisualSettings | null = null;
  private fallbackSettings: VisualSettings = {
    background_color: '#fdfcdcff',
    background_image: '',
    font_color: '#2C3E50',
    logotype_image: '',
    logotype_pos_x: 'center',
    logotype_pos_y: 'center',
    timestamp: new Date().toISOString()
  };

  async loadSettings(): Promise<VisualSettings> {
    try {
      const response = await fetch('/interface/visual_settings');
      const data = await response.json();
      
      if (!data || data.length === 0 || !data[0]) {
        this.settings = this.fallbackSettings;
      } else {
        this.settings = { ...this.fallbackSettings, ...data[0] };
      }
      
      this.applySettings();
      return this.settings;
    } catch (error) {
      console.warn('Failed to load visual settings, using fallback:', error);
      this.settings = this.fallbackSettings;
      this.applySettings();
      return this.settings;
    }
  }

  private applySettings(): void {
    if (!this.settings) return;

    const root = document.documentElement;
    
    if (this.settings.background_image) {
      root.style.setProperty('--dynamic-bg-image', `url(${this.settings.background_image})`);
    } else if (this.settings.background_color) {
      root.style.setProperty('--dynamic-bg-color', this.settings.background_color);
    }
    
    if (this.settings.font_color) {
      root.style.setProperty('--dynamic-font-color', this.settings.font_color);
    }
  }

  getSettings(): VisualSettings | null {
    return this.settings;
  }
}

export const visualSettingsService = new VisualSettingsService();
```

### 2. Session Service

**File**: `src/lib/services/session.ts`

```typescript
import { errorDialogService } from './errorDialog';

export interface Session {
  sessionId: string;
  expiresAt: string;
  isActive: boolean;
}

class SessionService {
  private session: Session | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = 60000; // 60 seconds

  async startSession(): Promise<Session> {
    try {
      const response = await fetch('/interface/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.session = data;
      this.startTimeout();
      
      return this.session;
    } catch (error) {
      console.error('Failed to start session:', error);
      errorDialogService.showError({
        title: 'Erro de Sessão',
        message: 'Não foi possível iniciar a sessão. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => this.startSession(),
            variant: 'primary'
          }
        ]
      });
      throw error;
    }
  }

  async endSession(): Promise<void> {
    try {
      if (this.session) {
        await fetch('/interface/session', {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      this.session = null;
      this.clearTimeout();
    }
  }

  private startTimeout(): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleTimeout(): void {
    errorDialogService.showWarning({
      title: 'Sessão Expirada',
      message: 'Sua sessão expirou por inatividade. Você será redirecionado para a tela inicial.',
      actions: [
        {
          label: 'OK',
          action: () => {
            this.endSession();
            window.location.href = '/';
          },
          variant: 'primary'
        }
      ]
    });
  }

  getSession(): Session | null {
    return this.session;
  }

  isSessionActive(): boolean {
    return this.session?.isActive ?? false;
  }
}

export const sessionService = new SessionService();
```

### 3. Offline Service

**File**: `src/lib/services/offline.ts`

```typescript
import { errorDialogService } from './errorDialog';

class OfflineService {
  private isOnline = navigator.onLine;
  private offlineQueue: Array<() => Promise<void>> = [];

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
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

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  getQueueLength(): number {
    return this.offlineQueue.length;
  }
}

export const offlineService = new OfflineService();
```

## Error Dialog Integration

### 1. Global Error Handler

**File**: `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ErrorDialog from '$lib/components/ui/ErrorDialog.svelte';
  import { visualSettingsService } from '$lib/services/visualSettings';
  import { sessionService } from '$lib/services/session';
  import { errorDialogService } from '$lib/services/errorDialog';

  let settings: any = null;

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
    } catch (error) {
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

<main class="app" style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
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

### 2. Screen Integration Example

**File**: `src/lib/components/screens/ProductsScreen.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { visualSettingsService } from '../../services/visualSettings';
  import { productsService } from '../../services/products';
  import { cartService } from '../../services/cart';
  import { errorDialogService } from '../../services/errorDialog';
  import { Search, Plus } from 'lucide-svelte';

  let settings: any = null;
  let categories: any[] = [];
  let products: any[] = [];
  let selectedCategory: string | null = null;
  let isLoading = true;

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
      categories = await productsService.getCategories();
      if (categories.length > 0) {
        selectedCategory = categories[0].id;
        await loadProducts(selectedCategory);
      }
    } catch (error) {
      console.error('Failed to load products data:', error);
      errorDialogService.showError({
        title: 'Erro ao Carregar Produtos',
        message: 'Não foi possível carregar a lista de produtos. Tente novamente.',
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

  async function loadProducts(categoryId: string) {
    try {
      products = await productsService.getProductsByCategory(categoryId);
    } catch (error) {
      console.error('Failed to load products:', error);
      errorDialogService.showError({
        title: 'Erro ao Carregar Produtos',
        message: 'Não foi possível carregar os produtos desta categoria.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => loadProducts(categoryId),
            variant: 'primary'
          }
        ]
      });
    }
  }

  async function addToCart(product: any) {
    try {
      await cartService.addItem(product.id, 1);
    } catch (error) {
      // Error handling is done in cartService
    }
  }
</script>

<div class="products-screen" style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
  <!-- Screen content -->
  <header class="header" style:background-color={settings?.font_color || 'var(--fallback-primary)'}>
    <!-- Header content -->
  </header>

  <div class="main-content">
    <!-- Products grid -->
    {#each products as product}
      <div class="product-card">
        <div class="product-image">
          <img src={product.image || 'https://placehold.co/200x160'} alt={product.name} />
        </div>
        <div class="product-info">
          <h3 class="product-name">{product.name}</h3>
          <div class="product-price">
            <span>R$ {product.price.toFixed(2).replace('.', ',')}</span>
            <button class="add-to-cart" on:click={() => addToCart(product)}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Styles */
</style>
```

## Testing Strategy

### 1. Unit Tests

**File**: `src/lib/services/__tests__/visualSettings.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { visualSettingsService } from '../visualSettings';

describe('VisualSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should load settings from API successfully', async () => {
    const mockSettings = {
      background_color: '#ff0000',
      font_color: '#ffffff',
      logotype_image: '/media/logo.png'
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve([mockSettings])
    });

    const result = await visualSettingsService.loadSettings();
    
    expect(result.background_color).toBe('#ff0000');
    expect(result.font_color).toBe('#ffffff');
  });

  it('should use fallback settings when API returns null', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(null)
    });

    const result = await visualSettingsService.loadSettings();
    
    expect(result.background_color).toBe('#fdfcdcff');
    expect(result.font_color).toBe('#2C3E50');
  });
});
```

### 2. Component Tests

**File**: `src/lib/components/screens/__tests__/ProductsScreen.test.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import ProductsScreen from '../ProductsScreen.svelte';
import { visualSettingsService } from '../../../services/visualSettings';
import { productsService } from '../../../services/products';
import { cartService } from '../../../services/cart';

vi.mock('../../../services/visualSettings');
vi.mock('../../../services/products');
vi.mock('../../../services/cart');

describe('ProductsScreen', () => {
  const mockCategories = [
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'lanches', name: 'Lanches' }
  ];

  const mockProducts = [
    { id: '1', name: 'Café Expresso', price: 5.00, image: '/media/coffee.jpg' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (visualSettingsService.loadSettings as any).mockResolvedValue({});
    (productsService.getCategories as any).mockResolvedValue(mockCategories);
    (productsService.getProductsByCategory as any).mockResolvedValue(mockProducts);
  });

  it('should render products when loaded successfully', async () => {
    render(ProductsScreen);
    
    await waitFor(() => {
      expect(screen.getByText('Café Expresso')).toBeInTheDocument();
    });
  });

  it('should show error dialog when products fail to load', async () => {
    (productsService.getProductsByCategory as any).mockRejectedValue(new Error('Network error'));

    render(ProductsScreen);
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao Carregar Produtos')).toBeInTheDocument();
    });
  });
});
```

## Build & Deployment

### 1. Build Configuration

**File**: `package.json`

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 2. Deployment Checklist

- [ ] PWA manifest configured
- [ ] Service worker registered
- [ ] Offline functionality tested
- [ ] Error dialogs working
- [ ] Visual settings integration
- [ ] Touch targets optimized
- [ ] Performance optimized
- [ ] Accessibility tested

### 3. Performance Optimization

```javascript
// vite.config.js - Performance optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte', 'lucide-svelte'],
          services: ['./src/lib/services']
        }
      }
    }
  }
});
```

## Conclusion

This PWA development guide provides a complete framework for building the InoBag Sales V3 UI with:

- **Progressive Web App capabilities** for offline functionality
- **Error dialog system** for better user experience
- **Visual settings integration** for dynamic branding
- **Comprehensive testing** strategy
- **Performance optimization** for tablet interfaces

Follow this guide step by step to create a robust, user-friendly PWA for vending machine interfaces.

