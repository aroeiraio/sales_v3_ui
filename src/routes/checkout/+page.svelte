<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { ArrowLeft } from 'lucide-svelte';
  import { paymentService, type PaymentMethod, type PaymentResponse, type PaymentState } from '$lib/services/payment';
  import { cartService } from '$lib/services/cart';
  import { sessionService } from '$lib/services/session';
  import { checkoutService, type PaymentBroker, type CheckoutResponse } from '$lib/services/checkout';
  import { errorDialogService } from '$lib/services/errorDialog';

  let selectedPayment: string = '';
  let isProcessing: boolean = false;
  let paymentState: PaymentState = 'idle';
  let paymentResult: PaymentResponse | null = null;
  let currentTime = new Date().toLocaleTimeString('pt-BR');
  let cart: any = { items: [], total: 0, subtotal: 0, serviceFee: 0, discount: 0 };
  let retryCount = 0;
  let maxRetries = 3;
  let checkoutData: CheckoutResponse | null = null;
  let availablePaymentMethods: PaymentBroker[] = [];

  const paymentMethods = paymentService.getPaymentMethods();

  onMount(async () => {
    if (browser) {
      try {
        // Load cart data first
        cart = await cartService.getCart();
        
        // Redirect to cart if cart is empty
        if (!cart.items || cart.items.length === 0) {
          goto('/cart');
          return;
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        goto('/cart');
        return;
      }

      // Perform checkout to get available payment methods
      try {
        console.log('Performing checkout to get available payment methods...');
        checkoutData = await checkoutService.performCheckout();
        availablePaymentMethods = checkoutData.brokers;
        
        console.log('Checkout successful:', {
          availableMethods: availablePaymentMethods.length,
          timestamp: checkoutData.timestamp
        });
        
        // If no payment methods are available, redirect back to cart
        if (availablePaymentMethods.length === 0) {
          errorDialogService.showWarning({
            title: 'Nenhum Método de Pagamento Disponível',
            message: 'Não há métodos de pagamento disponíveis no momento. Tente novamente mais tarde.',
            actions: [
              {
                label: 'Voltar ao Carrinho',
                action: () => goto('/cart'),
                variant: 'primary'
              }
            ]
          });
          return;
        }
      } catch (error) {
        console.error('Checkout failed:', error);
        // Error handling is done in checkoutService
        return;
      }

      // Listen for payment state changes
      paymentService.onStateChange((newState: PaymentState, data?: any) => {
        paymentState = newState;
        
        if (newState === 'success') {
          // Handle successful payment
          paymentResult = {
            transactionId: data?.transactionId || `success-${Date.now()}`,
            status: 'success',
            message: 'Pagamento aprovado com sucesso!',
            receipt: {
              transactionId: data?.transactionId || `success-${Date.now()}`,
              timestamp: new Date().toISOString(),
              items: cart.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              })),
              total: cart.total,
              paymentMethod: paymentService.getPaymentMethodById(selectedPayment)?.name || selectedPayment
            }
          };
          
          // Redirect to success page after showing result
          setTimeout(() => {
            goto('/');
          }, 3000);
        } else if (newState === 'failed') {
          // Handle failed payment
          paymentResult = {
            transactionId: `failed-${Date.now()}`,
            status: 'failed',
            message: data?.error || 'Falha no processamento do pagamento'
          };
          
          // Reset after showing error
          setTimeout(() => {
            resetPaymentState();
          }, 3000);
        } else if (newState === 'retry') {
          // Handle retry state
          paymentResult = {
            transactionId: `retry-${Date.now()}`,
            status: 'failed',
            message: data?.message || 'Pagamento recusado. Você pode tentar novamente.'
          };
        }
      });

      // Update time every second
      const timeInterval = setInterval(() => {
        currentTime = new Date().toLocaleTimeString('pt-BR');
      }, 1000);

      // Cleanup on unmount
      return () => {
        clearInterval(timeInterval);
        paymentService.stopPolling();
      };
    }
  });

  function selectPaymentMethod(methodId: string) {
    if (isProcessing || paymentState !== 'idle') return;
    
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
      
      const result = await paymentService.processPayment(selectedPayment);
      paymentResult = result;
      
    } catch (error) {
      console.error('Payment failed:', error);
      paymentState = 'failed';
      paymentResult = {
        transactionId: `error-${Date.now()}`,
        status: 'failed',
        message: error.message || 'Erro ao iniciar pagamento'
      };
      
      setTimeout(() => {
        resetPaymentState();
      }, 3000);
    }
  }

  function resetPaymentState() {
    paymentState = 'idle';
    selectedPayment = '';
    isProcessing = false;
    paymentResult = null;
    paymentService.resetPayment();
  }

  function retryPayment() {
    if (retryCount >= maxRetries) {
      // Too many retries, go to end screen
      goto('/');
      return;
    }
    
    retryCount++;
    paymentService.retryPayment();
    paymentState = 'idle';
    isProcessing = false;
  }

  function cancelPayment() {
    paymentService.stopPolling();
    paymentService.resetPayment();
    goto('/cart');
  }

  function goBack() {
    if (isProcessing || paymentState !== 'idle') return;
    goto('/cart');
  }

  function formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null || isNaN(price)) {
      return 'R$ 0,00';
    }
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Reset timeout on any user interaction
  function handleUserInteraction() {
    sessionService.resetTimeout();
  }

  // Convert API payment methods to UI format
  function getDisplayPaymentMethods() {
    const displayMethods = [];
    
    for (const broker of availablePaymentMethods) {
      if (!broker.available) continue;
      
      for (const method of broker.methods) {
        let displayMethod = {
          id: `${broker.broker}-${method}`,
          broker: broker.broker,
          method: method,
          name: '',
          description: '',
          icon: ''
        };
        
        // Map broker and method to display names
        if (broker.broker === 'MERCADOPAGO') {
          displayMethod.name = 'PIX';
          displayMethod.description = 'Pagamento instantâneo via QR Code';
          displayMethod.icon = 'qr-code';
        } else if (broker.broker === 'MERCADOPAGO_PINPAD') {
          if (method === 'credit') {
            displayMethod.name = 'Cartão de Crédito';
            displayMethod.description = 'Insira ou aproxime seu cartão';
            displayMethod.icon = 'credit-card';
          } else if (method === 'debit') {
            displayMethod.name = 'Cartão de Débito';
            displayMethod.description = 'Insira ou aproxime seu cartão';
            displayMethod.icon = 'landmark';
          }
        }
        
        if (displayMethod.name) {
          displayMethods.push(displayMethod);
        }
      }
    }
    
    return displayMethods;
  }
