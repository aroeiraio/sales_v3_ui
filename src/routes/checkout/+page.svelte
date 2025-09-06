<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { paymentService, type PaymentMethod, type PaymentResponse } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import { sessionService } from '$lib/services/session';
  import { errorDialogService } from '$lib/services/errorDialog';
  import { offlineService } from '$lib/services/offline';

  let selectedPayment: string = '';
  let isProcessing: boolean = false;
  let paymentStatus: 'idle' | 'processing' | 'success' | 'failed' = 'idle';
  let paymentResult: PaymentResponse | null = null;
  let currentTime = new Date().toLocaleTimeString('pt-BR');

  const paymentMethods = paymentService.getPaymentMethods();
  const cart = cartService.getCart();
  const isOffline = offlineService.isOffline();

  onMount(() => {
    if (browser) {
      // Redirect to cart if cart is empty
      if (!cart.items || cart.items.length === 0) {
        goto('/cart');
        return;
      }

      // Check if session is active
      const session = sessionService.getSession();
      if (!session || !session.isActive) {
        errorDialogService.showError({
          title: 'Sessão Inválida',
          message: 'Sua sessão expirou. Você será redirecionado para o início.',
          actions: [
            {
              label: 'OK',
              action: () => goto('/'),
              variant: 'primary'
            }
          ]
        });
        return;
      }

      // Update time every second
      const timeInterval = setInterval(() => {
        currentTime = new Date().toLocaleTimeString('pt-BR');
      }, 1000);

      return () => clearInterval(timeInterval);
    }
  });

  function selectPaymentMethod(methodId: string) {
    if (isProcessing) return;
    
    selectedPayment = methodId;
    
    // Start payment processing after a short delay
    setTimeout(async () => {
      await processPayment();
    }, 500);
  }

  async function processPayment() {
    if (!selectedPayment) return;
    
    try {
      isProcessing = true;
      paymentStatus = 'processing';
      
      const result = await paymentService.processPayment(selectedPayment);
      paymentResult = result;
      
      if (result.status === 'success') {
        paymentStatus = 'success';
        
        // Redirect to success page after showing result
        setTimeout(() => {
          goto('/');
        }, 3000);
      } else {
        paymentStatus = 'failed';
        
        // Reset after showing error
        setTimeout(() => {
          paymentStatus = 'idle';
          selectedPayment = '';
          isProcessing = false;
        }, 3000);
      }
      
    } catch (error) {
      console.error('Payment failed:', error);
      paymentStatus = 'failed';
      
      setTimeout(() => {
        paymentStatus = 'idle';
        selectedPayment = '';
        isProcessing = false;
      }, 3000);
    }
  }

  function goBack() {
    if (isProcessing) return;
    goto('/cart');
  }

  function formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
</script>

<svelte:head>
  <title>Pagamento - InoBag Sales</title>
</svelte:head>

