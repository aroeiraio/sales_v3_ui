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
  import { deliveryService, type DeliveryStatus, type DeliveryStep } from '$lib/services/delivery';
  import ProgressSteps from '$lib/components/ui/ProgressSteps.svelte';

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
  let deliveryStatus: DeliveryStatus | null = null;
  let deliverySteps: DeliveryStep[] = [];
  let countdownTimer: number = 60;
  let qrCodeCountdownInterval: NodeJS.Timeout | null = null;
  let showInstructionsPopup: boolean = false;

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
        
        if (newState === 'show_qrcode') {
          // Handle QR code display
          paymentResult = {
            transactionId: data?.session || `qr-${Date.now()}`,
            status: 'processing',
            message: 'QR Code ready for scanning',
            qrcode_source: data?.qrcode_source
          };
          
          // Start 60-second countdown timer
          startQRCodeCountdown();
        } else if (newState === 'success') {
          // Clear countdown timer on success
          clearQRCodeCountdown();
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
          
          // Start delivery polling
          deliveryService.startPolling((status) => {
            deliveryStatus = status;
            deliverySteps = deliveryService.getStepsForStatus(status);
            
            // Check if delivery is complete
            if (deliveryService.isDeliveryComplete(status)) {
              // Wait 5 seconds then redirect to end screen
              setTimeout(() => {
                deliveryService.stopPolling();
                goto('/end');
              }, 5000);
            }
          });
        } else if (newState === 'failed') {
          // Clear countdown timer on failure
          clearQRCodeCountdown();
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
          // Clear countdown timer on retry
          clearQRCodeCountdown();
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
        clearQRCodeCountdown();
        paymentService.stopPolling();
        deliveryService.stopPolling();
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

  // Debug functions for testing payment states
  function simulateSuccessPayment() {
    paymentState = 'success';
    paymentResult = {
      transactionId: `debug-success-${Date.now()}`,
      status: 'success',
      message: 'Pagamento aprovado com sucesso!',
      receipt: {
        transactionId: `debug-success-${Date.now()}`,
        timestamp: new Date().toISOString(),
        items: cart.items?.map((item: any) => ({
          name: item.title || item.name,
          quantity: item.quantity,
          price: item.price
        })) || [],
        total: cart.total,
        paymentMethod: selectedPayment
      }
    };

    // Start delivery polling for debug
    deliveryService.startPolling((status) => {
      deliveryStatus = status;
      deliverySteps = deliveryService.getStepsForStatus(status);
      
      // Check if delivery is complete
      if (deliveryService.isDeliveryComplete(status)) {
        // Wait 5 seconds then redirect to end screen
        setTimeout(() => {
          deliveryService.stopPolling();
          goto('/end');
        }, 5000);
      }
    });
  }

  function simulateRefusedPayment() {
    retryCount = 0; // Reset retry count
    paymentState = 'retry';
    paymentResult = {
      transactionId: `debug-refused-${Date.now()}`,
      status: 'failed',
      message: ''
    };
  }

  function simulateProcessingPayment() {
    paymentState = 'processing';
    selectedPayment = 'debug-processing';
    isProcessing = true;
    paymentResult = null;
  }

  function simulatePixProcessing() {
    paymentState = 'processing';
    selectedPayment = 'MERCADOPAGO-mercadopago';
    isProcessing = true;
    paymentResult = null;
  }


  function simulateQRCodeScreen() {
    paymentState = 'show_qrcode';
    selectedPayment = 'MERCADOPAGO-mercadopago';
    isProcessing = true;
    paymentResult = {
      transactionId: `qr-${Date.now()}`,
      status: 'processing',
      message: 'QR Code ready for scanning',
      qrcode_source: '/media/customer/sample_qr_code.png'
    };
    startQRCodeCountdown(); // Start the countdown for debug
  }

  function simulateTimeoutScreen() {
    paymentState = 'payment_timeout';
    selectedPayment = 'MERCADOPAGO-mercadopago';
    isProcessing = false;
    paymentResult = null;
  }

  function startQRCodeCountdown() {
    countdownTimer = 60;
    qrCodeCountdownInterval = setInterval(() => {
      countdownTimer--;
      
      if (countdownTimer <= 0) {
        clearQRCodeCountdown();
        // Send cancel to payment service
        paymentService.cancelPayment();
        paymentService.resetPayment();
        // Redirect to payment refused/retry
        paymentState = 'retry';
        paymentResult = {
          transactionId: `timeout-${Date.now()}`,
          status: 'failed',
          message: 'Tempo esgotado para pagamento PIX'
        };
      }
    }, 1000);
  }

  function clearQRCodeCountdown() {
    if (qrCodeCountdownInterval) {
      clearInterval(qrCodeCountdownInterval);
      qrCodeCountdownInterval = null;
    }
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
      {#if paymentState === 'idle' || paymentState === 'retry' || paymentState === 'payment_timeout'}
        <button class="back-button" onclick={goBack} disabled={isProcessing}>
          <ArrowLeft size={28} />
          <span class="back-text">Voltar</span>
        </button>
      {/if}
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

        <!-- Debug buttons for testing payment states -->
        <div class="debug-section">
          <h3 class="debug-title">🧪 Debug - Testar Estados</h3>
          <div class="debug-buttons">
            <button class="debug-button processing" onclick={simulateProcessingPayment}>
              ⏳ Processando (Cartão)
            </button>
            <button class="debug-button pix-processing" onclick={simulatePixProcessing}>
              🔄 Preparando PIX
            </button>
            <button class="debug-button qr-code" onclick={simulateQRCodeScreen}>
              📊 Escaneie QR Code
            </button>
            <button class="debug-button timeout" onclick={simulateTimeoutScreen}>
              ⏰ Timeout PIX
            </button>
            <button class="debug-button success" onclick={simulateSuccessPayment}>
              ✅ Simular Aprovado
            </button>
            <button class="debug-button refused" onclick={simulateRefusedPayment}>
              ❌ Simular Recusado
            </button>
            <button class="debug-button end" onclick={() => goto('/end')}>
              🏁 Ver Tela Final
            </button>
          </div>
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
    {:else if paymentState === 'processing'}
      <section class="section payment-status active processing-screen">
        <div class="processing-header">
          {#if selectedPayment && selectedPayment.includes('MERCADOPAGO') && !selectedPayment.includes('PINPAD')}
            <div class="status-message">Preparando PIX</div>
            <div class="status-description">Gerando QR Code para pagamento instantâneo</div>
          {:else}
            <div class="status-message">Processando pagamento</div>
          {/if}
        </div>

        <div class="payment-details-card">
          <div class="amount-display-processing">
            {#if selectedPayment && selectedPayment.includes('MERCADOPAGO') && !selectedPayment.includes('PINPAD')}
              <div class="amount-label">Valor do PIX</div>
            {:else}
              <div class="amount-label">Valor sendo processado</div>
            {/if}
            <div class="amount-value">{formatPrice(cart.total)}</div>
          </div>
          
          {#if selectedPayment}
            <div class="payment-method-display">
              <div class="method-label">Método de pagamento</div>
              <div class="method-value">
                {#each getDisplayPaymentMethods() as method}
                  {#if method.id === selectedPayment}
                    <i class="icon-{method.icon}"></i>
                    {method.name}
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="processing-steps">
          {#if selectedPayment && selectedPayment.includes('MERCADOPAGO') && !selectedPayment.includes('PINPAD')}
            <h3 class="steps-title">Preparando PIX</h3>
            <div class="step-list">
              <div class="step-item active">
                <div class="step-icon">
                  <i class="icon-check"></i>
                </div>
                <div class="step-text">Validando dados</div>
              </div>
              <div class="step-item active">
                <div class="step-icon processing">
                  <div class="processing-dot small"></div>
                  <div class="processing-dot small"></div>
                  <div class="processing-dot small"></div>
                </div>
                <div class="step-text">Gerando QR Code</div>
              </div>
              <div class="step-item pending">
                <div class="step-icon">
                  <i class="icon-qr-code"></i>
                </div>
                <div class="step-text">Exibindo PIX</div>
              </div>
            </div>
          {:else}
            <h3 class="steps-title">Etapas do processamento</h3>
            <div class="step-list">
              <div class="step-item active">
                <div class="step-icon">
                  <i class="icon-check"></i>
                </div>
                <div class="step-text">Validando dados</div>
              </div>
              <div class="step-item active">
                <div class="step-icon processing">
                  <div class="processing-dot small"></div>
                  <div class="processing-dot small"></div>
                  <div class="processing-dot small"></div>
                </div>
                <div class="step-text">Processando pagamento</div>
              </div>
              <div class="step-item pending">
                <div class="step-icon">
                  <i class="icon-package"></i>
                </div>
                <div class="step-text">Liberando produtos</div>
              </div>
            </div>
          {/if}
        </div>

        <div class="processing-animation">
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
          <div class="processing-dot"></div>
        </div>

        <div class="processing-footer">
          <button class="cart-style-cancel-button" onclick={cancelPayment}>
            Cancelar
          </button>
        </div>
      </section>
    {:else if paymentState === 'show_qrcode'}
      <section class="section payment-status active qr-code-screen">
        <div class="qr-header">
          <div class="status-message">Escaneie o QR Code</div>
          <div class="status-description">Use seu celular para escanear o código PIX</div>
        </div>

        <div class="qr-main-container">
          <div class="qr-code-display">
            {#if paymentResult?.qrcode_source}
              <img 
                src="http://localhost:8090{paymentResult.qrcode_source}" 
                alt="QR Code PIX" 
                class="qr-code-image"
              />
            {:else}
              <div class="qr-code-placeholder">
                <div class="loader-spinner qr-spinner"></div>
                <div class="loading-text">Carregando QR Code...</div>
              </div>
            {/if}
          </div>
          
          <div class="payment-amount-qr">
            <div class="amount-label">Valor do PIX</div>
            <div class="amount-value">{formatPrice(cart.total)}</div>
          </div>
        </div>

        <div class="qr-instructions">
          <button class="instructions-button" onclick={() => showInstructionsPopup = true}>
            Como pagar
          </button>
        </div>

        <div class="qr-footer">
          <div class="countdown-container">
            <div class="countdown-circle">
              <svg class="countdown-svg" width="60" height="60">
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  stroke="var(--border)" 
                  stroke-width="4" 
                  fill="none"
                />
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  stroke="var(--primary)" 
                  stroke-width="4" 
                  fill="none"
                  class="countdown-progress"
                  stroke-dasharray="157"
                  stroke-dashoffset={157 - (countdownTimer / 60) * 157}
                />
              </svg>
              <div class="countdown-text">{countdownTimer}s</div>
            </div>
          </div>
          <p class="qr-status">
            <i class="icon-info"></i>
            Complete o pagamento antes que o tempo expire
          </p>
          <button class="cart-style-cancel-button" onclick={cancelPayment}>
            Cancelar
          </button>
        </div>
      </section>
    {:else if paymentState === 'payment_timeout'}
      <section class="section payment-status active timeout-screen">
        <div class="timeout-content">
          <div class="timeout-icon">
            <i class="icon-clock status-icon error"></i>
          </div>
          <div class="status-message error">Tempo esgotado</div>
          <div class="status-description">
            Desculpe, houve uma falha no processamento do seu pagamento.
            O tempo limite foi excedido.
          </div>
        </div>

        <div class="timeout-actions">
          <button class="cart-style-checkout-button" onclick={() => location.reload()}>
            Tentar novamente
          </button>
          <button class="cart-style-cancel-button" onclick={() => goto('/')}>
            Cancelar
          </button>
        </div>
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
        <div class="status-card">
          <div class="status-icon-container">
            <div class="success-checkmark">
              <div class="checkmark-circle-success"></div>
              <div class="checkmark-icon-success">✓</div>
            </div>
          </div>
          <div class="status-badge success">
            Pagamento Aprovado
          </div>
          <h2 class="status-title">Preparando seus produtos</h2>
          <p class="status-message">
            Aguarde enquanto seus produtos são liberados
          </p>

          {#if deliverySteps.length > 0}
            <ProgressSteps steps={deliverySteps} />
          {/if}
        </div>

        {#if paymentResult?.receipt}
          <div class="transaction-details">
            <h3 class="details-title">Detalhes do Pedido</h3>
            <div class="details-grid">
              <div class="detail-group">
                <span class="detail-label">Número da Transação</span>
                <span class="detail-value">{paymentResult.receipt.transactionId}</span>
              </div>
              <div class="detail-group">
                <span class="detail-label">Data</span>
                <span class="detail-value">{new Date(paymentResult.receipt.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              <div class="detail-group">
                <span class="detail-label">Método de Pagamento</span>
                <span class="detail-value">{paymentResult.receipt.paymentMethod}</span>
              </div>
              <div class="detail-group">
                <span class="detail-label">Valor Total</span>
                <span class="detail-value">{formatPrice(paymentResult.receipt.total)}</span>
              </div>
            </div>
          </div>
        {/if}
      </section>
    {:else if paymentState === 'failed' || paymentState === 'retry'}
      <section class="section payment-status active error-state">
        <div class="error-content-center">
          <div class="error-animation">
            <div class="error-circle">
              <span class="status-icon error">!</span>
            </div>
          </div>
          <div class="status-message">Pagamento Recusado</div>
        </div>
        
        {#if paymentState === 'retry' && retryCount < maxRetries}
          <div class="retry-options">
            <button class="cart-style-checkout-button" onclick={retryPayment}>
              Tentar Novamente
            </button>
            <button class="cart-style-cancel-button" onclick={() => goto('/')}>
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

<!-- Instructions Popup -->
{#if showInstructionsPopup}
  <div class="popup-overlay" onclick={() => showInstructionsPopup = false}>
    <div class="popup-content" onclick={(e) => e.stopPropagation()}>
      <div class="popup-header">
        <h3 class="popup-title">Como pagar com PIX</h3>
        <button class="popup-close" onclick={() => showInstructionsPopup = false}>
          <i class="icon-x"></i>
        </button>
      </div>
      <div class="popup-body">
        <div class="instruction-grid">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-text">Abra o aplicativo do seu banco</div>
          </div>
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-text">Escolha a opção "Pagar com PIX"</div>
          </div>
          <div class="instruction-step">
            <div class="step-number">3</div>
            <div class="step-text">Escaneie o QR Code exibido na tela</div>
          </div>
          <div class="instruction-step">
            <div class="step-number">4</div>
            <div class="step-text">Confirme as informações e valor</div>
          </div>
          <div class="instruction-step">
            <div class="step-number">5</div>
            <div class="step-text">Aguarde a confirmação do pagamento</div>
          </div>
          <div class="instruction-step">
            <div class="step-number">6</div>
            <div class="step-text">Aguarde a liberação dos itens</div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

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
    gap: 0.75rem;
    padding: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    min-height: 44px;
    font-size: 1rem;
  }

  .back-text {
    font-size: 0.875rem;
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

  .main-content:has(.payment-status) {
    justify-content: center;
    align-items: center;
    height: calc(100vh - 120px);
    max-height: calc(100vh - 120px);
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: fit-content;
    max-height: calc(100vh - 160px);
    width: 100%;
    max-width: 800px;
    overflow-y: auto;
  }

  .status-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }

  .status-icon.success {
    color: var(--success);
  }

  .status-icon.error {
    color: var(--error);
  }

  .status-icon.spinning {
    animation: spin 2s linear infinite;
    transform-origin: center center;
  }

  @keyframes spin {
    from { 
      transform: rotate(0deg);
    }
    to { 
      transform: rotate(360deg);
    }
  }

  .status-message {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
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
    min-width: 300px;
    width: 100%;
    max-width: 400px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .retry-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .large-button {
    padding: 1.5rem 3rem !important;
    font-size: 1.25rem !important;
    font-weight: 600 !important;
    min-width: 280px;
    width: 280px;
    margin: 0.75rem 0;
  }

  /* New Payment State Animations */
  .success-animation {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .success-circle {
    width: 180px;
    height: 180px;
    background: var(--success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: successCircleAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .success-circle .status-icon {
    color: white;
    font-size: 12rem;
    line-height: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
    top: -0.1em;
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
    width: 180px;
    height: 180px;
    background: var(--error);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: errorCircleAnimation 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .error-circle .status-icon {
    color: white;
    font-size: 12rem;
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

  .success-content-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 3rem;
  }

  /* Progress-based success screen styles */
  .status-card {
    background: var(--card, #FFFFFF);
    border-radius: var(--radius-lg, 1.25rem);
    padding: 3rem 2rem;
    text-align: center;
    border: 1px solid var(--border, #E2E8F0);
    margin-bottom: 2rem;
  }

  .status-icon-container {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64px;
  }

  .processing-header .status-icon-container {
    color: var(--primary);
  }

  .processing-header .status-icon-container .status-icon {
    width: 80px;
    height: 80px;
    font-size: 64px;
  }

  .loader-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1.5s linear infinite;
    margin: 0 auto;
  }

  .status-icon.pulsing {
    animation: pulse 2s infinite;
    font-size: 48px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius, 1rem);
    font-weight: 500;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .status-badge.success {
    background: transparent;
    color: var(--success, #10B981);
    font-size: 1.75rem;
    border: none;
  }

  .status-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--foreground, #1E293B);
  }

  .status-card .status-message {
    font-size: 1.125rem;
    color: var(--muted-foreground, #64748B);
    margin-bottom: 2rem;
  }

  .transaction-details {
    background: var(--card, #FFFFFF);
    border-radius: var(--radius-lg, 1.25rem);
    padding: 2rem;
    border: 1px solid var(--border, #E2E8F0);
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .details-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border, #E2E8F0);
    color: var(--foreground, #1E293B);
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .detail-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-label {
    font-size: 0.875rem;
    color: var(--muted-foreground, #64748B);
  }

  .detail-value {
    font-weight: 600;
    color: var(--foreground, #1E293B);
  }

  .error-state .status-message {
    color: var(--error);
  }

  .error-content-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 3rem;
  }

  /* Card Payment Screen Styles */
  .card-payment-screen {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
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

  /* Enhanced Processing Screen Styles */
  .processing-screen {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .processing-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .payment-details-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-align: center;
  }

  .amount-display-processing {
    margin-bottom: 1.5rem;
  }

  .amount-display-processing .amount-label {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .amount-display-processing .amount-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--foreground);
    line-height: 1.2;
  }

  .payment-method-display {
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .method-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .method-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .processing-steps {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
  }

  .steps-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--foreground);
  }

  .step-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: var(--radius);
    transition: all 0.3s ease;
  }

  .step-item.active {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .step-item.pending {
    background: var(--muted);
    opacity: 0.6;
  }

  .step-item .step-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .step-item.active .step-icon {
    background: var(--success);
    color: white;
  }

  .step-item.pending .step-icon {
    background: var(--border);
    color: var(--muted-foreground);
  }

  .step-icon.processing {
    background: var(--primary);
    display: flex;
    gap: 2px;
  }

  .step-icon.processing .processing-dot.small {
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  .step-icon.processing .processing-dot.small:nth-child(2) {
    animation-delay: 0.2s;
  }

  .step-icon.processing .processing-dot.small:nth-child(3) {
    animation-delay: 0.4s;
  }

  .step-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--foreground);
  }

  .processing-footer {
    text-align: center;
    margin-top: auto;
  }

  .processing-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--muted);
    border-radius: var(--radius);
  }

  .cancel-payment-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  /* PIX Wait Screen Styles */
  .pix-wait-screen {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }

  .pix-wait-header {
    margin-bottom: 1rem;
  }

  .pix-wait-header .status-message {
    color: var(--primary);
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .qr-code-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin: 2rem 0;
  }

  .qr-code-placeholder {
    position: relative;
    width: 200px;
    height: 200px;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
  }

  .qr-code-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    width: 120px;
    height: 120px;
    opacity: 0.3;
  }

  .qr-pixel {
    width: 100%;
    height: 100%;
    background: var(--muted);
    border-radius: 2px;
  }

  .qr-pixel.active {
    background: var(--foreground);
  }

  .qr-code-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    color: var(--primary);
    animation: pulse 2s infinite;
  }

  .amount-display-pix {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    min-width: 200px;
  }

  .amount-display-pix .amount-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .amount-display-pix .amount-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--primary);
  }

  .pix-instructions {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
  }

  .pix-instructions .instructions-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--foreground);
  }

  .instruction-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .instruction-step {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .step-number {
    width: 32px;
    height: 32px;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .step-text {
    font-size: 0.875rem;
    color: var(--foreground);
  }

  .pix-footer {
    margin-top: auto;
  }

  .waiting-animation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .pix-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--muted);
    border-radius: var(--radius);
  }

  /* QR Code Screen Styles */
  .qr-code-screen {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .qr-header {
    margin-bottom: 1rem;
  }

  .qr-main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin: 2rem 0;
  }

  .qr-code-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    width: 280px;
    margin: 0 auto;
  }

  .qr-code-image {
    max-width: 280px;
    max-height: 280px;
    border: 4px solid var(--primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    background: white;
    padding: 1rem;
  }

  .qr-code-placeholder {
    width: 280px;
    height: 280px;
    border: 4px dashed var(--border);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--muted);
  }

  .qr-placeholder-icon {
    font-size: 80px;
    color: var(--muted-foreground);
    opacity: 0.5;
  }

  .qr-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid var(--border);
    border-top: 6px solid var(--primary);
  }

  .loading-text {
    margin-top: 1rem;
    color: var(--muted-foreground);
    font-size: 1rem;
  }

  .payment-amount-qr {
    background: var(--card);
    border: 2px solid var(--primary);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    min-width: 250px;
  }

  .payment-amount-qr .amount-label {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .payment-amount-qr .amount-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
  }

  .instruction-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .qr-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .countdown-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .countdown-circle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-svg {
    transform: rotate(-90deg);
  }

  .countdown-progress {
    transition: stroke-dashoffset 1s linear;
  }

  .countdown-text {
    position: absolute;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--primary);
  }

  .qr-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: var(--primary);
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(0, 129, 167, 0.1);
    border-radius: var(--radius);
    font-weight: 500;
  }

  /* Timeout Screen Styles */
  .timeout-screen {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
    height: fit-content;
    max-height: calc(100vh - 160px);
    justify-content: center;
    overflow-y: auto;
  }

  .timeout-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .timeout-icon {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(240, 113, 103, 0.1);
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .timeout-icon .status-icon {
    font-size: 48px;
    color: var(--destructive);
  }

  .status-message.error {
    color: var(--destructive);
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .timeout-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
    margin: 0 auto;
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
  .icon-package::before { content: '📦'; }
  .icon-check::before { content: '✓'; }
  .icon-info::before { content: 'ℹ️'; }
  .icon-clock::before { content: '⏰'; }

  /* Debug buttons styles */
  .debug-section {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 2px dashed #ffc107;
    border-radius: var(--radius, 0.5rem);
  }

  .debug-title {
    font-size: 1rem;
    font-weight: 600;
    color: #856404;
    margin-bottom: 1rem;
    text-align: center;
  }

  .debug-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .debug-button {
    padding: 0.75rem 1rem;
    border-radius: var(--radius, 0.5rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 0.875rem;
  }

  .debug-button.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .debug-button.success:hover {
    background: #c3e6cb;
    transform: translateY(-1px);
  }

  .debug-button.refused {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .debug-button.refused:hover {
    background: #f5c6cb;
    transform: translateY(-1px);
  }

  .debug-button.processing {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  .debug-button.processing:hover {
    background: #ffeaa7;
    transform: translateY(-1px);
  }

  .debug-button.pix-processing {
    background: #f3e5f5;
    color: #4a148c;
    border: 1px solid #e1bee7;
  }

  .debug-button.pix-processing:hover {
    background: #e1bee7;
    transform: translateY(-1px);
  }


  .debug-button.qr-code {
    background: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  .debug-button.qr-code:hover {
    background: #c8e6c9;
    transform: translateY(-1px);
  }

  .debug-button.timeout {
    background: #fff3e0;
    color: #ef6c00;
    border: 1px solid #ffcc02;
  }

  .debug-button.timeout:hover {
    background: #ffcc02;
    transform: translateY(-1px);
  }

  .debug-button.end {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }

  .debug-button.end:hover {
    background: #bee5eb;
    transform: translateY(-1px);
  }

  /* Cart-style buttons */
  .cart-style-checkout-button {
    background: var(--bittersweet);
    color: white;
    border: none;
    width: 100%;
    padding: 1rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    min-height: var(--touch-target);
  }

  .cart-style-checkout-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .cart-style-cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid var(--border);
    min-width: 300px;
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    min-height: var(--touch-target);
  }

  .cart-style-cancel-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  /* Instructions button */
  .instructions-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    min-width: 300px;
    width: 100%;
    max-width: 400px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .instructions-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Success screen overflow fix */
  .success-state {
    overflow: hidden;
  }

  .success-state .status-card {
    overflow: hidden;
  }

  /* Success checkmark animation (matching end screen) */
  .success-checkmark {
    width: 120px;
    height: 120px;
    margin: 2rem auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
  }

  .checkmark-circle-success {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid var(--success, #10B981);
    background: var(--card, white);
    position: absolute;
    top: 0;
    left: 0;
    animation: circle-scale-success 0.4s ease-out forwards;
    aspect-ratio: 1 / 1;
  }

  .checkmark-icon-success {
    font-size: 4.5rem;
    color: var(--success, #10B981);
    font-weight: bold;
    z-index: 1;
    position: relative;
    animation: checkmark-appear-success 0.3s ease-out 0.6s forwards;
    opacity: 0;
    transform: scale(0);
  }

  @keyframes circle-scale-success {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes checkmark-appear-success {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-45deg);
    }
    50% {
      transform: scale(1.2) rotate(0deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  /* Popup styles */
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .popup-content {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 0;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .popup-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--foreground);
  }

  .popup-close {
    background: transparent;
    border: none;
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    font-size: 1.125rem;
  }

  .popup-close:hover {
    background: var(--muted);
    color: var(--foreground);
  }

  .popup-body {
    padding: 2rem;
    overflow-y: auto;
    max-height: 60vh;
  }

  .popup-overlay .instruction-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .popup-overlay .instruction-step {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--muted);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .popup-overlay .step-number {
    width: 32px;
    height: 32px;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .popup-overlay .step-text {
    font-size: 1rem;
    color: var(--foreground);
  }
</style>