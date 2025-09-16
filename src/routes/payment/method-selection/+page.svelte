<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { paymentService } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import { checkoutService, type PaymentBroker } from '$lib/services/checkout';
  import { getDisplayPaymentMethods } from '$lib/utils/checkout';
  import { timerManager } from '$lib/services/timerManager';
  import PaymentMethodGrid from '$lib/components/payment/PaymentMethodGrid.svelte';
  import TimeoutDialog from '$lib/components/shared/TimeoutDialog.svelte';
  import type { TimeoutState } from '$lib/services/timerManager';

  let availablePaymentMethods: PaymentBroker[] = [];
  let cart = { items: [], total: 0, subtotal: 0, serviceFee: 0, discount: 0 };
  let isLoading = true;
  let errorMessage = '';
  let isNavigating = false;
  let currentTime = '';
  let timeInterval: number;
  
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

      try {
        // Try to load available payment methods by performing checkout
        console.log('Loading payment methods from checkout API...');
        const checkoutData = await checkoutService.performCheckout();
        availablePaymentMethods = checkoutData.brokers || [];
        console.log('Loaded payment methods from API:', availablePaymentMethods);
        
        if (availablePaymentMethods.length === 0) {
          throw new Error('No payment methods returned from API');
        }
      } catch (checkoutError) {
        console.warn('Checkout API failed, using fallback payment methods:', checkoutError);
        
        // Fallback to default payment methods from payment service
        availablePaymentMethods = [
          {
            available: true,
            broker: 'MERCADOPAGO_PINPAD',
            methods: ['credit', 'debit']
          },
          {
            available: true,
            broker: 'MERCADOPAGO',
            methods: ['pix']
          }
        ];
        console.log('Using fallback payment methods:', availablePaymentMethods);
      }

    } catch (error) {
      console.error('Error loading payment method selection:', error);
      errorMessage = 'Erro ao carregar métodos de pagamento. Tente novamente.';
    } finally {
      isLoading = false;
      // Update time display
      updateTime();
      // Start time interval
      timeInterval = setInterval(updateTime, 1000);
      // Start inactivity timer once loading is complete
      if (typeof window !== 'undefined') {
        startInactivityTimer();
      }
    }
  });

  onDestroy(() => {
    timerManager.clearTimersByContext('method-selection');
    if (timeInterval) {
      clearInterval(timeInterval);
    }
  });

  async function selectPaymentMethod(methodId: string) {
    try {
      if (isNavigating) return; // Prevent double-selection
      
      console.log('Selected payment method:', methodId);
      isNavigating = true;
      
      // Clear inactivity timer since user is actively selecting
      timerManager.clearTimersByContext('method-selection');
      
      // For PIX payments, process and let the payment service handle navigation
      if (methodId === 'pix' || methodId.includes('MERCADOPAGO-pix') || methodId.includes('pix')) {
        console.log('PIX payment selected, processing...');
        await paymentService.processPayment(methodId);
        // PIX payments will be handled by the payment service navigation
        return;
      }
      
      // For card payments (credit/debit), go to processing first
      if (methodId === 'credit' || methodId === 'debit' || 
          methodId.includes('PINPAD-credit') || methodId.includes('PINPAD-debit')) {
        
        // Start payment and go to processing page
        await paymentService.processPayment(methodId);
        
        // Navigate to processing page
        goto('/payment/processing');
        return;
      }
      
      // For other payment methods, process and go to processing
      await paymentService.processPayment(methodId);
      
      // Navigate to processing page
      goto('/payment/processing');
      
    } catch (error) {
      console.error('Error selecting payment method:', error);
      errorMessage = 'Erro ao iniciar pagamento. Tente novamente.';
      isNavigating = false;
      // Restart inactivity timer if there's an error
      if (typeof window !== 'undefined') {
        startInactivityTimer();
      }
    }
  }

  function startInactivityTimer() {
    timerManager.createInactivityTimerWithDialog(
      'method-selection',
      () => {
        console.log('Method selection: Inactivity timeout reached, redirecting to home');
        goto('/');
      },
      (state: TimeoutState) => {
        timeoutState = state;
      },
      () => {
        console.log('Method selection: User chose to continue session');
      }
    );
  }

  function onContinueSession() {
    timerManager.continueInactivityTimer(
      'method-selection', 
      (state: TimeoutState) => {
        timeoutState = state;
      },
      () => {
        console.log('Method selection: Session continued');
      }
    );
  }

  function handleUserActivity() {
    if (!isNavigating && typeof window !== 'undefined') {
      // Reset timer on user activity
      startInactivityTimer();
    }
  }

  function updateTime() {
    const now = new Date();
    currentTime = now.toLocaleTimeString('pt-BR');
  }

  function goBack() {
    if (!isNavigating) {
      timerManager.clearTimersByContext('method-selection');
      goto('/');
    }
  }