</script>

<svelte:head>
  <title>Pagamento - InoBag Sales</title>
</svelte:head>

<svelte:window onclick={handleUserInteraction} onkeydown={handleUserInteraction} />

<div class="checkout-container">
  <header class="header">
    <div class="header-top">
      <div></div>
      <div class="time">{currentTime}</div>
    </div>
    <div class="header-main">
      <button class="back-button" onclick={goBack} disabled={isProcessing}>
        <ArrowLeft size={20} />
        Voltar
      </button>
      <h1 class="page-title">Pagamento</h1>
    </div>
  </header>

  <main class="main-content">
    {#if paymentState === 'idle'}
      <section class="section">
        <h2 class="section-title">Escolha a forma de pagamento</h2>
        <div class="payment-methods">
          {#each getDisplayPaymentMethods() as method}
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
        
        {#if availablePaymentMethods.length === 0}
          <div class="no-payment-methods">
            <p>Carregando métodos de pagamento...</p>
          </div>
        {/if}
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
    {:else if paymentState === 'processing' || paymentState === 'wait'}
      <section class="section payment-status active">
        <div class="status-icon-container">
          <i class="icon-loader-2 status-icon spinning"></i>
        </div>
        <div class="status-message">Processando pagamento</div>
        <div class="status-description">Por favor, aguarde enquanto iniciamos seu pagamento</div>
        <div class="processing-animation">
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
        </div>
        <button class="cancel-payment-button" onclick={cancelPayment}>
          Cancelar pagamento
        </button>
      </section>
    {:else if paymentState === 'insert_tap_card'}
      <section class="section payment-status active card-payment-screen">
        <div class="instructions-header">
          <h2 class="instructions-title">Siga as instruções do Pinpad</h2>
          <p class="instructions-subtitle">Por favor, siga os passos abaixo para completar seu pagamento</p>
        </div>

        <div class="amount-display">
          <div class="amount-label">Valor a pagar</div>
          <div class="amount-value">{formatPrice(cart.total)}</div>
        </div>

        <div class="steps-container">
          <div class="step active">
            <div class="step-icon">
              <i class="icon-power"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">Pressione os Botões</h3>
              <p class="step-description">
                Pressione o botão vermelho e depois o verde para iniciar a operação
              </p>
              <div class="button-indicators">
                <span class="button-indicator button-red">Vermelho</span>
                <span class="button-indicator button-green">Verde</span>
              </div>
            </div>
          </div>

          <div class="step">
            <div class="step-icon">
              <i class="icon-credit-card"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">Aproxime ou Insira seu Cartão</h3>
              <p class="step-description">
                Aproxime seu cartão do leitor ou insira o chip para iniciar o pagamento
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-icon">
              <i class="icon-check-circle"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">Aguarde a Confirmação</h3>
              <p class="step-description">
                Não remova o cartão até que a transação seja concluída
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-icon">
              <i class="icon-arrow-left"></i>
            </div>
            <div class="step-content">
              <h3 class="step-title">Retire seu Cartão</h3>
              <p class="step-description">
                Retire seu cartão do Pinpad quando solicitado
              </p>
            </div>
          </div>
        </div>

        <button class="cancel-payment-button card-cancel-button" onclick={cancelPayment}>
          <i class="icon-x"></i>
          Cancelar Pagamento
        </button>
      </section>
    {:else if paymentState === 'success'}
      <section class="section payment-status active success-state">
        <div class="success-animation">
          <div class="success-circle">
            <i class="icon-check-circle status-icon success"></i>
          </div>
        </div>
        <div class="status-message">Pagamento Aprovado!</div>
        <div class="status-description">
          {paymentResult?.message || 'Seu pagamento foi processado com sucesso'}
        </div>
        {#if paymentResult?.receipt}
          <div class="receipt-info">
            <p><strong>Transação:</strong> {paymentResult.receipt.transactionId}</p>
            <p><strong>Total:</strong> {formatPrice(paymentResult.receipt.total)}</p>
            <p><strong>Método:</strong> {paymentResult.receipt.paymentMethod}</p>
          </div>
        {/if}
      </section>
    {:else if paymentState === 'failed' || paymentState === 'retry'}
      <section class="section payment-status active error-state">
        <div class="error-animation">
          <div class="error-circle">
            <span class="status-icon error">×</span>
          </div>
        </div>
        <div class="status-message">Pagamento Recusado</div>
        <div class="status-description">
          {paymentResult?.message || 'O pagamento não foi aprovado'}
        </div>
        
        {#if paymentState === 'retry' && retryCount < maxRetries}
          <div class="retry-options">
            <button class="retry-button large-button" onclick={retryPayment}>
              Tentar Novamente ({maxRetries - retryCount} tentativas restantes)
            </button>
            <button class="cancel-button large-button" onclick={() => goto('/')}>
              Cancelar
            </button>
          </div>
        {:else}
          <div class="final-options">
            <button class="return-button" onclick={() => goto('/')}>
              Voltar ao Início
            </button>
            <p class="retry-exceeded">Limite de tentativas excedido. Tente novamente mais tarde.</p>
          </div>
        {/if}
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
    min-height: 44px;
    font-size: 1rem;
  }

  .back-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-2px);
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .payment-method {
    background: var(--background);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 500px;
    min-height: 100px;
    font-size: 1.4rem;
    text-align: center;
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
    text-align: center;
  }

  .payment-method-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 1.4rem;
  }

  .payment-method-description {
    font-size: 1.2rem;
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

  .large-button {
    padding: 1.25rem 2.5rem !important;
    font-size: 1.125rem !important;
    font-weight: 600 !important;
    min-width: 200px;
  }

  /* New Payment State Animations */
  .success-animation {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .success-circle {
    width: 120px;
    height: 120px;
    background: var(--success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: successCircleAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .success-circle .status-icon {
    color: white;
    animation: successIconAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes successCircleAnimation {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    30% {
      transform: scale(1.3);
      opacity: 0.9;
    }
    60% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes successIconAnimation {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    60% {
      opacity: 0;
      transform: scale(0);
    }
    80% {
      opacity: 1;
      transform: scale(1.3);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .error-animation {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .error-circle {
    width: 120px;
    height: 120px;
    background: var(--error);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: errorCircleAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .error-circle .status-icon {
    color: white;
    font-size: 10rem;
    line-height: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
    top: -0.1em;
    animation: errorIconAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes errorCircleAnimation {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    30% {
      transform: scale(1.3);
      opacity: 0.9;
    }
    60% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes errorIconAnimation {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    60% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    70% {
      opacity: 1;
      transform: scale(1.3) rotate(-10deg);
    }
    80% {
      opacity: 1;
      transform: scale(1.1) rotate(10deg);
    }
    90% {
      opacity: 1;
      transform: scale(1.05) rotate(-5deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  .card-animation {
    animation: cardFloat 2s ease-in-out infinite;
  }

  @keyframes cardFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: var(--primary);
    border-radius: 50%;
  }

  .status-dot.pulsing {
    animation: pulse 1s infinite;
  }

  .cancel-payment-button,
  .cancel-button,
  .return-button {
    margin-top: 1.5rem;
    background: var(--secondary);
    color: var(--secondary-foreground);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-payment-button:hover,
  .cancel-button:hover,
  .return-button:hover {
    background: var(--muted);
    transform: translateY(-1px);
  }

  .retry-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem auto 0;
    max-width: 400px;
    width: 100%;
  }

  .final-options {
    text-align: center;
    margin-top: 1.5rem;
  }

  .retry-exceeded {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .success-state .status-message {
    color: var(--success);
  }

  .error-state .status-message {
    color: var(--error);
  }

  /* Card Payment Screen Styles */
  .card-payment-screen {
    max-width: 800px;
    margin: 0 auto;
  }

  .instructions-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .instructions-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--foreground);
  }

  .instructions-subtitle {
    font-size: 1.125rem;
    color: var(--muted-foreground);
  }

  .amount-display {
    text-align: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--background);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border);
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
    font-size: 3rem;
    font-weight: 700;
    color: var(--foreground);
    line-height: 1.2;
  }

  .steps-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
    position: relative;
  }

  .steps-container::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 48px;
    bottom: 48px;
    width: 2px;
    background: var(--border);
    z-index: 0;
  }

  .step {
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--background);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;
    position: relative;
  }

  .step.active {
    background: var(--card);
    transform: translateX(0.5rem);
    box-shadow: var(--shadow-md);
  }

  .step-icon {
    width: 48px;
    height: 48px;
    background: var(--muted);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 1;
    border: 2px solid var(--border);
    transition: all 0.3s ease;
    font-size: 20px;
  }

  .step.active .step-icon {
    background: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
    animation: pulse-step 2s infinite;
  }

  @keyframes pulse-step {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 129, 167, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 129, 167, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 129, 167, 0);
    }
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--foreground);
    font-size: 1.125rem;
  }

  .step-description {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .button-indicators {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .button-indicator {
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .button-red {
    background: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }

  .button-green {
    background: rgba(16, 185, 129, 0.1);
    color: rgb(16, 185, 129);
  }

  .card-cancel-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: transparent;
    border: 2px solid var(--border);
    color: var(--error);
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 3rem auto 0;
    max-width: 300px;
    width: 100%;
  }

  .card-cancel-button:hover {
    background: var(--error);
    color: white;
    border-color: var(--error);
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

    /* Card payment screen responsive */
    .instructions-header {
      margin-bottom: 2rem;
    }

    .instructions-title {
      font-size: 1.5rem;
    }

    .amount-display {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .amount-value {
      font-size: 2.5rem;
    }

    .step {
      padding: 1rem;
      gap: 1.5rem;
    }

    .steps-container::before {
      left: 20px;
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

    /* Card payment screen mobile */
    .card-payment-screen {
      padding: 1rem;
    }

    .amount-value {
      font-size: 2rem;
    }

    .step {
      padding: 1rem;
      gap: 1rem;
    }

    .step-icon {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .steps-container::before {
      left: 18px;
    }

    .button-indicators {
      flex-direction: column;
      gap: 0.5rem;
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
  .icon-power::before { content: '🔌'; }
  .icon-x::before { content: '✕'; }
</style>