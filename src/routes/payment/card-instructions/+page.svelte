<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { paymentService } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import { timerManager } from '$lib/services/timerManager';
  import TimeoutDialog from '$lib/components/shared/TimeoutDialog.svelte';
  import type { TimeoutState } from '$lib/services/timerManager';

  let cart = { items: [], total: 0, subtotal: 0, serviceFee: 0, discount: 0 };
  let paymentMethod = '';
  let isLoading = true;
  let isStartingPayment = false;
  let errorMessage = '';
  
  // Timeout dialog state
  let timeoutState: TimeoutState = {
    showDialog: false,
    showProgressBar: false,
    progressWidth: 100
  };

  onMount(async () => {
    try {
      // Load cart data from API
      const cartData = await cartService.getCart();
      cart = {
        items: cartData.items || [],
        total: cartData.total || 0,
        subtotal: cartData.subtotal || cartData.total || 0,
        serviceFee: cartData.serviceFee || 0,
        discount: cartData.discount || 0
      };

      // Get payment method from URL parameters
      const methodParam = $page.url.searchParams.get('method');
      
      if (!methodParam || !['credit', 'debit'].includes(methodParam)) {
        console.warn('Card instructions page accessed without valid payment method, redirecting...');
        goto('/payment/method-selection');
        return;
      }

      paymentMethod = methodParam;
      isLoading = false;
      
      // Start inactivity timer once loading is complete
      if (typeof window !== 'undefined') {
        startInactivityTimer();
      }

    } catch (error) {
      console.error('Error initializing card instructions:', error);
      errorMessage = 'Erro ao carregar instruções de pagamento';
      isLoading = false;
    }
  });

  onDestroy(() => {
    timerManager.clearTimersByContext('card-instructions');
  });

  async function startPayment() {
    if (isStartingPayment) return; // Prevent double-click
    
    isStartingPayment = true;
    timerManager.clearTimersByContext('card-instructions'); // Clear timer when starting payment
    
    try {
      console.log('Card-instructions: Starting payment for method:', paymentMethod);
      // Start the payment process - let payment service handle navigation
      await paymentService.processPayment(paymentMethod);
      
      console.log('Card-instructions: Payment started, payment service will handle navigation');
      // Don't navigate here - let the payment service handle navigation through its state changes
      
    } catch (error) {
      console.error('Error starting card payment:', error);
      errorMessage = 'Erro ao iniciar pagamento. Tente novamente.';
      isStartingPayment = false;
      if (typeof window !== 'undefined') {
        startInactivityTimer(); // Restart timer if error
      }
    }
  }

  function goBack() {
    if (!isStartingPayment) {
      timerManager.clearTimersByContext('card-instructions');
      goto('/payment/method-selection');
    }
  }


  function startInactivityTimer() {
    timerManager.createInactivityTimerWithDialog(
      'card-instructions',
      () => {
        console.log('Card instructions: Inactivity timeout reached, redirecting to home');
        goto('/');
      },
      (state: TimeoutState) => {
        timeoutState = state;
      },
      () => {
        console.log('Card instructions: User chose to continue session');
      }
    );
  }

  function onContinueSession() {
    timerManager.continueInactivityTimer(
      'card-instructions', 
      (state: TimeoutState) => {
        timeoutState = state;
      },
      () => {
        console.log('Card instructions: Session continued');
      }
    );
  }

  function handleUserActivity() {
    if (!isStartingPayment && typeof window !== 'undefined') {
      // Reset timer on user activity
      startInactivityTimer();
    }
  }

  function getPaymentTitle(method: string): string {
    switch (method) {
      case 'credit':
        return 'Cartão de Crédito';
      case 'debit':
        return 'Cartão de Débito';
      default:
        return 'Cartão';
    }
  }

  function getPaymentIcon(method: string): string {
    switch (method) {
      case 'credit':
        return '💳';
      case 'debit':
        return '🏛️';
      default:
        return '💳';
    }
  }

  function formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
</script>

<svelte:head>
  <title>Instruções de Pagamento - InoBag Sales</title>
</svelte:head>

<!-- Listen for user activity to reset inactivity timer -->
<svelte:window on:mousedown={handleUserActivity} on:keydown={handleUserActivity} on:touchstart={handleUserActivity} />

