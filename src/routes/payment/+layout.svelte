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
    /* Hide scrollbars but allow scrolling */
    overflow: auto;
  }

  .payment-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    gap: 2rem;
    width: 100%;
  }

  .payment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    width: 100%;
    max-width: 800px; /* Match container max-width */
    margin: 0 auto;
  }

  /* Hide scrollbars globally for payment screens */
  :global(html) {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }

  :global(html::-webkit-scrollbar) {
    width: 0;
    height: 0;
    display: none; /* Chrome, Safari, Opera */
  }

  :global(body) {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }

  :global(body::-webkit-scrollbar) {
    width: 0;
    height: 0;
    display: none; /* Chrome, Safari, Opera */
  }

  /* Hide scrollbars on all elements within payment layout */
  .payment-layout :global(*) {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }

  .payment-layout :global(*::-webkit-scrollbar) {
    width: 0;
    height: 0;
    display: none; /* Chrome, Safari, Opera */
  }

  /* Standardize width for all payment components */
  .payment-layout :global(.payment-progress),
  .payment-layout :global(.payment-content),
  .payment-layout :global(.section),
  .payment-layout :global(.success-container),
  .payment-layout :global(.instructions-container),
  .payment-layout :global(.method-selection-container),
  .payment-layout :global(.payment-page),
  .payment-layout :global(.payment-wrapper),
  .payment-layout :global(.processing-container),
  .payment-layout :global(.pix-container),
  .payment-layout :global(.card-container),
  .payment-layout :global(.retry-container),
  .payment-layout :global(.failed-container),
  .payment-layout :global(.timeout-container),
  .payment-layout :global(.delivery-info),
  .payment-layout :global(.payment-details) {
    width: 100% !important;
    max-width: 800px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    box-sizing: border-box !important;
  }

  /* Standardize delivery content areas for consistent visual width */
  .payment-layout :global(.delivery-steps),
  .payment-layout :global(.delivery-progress) {
    width: 500px !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  /* Wider containers for better content display */
  .payment-layout :global(.delivery-info),
  .payment-layout :global(.payment-details),
  .payment-layout :global(.success-container) {
    width: 600px !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  /* Preserve specific padding for different container types */
  .payment-layout :global(.delivery-steps),
  .payment-layout :global(.delivery-progress) {
    padding: 0.75rem !important;
  }

  .payment-layout :global(.delivery-info) {
    padding: 0.75rem !important;
  }

  /* Ensure delivery step items don't expand */
  .payment-layout :global(.delivery-step) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
</style>