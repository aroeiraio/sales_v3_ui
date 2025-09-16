<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { paymentService } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import CardDisplay from '$lib/components/payment/CardDisplay.svelte';

  // Card-specific state
  let countdown = 180; // 3 minutes for card payment
  let countdownInterval: NodeJS.Timeout | null = null;
  let cart = { total: 0 };
  let isLoading = true;
  let errorMessage = '';
  let paymentMethod = '';

  onMount(async () => {
    try {
      // Load cart data from API
      const cartData = await cartService.getCart();
      cart = {
        total: cartData.total || 0
      };

      // Get payment method from URL parameters
      const methodParam = $page.url.searchParams.get('method');
      console.log('Card page: Method parameter from URL:', methodParam);
      console.log('Card page: Full URL:', $page.url.toString());
      
      if (!methodParam || !['credit', 'debit'].includes(methodParam)) {
        console.warn('Card page accessed without valid payment method, redirecting...');
        console.warn('Card page: Invalid method param:', methodParam);
        goto('/payment/method-selection');
        return;
      }

      paymentMethod = methodParam;

      // Payment is already started, just start the countdown timer
      console.log('Card page: Payment already started, starting countdown timer for method:', paymentMethod);

      // Start the card payment countdown timer
      startCardCountdown();

      isLoading = false;

    } catch (error) {
      console.error('Error initializing card payment:', error);
      errorMessage = 'Erro ao carregar pagamento com cartão';
      isLoading = false;
    }
  });

  onDestroy(() => {
    clearCardCountdown();
  });

  function startCardCountdown() {
    clearCardCountdown(); // Clear any existing countdown
    
    console.log('Card: Starting 180-second countdown timer');
    countdown = 180;
    
    countdownInterval = setInterval(() => {
      countdown = countdown - 1;
      console.log(`Card: ${countdown}s remaining`);
      
      if (countdown <= 0) {
        console.log('Card: Timer expired, handling timeout');
        handleTimeout();
      }
    }, 1000);
  }

  function clearCardCountdown() {
    if (countdownInterval) {
      console.log('Card: Clearing countdown timer');
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  async function handleTimeout() {
    clearCardCountdown();
    
    try {
      // Cancel the payment
      await paymentService.cancelPayment();
      // Navigate to timeout page
      goto('/payment/timeout');
    } catch (error) {
      console.error('Error handling card timeout:', error);
      goto('/payment/timeout');
    }
  }

  async function cancelPayment() {
    clearCardCountdown();
    
    try {
      await paymentService.cancelPayment();
      goto('/payment/method-selection');
    } catch (error) {
      console.error('Error canceling card payment:', error);
      goto('/payment/method-selection');
    }
  }

  // Format countdown for display (MM:SS)
  function formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>Pagamento com Cartão - InoBag Sales</title>
</svelte:head>

<div class="card-payment-page">
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Preparando pagamento com cartão...</p>
    </div>
  {:else if errorMessage}
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>Erro</h2>
      <p>{errorMessage}</p>
      <button class="retry-button" on:click={() => goto('/payment/method-selection')}>
        Voltar
      </button>
    </div>
  {:else}
    <CardDisplay 
      {cart}
      {paymentMethod}
      countdown={formatCountdown(countdown)}
      countdownSeconds={countdown}
      onCancel={cancelPayment}
    />
  {/if}
</div>

<style>
  .card-payment-page {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 300px;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-container h2 {
    color: var(--destructive);
    margin: 0;
  }

  .error-container p {
    color: var(--muted-foreground);
    margin: 0;
  }

  .retry-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .retry-button:hover {
    opacity: 0.9;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>