<div class="full-screen-container">

  <main class="main-content">
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando instruções...</p>
    </div>
  {:else if errorMessage}
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>Erro</h2>
      <p>{errorMessage}</p>
      <button class="retry-button" on:click={goBack}>
        Voltar
      </button>
    </div>
  {:else}
    <div class="instructions-container">

      <section class="section">
        <h2 class="section-title">Instruções para pagamento</h2>
        <p class="section-description">Siga os passos abaixo para completar o pagamento com {paymentMethod === 'credit' ? 'cartão de crédito' : 'cartão de débito'}</p>
        
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Prepare seu cartão</h3>
              <p>Tenha seu cartão {paymentMethod === 'credit' ? 'de crédito' : 'de débito'} em mãos</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Clique em "Iniciar Transação"</h3>
              <p>Pressione o botão verde abaixo para começar o pagamento</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Siga as instruções na tela</h3>
              <p>Após iniciar, você verá instruções para usar o cartão na máquina de pagamento</p>
            </div>
          </div>
        </div>
      </section>

      <div class="terminal-visual">
        <div class="terminal-illustration">
          <div class="terminal-screen">
            <div class="screen-content">
              <div class="screen-icon">💳</div>
              <div class="screen-text">Aguardando...</div>
            </div>
          </div>
          <div class="terminal-buttons">
            <div class="button-row">
              <div class="terminal-button red"></div>
              <div class="terminal-button yellow"></div>
              <div class="terminal-button green"></div>
            </div>
          </div>
          <div class="terminal-slot"></div>
        </div>
        <div class="terminal-label">Terminal de Pagamento</div>
      </div>

      <div class="action-buttons">
        <button class="start-payment-button" on:click={startPayment} disabled={isStartingPayment}>
          {#if isStartingPayment}
            <div class="button-spinner"></div>
            Iniciando...
          {:else}
            <span class="start-icon">▶️</span>
            Iniciar Transação
          {/if}
        </button>
        
        <button class="back-button" on:click={goBack} disabled={isStartingPayment}>
          Voltar
        </button>
      </div>
    </div>
  {/if}
  </main>
</div>

<TimeoutDialog 
  isVisible={timeoutState.showDialog}
  showProgressBar={timeoutState.showProgressBar}
  progressWidth={timeoutState.progressWidth}
  onContinue={onContinueSession}
/>

<style>
  .full-screen-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--background);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
  }

  .instructions-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }

  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
  }

  .section-description {
    color: var(--muted-foreground);
    margin: 0 0 2rem 0;
    font-size: 1rem;
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

  .instructions-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }

  .instructions-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid var(--border);
  }

  .payment-icon {
    font-size: 4rem;
    margin-bottom: 0.5rem;
  }

  .instructions-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0;
  }

  .amount-display {
    background: var(--muted);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    width: 100%;
    max-width: 300px;
  }

  .amount-label {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .amount-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--primary);
  }

  .steps-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: left;
    max-width: 500px;
    margin: 0 auto;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .step-number {
    background: var(--primary);
    color: var(--primary-foreground);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--foreground);
  }

  .step-content p {
    margin: 0;
    color: var(--muted-foreground);
    line-height: 1.4;
  }

  .terminal-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
  }

  .terminal-illustration {
    position: relative;
    background: #2a2a2a;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
  }

  .terminal-screen {
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    width: 200px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .screen-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .screen-icon {
    font-size: 2rem;
  }

  .screen-text {
    color: #00ff00;
    font-family: monospace;
    font-size: 0.875rem;
    text-align: center;
  }

  .terminal-buttons {
    margin-bottom: 0.5rem;
  }

  .button-row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .terminal-button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #555;
  }

  .terminal-button.red {
    background: #ff4444;
  }

  .terminal-button.yellow {
    background: #ffaa00;
  }

  .terminal-button.green {
    background: #44ff44;
  }

  .terminal-slot {
    width: 120px;
    height: 4px;
    background: #333;
    border-radius: 2px;
    margin: 0 auto;
  }

  .terminal-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    margin-top: 2rem;
  }

  .start-payment-button {
    background: #22c55e;
    color: white;
    border: none;
    min-height: 48px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 250px;
    justify-content: center;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .start-payment-button:hover:not(:disabled) {
    background: #16a34a;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
  }

  .start-payment-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .start-icon {
    font-size: 1.25rem;
  }

  .button-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .back-button {
    background: transparent;
    color: var(--muted-foreground);
    border: 2px solid var(--border);
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 200px;
  }

  .back-button:hover:not(:disabled) {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-1px);
  }

  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .card-instructions-page {
      padding: 1rem;
    }

    .instructions-title {
      font-size: 1.5rem;
    }

    .payment-icon {
      font-size: 3rem;
    }

    .amount-value {
      font-size: 1.5rem;
    }

    .steps-container {
      max-width: 100%;
    }

    .step {
      padding: 1rem;
    }

    .terminal-screen {
      width: 160px;
      height: 100px;
    }

    .screen-icon {
      font-size: 1.5rem;
    }

    .start-payment-button {
      min-width: 250px;
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    .back-button {
      min-width: 180px;
    }
  }
</style>