</script>

<svelte:head>
  <title>Método de Pagamento - InoBag Sales</title>
</svelte:head>

<!-- Listen for user activity to reset inactivity timer -->
<svelte:window on:click={handleUserActivity} on:keydown={handleUserActivity} />

<div class="full-screen-container">

  <main class="main-content">
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando métodos de pagamento...</p>
    </div>
  {:else if errorMessage}
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h2>Erro</h2>
      <p>{errorMessage}</p>
      <button class="retry-button" on:click={() => window.location.reload()}>
        Tentar Novamente
      </button>
    </div>
  {:else}
    <div class="payment-container">
      <div class="payment-methods-section">
        <h2 class="section-title">Escolha o método de pagamento</h2>
        <p class="section-description">Selecione como você gostaria de pagar sua compra</p>
        
        <PaymentMethodGrid 
          paymentMethods={getDisplayPaymentMethods(availablePaymentMethods)}
          onSelect={selectPaymentMethod}
        />
      </div>

      <div class="summary-section">
        <h2 class="summary-title">Resumo do Pedido</h2>
        
        {#each cart.items as item}
          <div class="summary-row">
            <span>{item.quantity}x {item.name}</span>
            <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
          </div>
        {/each}
        
        <div class="summary-row">
          <span>Itens ({cart.items.reduce((total, item) => total + item.quantity, 0)})</span>
          <span>R$ {cart.subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        
        {#if cart.serviceFee > 0}
          <div class="summary-row">
            <span>Taxa de serviço</span>
            <span>R$ {cart.serviceFee.toFixed(2).replace('.', ',')}</span>
          </div>
        {/if}
        
        {#if cart.discount > 0}
          <div class="summary-row discount">
            <span>Desconto</span>
            <span>-R$ {cart.discount.toFixed(2).replace('.', ',')}</span>
          </div>
        {/if}
        
        <div class="summary-row total">
          <span>Total</span>
          <span>R$ {cart.total.toFixed(2).replace('.', ',')}</span>
        </div>
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
    width: 100%; /* Take full width of payment layout's container */
    align-self: stretch; /* Override payment layout's align-items: center */
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    min-height: auto;
    padding: 0;
    width: 100%; /* Take full width of the payment layout's container */
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 50vh;
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

  .payment-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }

  .summary-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    width: 100%; /* Ensure full width within container */
  }

  .summary-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--foreground);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    color: var(--muted-foreground);
    font-size: 0.9rem;
  }

  .summary-row:last-of-type {
    border-bottom: none;
  }

  .summary-row.discount {
    color: var(--destructive);
  }

  .summary-row.total {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--foreground);
    border-top: 2px solid var(--border);
    margin-top: 0.5rem;
    padding-top: 0.75rem;
  }

  .payment-methods-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
    width: 100%; /* Ensure full width within container */
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
  }

  .section-description {
    color: var(--muted-foreground);
    margin: 0 0 1.5rem 0;
    font-size: 0.9rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive design */
  @media (max-width: 768px) {    
    .summary-section,
    .payment-methods-section {
      padding: 1rem;
    }
    
    .section-title,
    .summary-title {
      font-size: 1.1rem;
    }

    .summary-row {
      font-size: 0.85rem;
    }
  }

  @media (max-width: 480px) {
    .payment-container {
      gap: 1.5rem;
    }
  }
</style>