<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { cartService } from '$lib/services/cart';
  import { timerManager } from '$lib/services/timerManager';
  import PaymentHeader from '$lib/components/payment/PaymentHeader.svelte';
  import PaymentProgress from '$lib/components/payment/PaymentProgress.svelte';
  
  let previousRoute = '';
  let currentTime = '';

  // Update time display
  function updateTime() {
    const now = new Date();
    currentTime = now.toLocaleTimeString('pt-BR');
  }

  function goBack() {
    goto('/cart');
  }

  // Determine if back button should be shown based on current page
  function shouldShowBackButton(pathname: string): boolean {
    // Show back button only for method-selection, timeout, and payment refused pages
    return pathname.includes('/method-selection') || 
           pathname.includes('/timeout') || 
           pathname.includes('/failed') ||
           pathname.includes('/retry');
  }

  function getPageTitle(pathname: string): string {
    if (pathname.includes('/method-selection')) return 'Método de Pagamento';
    if (pathname.includes('/processing')) return 'Processando';
    if (pathname.includes('/pix')) return 'PIX';
    if (pathname.includes('/card')) {
      // Get method from URL params for dynamic title
      const urlParams = new URLSearchParams($page.url.search);
      const method = urlParams.get('method');
      if (method === 'credit') return 'Cartão de Crédito';
      if (method === 'debit') return 'Cartão de Débito';
      return 'Cartão';
    }
    if (pathname.includes('/success')) return 'Pagamento Aprovado';
    if (pathname.includes('/failed')) return 'Pagamento Recusado';
    if (pathname.includes('/retry')) return 'Tentar Novamente';
    if (pathname.includes('/timeout')) return 'Tempo Esgotado';
    return 'Pagamento';
  }

  // Ensure user has items in cart before accessing payment flow
  onMount(async () => {
    try {
      // Wait for cart to be loaded from API
      const cart = await cartService.getCart();
      if (!cart.items || cart.items.length === 0) {
        console.warn('Payment layout: No items in cart, redirecting to cart page');
        goto('/cart');
        return;
      }
      console.log('Payment layout: Cart validation passed, allowing payment flow');
      
      // Start time updates
      updateTime();
      const timeInterval = setInterval(updateTime, 1000);
      
      // Cleanup
      return () => {
        clearInterval(timeInterval);
      };
    } catch (error) {
      console.error('Payment layout: Error loading cart, redirecting to cart:', error);
      goto('/cart');
    }
  });

  onDestroy(() => {
    // Clear all payment timers when leaving payment flow
    console.log('Payment layout: Cleaning up all payment timers');
    timerManager.clearAllTimers();
  });

  // Determine current step based on URL
  $: currentStep = getCurrentStep($page.url.pathname);
  
  // Watch for route changes and clear timers from previous contexts
  $: {
    if (previousRoute && previousRoute !== $page.url.pathname) {
      console.log(`Payment layout: Route changed from ${previousRoute} to ${$page.url.pathname}`);
      
      // Clear timers from the previous context
      const previousContext = getContextFromRoute(previousRoute);
      const currentContext = getContextFromRoute($page.url.pathname);
      
      if (previousContext !== currentContext) {
        timerManager.setNavigating(true);
        timerManager.clearTimersByContext(previousContext);
        
        // Allow new timers to start after a brief delay
        setTimeout(() => {
          timerManager.setNavigating(false);
        }, 100);
      }
    }
    previousRoute = $page.url.pathname;
  }

  function getCurrentStep(pathname: string) {
    if (pathname.includes('/method-selection')) return 1;
    if (pathname.includes('/processing')) return 2;
    if (pathname.includes('/pix') || pathname.includes('/card')) return 3;
    if (pathname.includes('/success')) return 4;
    return 1; // Default to step 1
  }

  function getContextFromRoute(pathname: string): string {
    if (pathname.includes('/method-selection')) return 'method-selection';
    if (pathname.includes('/processing')) return 'processing';
    if (pathname.includes('/pix')) return 'pix';
    if (pathname.includes('/card')) return 'card';
    if (pathname.includes('/success')) return 'success';
    if (pathname.includes('/failed')) return 'failed';
    if (pathname.includes('/retry')) return 'retry';
    if (pathname.includes('/timeout')) return 'timeout';
    return 'unknown';
  }
</script>

<svelte:head>
  <title>Pagamento - InoBag Sales</title>
</svelte:head>

<div class="payment-layout">
  <PaymentHeader 
    title={getPageTitle($page.url.pathname)}
    {currentTime}
    onBack={goBack}
    showBackButton={shouldShowBackButton($page.url.pathname)}
  />
  
  <div class="payment-container">
    <PaymentProgress {currentStep} />
    
    <main class="payment-content">
      <slot />
    </main>
  </div>
</div>

<style>
  .payment-layout {
    min-height: 100vh;
    background: var(--background);
    display: flex;
    flex-direction: column;
  }

  .payment-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    gap: 2rem;
  }

  .payment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }
</style>