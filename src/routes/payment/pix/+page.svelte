<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { paymentService } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import PixDisplay from '$lib/components/payment/PixDisplay.svelte';

  // PIX-specific state
  let countdown = 60;
  let countdownInterval: NodeJS.Timeout | null = null;
  let paymentResult: any = null;
  let cart = { total: 0 };
  let isLoading = true;
  let errorMessage = '';

  onMount(async () => {
    try {
      // Load cart data from API
      const cartData = await cartService.getCart();
      cart = {
        total: cartData.total || 0
      };

      // Get QR code data from URL parameters
      const qrcodeParam = $page.url.searchParams.get('qrcode');
      const amountParam = $page.url.searchParams.get('amount');
      const sessionParam = $page.url.searchParams.get('session');
      
      if (!qrcodeParam) {
        console.warn('PIX page accessed without QR code data, redirecting...');
        goto('/payment/method-selection');
        return;
      }

      // Start the PIX countdown timer
      startPixCountdown();
      
      // Use QR code data from URL parameters
      paymentResult = {
        qrcode_source: decodeURIComponent(qrcodeParam),
        session: sessionParam || `pix-${Date.now()}`,
        amount: amountParam ? parseFloat(amountParam) : cart.total
      };

      isLoading = false;

    } catch (error) {
      console.error('Error initializing PIX payment:', error);
      errorMessage = 'Erro ao carregar pagamento PIX';
      isLoading = false;
    }
  });

  onDestroy(() => {
    clearPixCountdown();
  });

  function startPixCountdown() {
    clearPixCountdown(); // Clear any existing countdown
    
    console.log('PIX: Starting 60-second countdown timer');
    countdown = 60;
    
    countdownInterval = setInterval(() => {
      countdown = countdown - 1;
      console.log(`PIX: ${countdown}s remaining`);
      
      if (countdown <= 0) {
        console.log('PIX: Timer expired, handling timeout');
        handleTimeout();
      }
    }, 1000);
  }

  function clearPixCountdown() {
    if (countdownInterval) {
      console.log('PIX: Clearing countdown timer');
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  async function handleTimeout() {
    clearPixCountdown();
    
    try {
      // Cancel the payment
      await paymentService.cancelPayment();
      // Navigate to timeout page
      goto('/payment/timeout');
    } catch (error) {
      console.error('Error handling PIX timeout:', error);
      goto('/payment/timeout');
    }
  }

  function showInstructions() {
    // Navigate to PIX instructions
    goto('/payment/pix/instructions');
  }

  async function cancelPayment() {
    clearPixCountdown();
    
    try {
      await paymentService.cancelPayment();
      goto('/payment/method-selection');
    } catch (error) {
      console.error('Error canceling PIX payment:', error);
      goto('/payment/method-selection');
    }
  }
</script>

<svelte:head>
  <title>Pagamento PIX - InoBag Sales</title>
</svelte:head>

<div class="pix-payment-page">
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando QR Code PIX...</p>
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
    <PixDisplay 
      {paymentResult}
      {cart}
      {countdown}
      onShowInstructions={showInstructions}
      onCancel={cancelPayment}
    />
  {/if}
</div>

<style>
  .pix-payment-page {
    width: 100%;
    max-width: 600px;
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