<div class="checkout-container">
  <header class="header">
    <div class="header-top">
      <div class="status-indicator">
        {#if isOffline}
          <i class="icon-wifi-off"></i>
          <span>Modo Offline</span>
        {:else}
          <i class="icon-wifi"></i>
          <span>Online</span>
        {/if}
      </div>
      <div class="time">{currentTime}</div>
    </div>
    <div class="header-main">
      <button class="back-button" onclick={goBack} disabled={isProcessing}>
        <i class="icon-arrow-left"></i>
        Voltar
      </button>
      <h1 class="page-title">Pagamento</h1>
    </div>
  </header>

  <main class="main-content">
    {#if paymentStatus === 'idle'}
      <section class="section">
        <h2 class="section-title">Escolha a forma de pagamento</h2>
        <div class="payment-methods">
          {#each paymentMethods as method}
            <button 
              class="payment-method"
              class:selected={selectedPayment === method.id}
              onclick={() => selectPaymentMethod(method.id)}
              disabled={isProcessing}
            >
              <i class="icon-{method.icon}"></i>
              <div class="payment-method-info">
                <div class="payment-method-name">{method.name}</div>
                <div class="payment-method-description">{method.description}</div>
              </div>
            </button>
          {/each}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Resumo do Pedido</h2>
        <div class="summary-items">
          {#each cart.items as item}
            <div class="summary-item">
              <div class="item-info">
                <span class="item-quantity">{item.quantity}x</span>
                <span>{item.name}</span>
              </div>
              <span class="item-price">{formatPrice(item.price * item.quantity)}</span>
            </div>
          {/each}
        </div>

        <div class="summary-totals">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          {#if cart.fees && cart.fees > 0}
            <div class="summary-row">
              <span>Taxa de serviço</span>
              <span>{formatPrice(cart.fees)}</span>
            </div>
          {/if}
          {#if cart.discount && cart.discount > 0}
            <div class="summary-row">
              <span>Desconto</span>
              <span>- {formatPrice(cart.discount)}</span>
            </div>
          {/if}
          <div class="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </div>
      </section>
    {:else if paymentStatus === 'processing'}
      <section class="section payment-status active">
        <i class="icon-loader-2 status-icon spinning"></i>
        <div class="status-message">Processando pagamento</div>
        <div class="status-description">Por favor, aguarde enquanto processamos seu pagamento</div>
        <div class="processing-animation">
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
        </div>
      </section>
    {:else if paymentStatus === 'success'}
      <section class="section payment-status active">
        <i class="icon-check-circle status-icon success"></i>
        <div class="status-message">Pagamento aprovado!</div>
        <div class="status-description">
          {paymentResult?.message || 'Seu pagamento foi processado com sucesso'}
        </div>
        {#if paymentResult?.receipt}
          <div class="receipt-info">
            <p><strong>Transação:</strong> {paymentResult.receipt.transactionId}</p>
            <p><strong>Total:</strong> {formatPrice(paymentResult.receipt.total)}</p>
          </div>
        {/if}
      </section>
    {:else if paymentStatus === 'failed'}
      <section class="section payment-status active">
        <i class="icon-x-circle status-icon error"></i>
        <div class="status-message">Pagamento não processado</div>
        <div class="status-description">
          {paymentResult?.message || 'Ocorreu um erro ao processar o pagamento'}
        </div>
        <button class="retry-button" onclick={() => { paymentStatus = 'idle'; selectedPayment = ''; }}>
          Tentar novamente
        </button>
      </section>
    {/if}
  </main>
</div>

<style>
  .checkout-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    background: var(--light-yellow);
    font-family: var(--font-sans);
  }

  .header {
    background: var(--primary);
    color: var(--primary-foreground);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header-top {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.5rem 2rem;
    font-size: 0.875rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-main {
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-button {
    background: transparent;
    border: none;
    color: var(--primary-foreground);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    border-radius: var(--radius);
    transition: all 0.2s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .main-content {
    flex: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    overflow-y: auto;
  }

  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--foreground);
  }

  .payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .payment-method {
    background: var(--background);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .payment-method:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .payment-method.selected {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .payment-method:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .payment-method-info {
    flex: 1;
    text-align: left;
  }

  .payment-method-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .payment-method-description {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .summary-items {
    margin-bottom: 1.5rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-quantity {
    background: var(--muted);
    color: var(--muted-foreground);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
  }

  .item-price {
    font-weight: 500;
  }

  .summary-totals {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    color: var(--muted-foreground);
  }

  .summary-row.total {
    font-weight: 700;
    font-size: 1.25rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    color: var(--foreground);
  }

  .payment-status {
    text-align: center;
    padding: 2rem;
  }

  .status-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    color: var(--primary);
  }

  .status-icon.success {
    color: var(--success);
  }

  .status-icon.error {
    color: var(--error);
  }

  .status-icon.spinning {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .status-message {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--foreground);
  }

  .status-description {
    color: var(--muted-foreground);
    margin-bottom: 1rem;
  }

  .receipt-info {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--background);
    border-radius: var(--radius);
    text-align: left;
    color: var(--foreground);
  }

  .receipt-info p {
    margin: 0.5rem 0;
  }

  .processing-animation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .processing-dot {
    width: 8px;
    height: 8px;
    background: var(--primary);
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  .processing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .processing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(0.5);
      opacity: 0.5;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .retry-button {
    margin-top: 1rem;
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .header-top,
    .header-main {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .main-content {
      padding: 1rem;
    }

    .section {
      padding: 1.5rem;
    }

    .payment-methods {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .section {
      padding: 1rem;
    }

    .payment-method {
      padding: 1rem;
    }

    .summary-item {
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-price {
      align-self: flex-end;
    }
  }

  /* Icon classes */
  .icon-wifi-off::before { content: '📡'; }
  .icon-wifi::before { content: '📶'; }
  .icon-arrow-left::before { content: '←'; }
  .icon-credit-card::before { content: '💳'; }
  .icon-landmark::before { content: '🏛️'; }
  .icon-qr-code::before { content: '📱'; }
  .icon-loader-2::before { content: '⟳'; }
  .icon-check-circle::before { content: '✅'; }
  .icon-x-circle::before { content: '❌'; }
</style>