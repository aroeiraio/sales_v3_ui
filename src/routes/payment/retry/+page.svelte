<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Get retry parameters from URL
  $: retryCount = parseInt($page.url.searchParams.get('retryCount') || '1');
  $: maxRetries = 3;
  $: reason = $page.url.searchParams.get('reason') || 'Payment was refused';

  let timeLeft = 20;
  let timerInterval: number;

  onMount(() => {
    // Start 20-second countdown timer
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        console.log('Retry page: 20-second timeout reached, canceling operation');
        cancel();
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function retry() {
    // Clear timer and go to method selection
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    goto('/payment/method-selection');
  }

  function cancel() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    goto('/');
  }

  function selectDifferentMethod() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    goto('/payment/method-selection');
  }
</script>

<svelte:head>
  <title>Tentar Novamente - InoBag Sales</title>
</svelte:head>

<div class="retry-page">
  <div class="retry-container">
    <div class="retry-header">
      <div class="retry-icon">❌</div>
      <p class="payment-refused-message">Lamento, mas o seu pagamento foi recusado</p>
      <h1>Vamos tentar novamente?</h1>
      <div class="timer-display">
        <span class="timer-text">Cancelamento automático em {timeLeft}s</span>
        <div class="timer-progress">
          <div class="timer-bar" style="width: {(timeLeft / 20) * 100}%"></div>
        </div>
      </div>
    </div>


    <div class="retry-actions">
      <div class="action-group">
        <button class="secondary-button" on:click={selectDifferentMethod}>
          Escolher outro método
        </button>

        <button class="tertiary-button" on:click={cancel}>
          Cancelar compra
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .retry-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .retry-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    width: 100%;
    gap: 2rem;
  }

  .retry-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .retry-icon {
    font-size: 4rem;
    animation: shake 2s ease-in-out infinite;
  }

  .payment-refused-message {
    font-size: 1.125rem;
    color: var(--destructive);
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    padding: 0.75rem 1.5rem;
    background: rgba(240, 113, 103, 0.1);
    border-radius: var(--radius);
    border: 1px solid rgba(240, 113, 103, 0.3);
  }

  .retry-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0;
  }

  .retry-reason {
    color: var(--muted-foreground);
    font-size: 1.125rem;
    margin: 0;
    padding: 0.75rem 1.5rem;
    background: var(--muted);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .timer-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .timer-text {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .timer-progress {
    width: 200px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .timer-bar {
    height: 100%;
    background: var(--destructive);
    transition: width 1s ease-out;
    border-radius: 2px;
  }


  .retry-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
  }

  .action-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }


  .secondary-button {
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    min-height: 48px;
    min-width: 250px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .secondary-button:hover {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .tertiary-button {
    background: transparent;
    color: var(--muted-foreground);
    border: 1px solid var(--border);
    min-height: 48px;
    min-width: 250px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .tertiary-button:hover {
    background: var(--muted);
    color: var(--foreground);
  }


  @keyframes shake {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(0);
    }
    10% {
      transform: translateX(-10px);
    }
    30% {
      transform: translateX(10px);
    }
    60% {
      transform: translateX(-5px);
    }
    70% {
      transform: translateX(5px);
    }
  }

  @media (max-width: 640px) {
    .retry-header h1 {
      font-size: 1.75rem;
    }

    .retry-icon {
      font-size: 3rem;
    }

    .payment-refused-message {
      font-size: 1rem;
      padding: 0.5rem 1rem;
    }

    .action-group {
      max-width: 280px;
    }
  }
</style>