<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { paymentService } from '$lib/services/payment';

  let processingMessage = 'Processando pagamento...';
  let timeoutId: number;

  onMount(() => {
    console.log('Processing page mounted');
    console.log('Current payment state:', paymentService.getCurrentState());
    
    // Add a timeout to prevent infinite processing
    // The payment service will automatically navigate to the appropriate route
    // when the payment state changes through the navigation service
    timeoutId = setTimeout(() => {
      console.warn('Processing timeout - redirecting to method selection');
      goto('/payment/method-selection');
    }, 30000); // 30 second timeout

    // Update processing message based on current state
    const currentState = paymentService.getCurrentState();
    console.log('Processing page: Current state is', currentState);
    switch (currentState) {
      case 'processing':
        processingMessage = 'Processando pagamento...';
        break;
      case 'wait':
        processingMessage = 'Aguardando confirmação...';
        break;
      default:
        processingMessage = 'Iniciando pagamento...';
    }
  });

  onDestroy(() => {
    // Clear the timeout to prevent unwanted redirects
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  function handleCancel() {
    paymentService.cancelPayment().catch(console.error);
    goto('/payment/method-selection');
  }
</script>

<svelte:head>
  <title>Processando Pagamento - InoBag Sales</title>
</svelte:head>

<div class="processing-page">
  <div class="processing-container">
    <div class="processing-animation">
      <div class="processing-spinner"></div>
      <div class="processing-pulse"></div>
    </div>
    
    <div class="processing-content">
      <h2>Processando Pagamento</h2>
      <p class="processing-message">{processingMessage}</p>
      <p class="processing-subtitle">Por favor, aguarde enquanto preparamos seu pagamento...</p>
    </div>

    <div class="processing-actions">
      <button class="cancel-button" on:click={handleCancel}>
        Cancelar
      </button>
    </div>
  </div>
</div>

<style>
  .processing-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
  }

  .processing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 500px;
    width: 100%;
    gap: 2rem;
  }

  .processing-animation {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .processing-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid var(--border);
    border-top: 6px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 2;
  }

  .processing-pulse {
    position: absolute;
    width: 120px;
    height: 120px;
    border: 2px solid var(--primary);
    border-radius: 50%;
    opacity: 0;
    animation: pulse 2s ease-out infinite;
  }

  .processing-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .processing-content h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0;
  }

  .processing-message {
    font-size: 1.25rem;
    color: var(--primary);
    font-weight: 600;
    margin: 0;
  }

  .processing-subtitle {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.5;
  }

  .processing-actions {
    margin-top: 1rem;
  }

  .cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid var(--border);
    min-width: 300px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% {
      opacity: 0.8;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.1);
    }
    100% {
      opacity: 0;
      transform: scale(1.4);
    }
  }

  @media (max-width: 640px) {
    .processing-animation {
      width: 100px;
      height: 100px;
    }
    
    .processing-spinner {
      width: 60px;
      height: 60px;
      border-width: 4px;
    }
    
    .processing-pulse {
      width: 100px;
      height: 100px;
    }
    
    .processing-content h2 {
      font-size: 1.5rem;
    }
    
    .processing-message {
      font-size: 1.125rem;
    }
    
    .cancel-button {
      min-width: 250px;
    }
  }
</style>