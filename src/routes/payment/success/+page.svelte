<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { paymentService } from '$lib/services/payment';
  import { deliveryService } from '$lib/services/delivery';
  import { cart } from '$lib/stores/cart';

  let paymentData: any = null;
  let deliverySteps: any[] = [];
  let deliveryStatus: any = null;
  let isDeliveryComplete = false;
  let redirectTimeout: number | null = null;

  // Reactive payment data - updates when cart changes
  $: if (paymentData && $cart) {
    if (paymentData.amount === 0 && $cart.total > 0) {
      console.log('Payment success: Updating amount from cart total:', $cart.total);
      paymentData = {
        ...paymentData,
        amount: $cart.total
      };
    }
  }
  
  onMount(async () => {
    // Ensure payment polling is stopped when reaching success page
    console.log('Payment success page: Ensuring payment polling is stopped');
    paymentService.stopPolling();
    
    // Get payment data from URL params (set by payment navigation service)
    const urlParams = new URLSearchParams($page.url.search);
    const transactionId = urlParams.get('transactionId') || `success-${Date.now()}`;

    // Try to get amount from URL params first, then fallback to cart total
    let amount = parseFloat(urlParams.get('amount') || '0');
    const currentCart = $cart;

    console.log('Payment success: URL amount:', urlParams.get('amount'));
    console.log('Payment success: Parsed amount:', amount);
    console.log('Payment success: Cart total:', currentCart.total);
    console.log('Payment success: Cart items:', currentCart.items);
    console.log('Payment success: Cart items length:', currentCart.items?.length);
    console.log('Payment success: Cart object:', currentCart);

    if (amount === 0) {
      // Fallback to cart total if URL param is missing or zero
      amount = currentCart.total || 0;
      console.log('Payment success: Amount from URL was 0, using cart total:', amount);

      // If cart is also empty, try sessionStorage backups
      if (amount === 0 && typeof window !== 'undefined') {
        console.log('Payment success: Amount is 0, trying sessionStorage backups...');

        // Try multiple sessionStorage keys
        const storageKeys = ['lastPaymentAmount', 'paymentStartAmount', 'cartTotal'];

        for (const key of storageKeys) {
          const storedAmount = sessionStorage.getItem(key);
          if (storedAmount && parseFloat(storedAmount) > 0) {
            amount = parseFloat(storedAmount);
            console.log(`Payment success: Using stored amount from ${key}:`, amount);
            // Don't clear immediately, keep as backup
            break;
          }
        }

        // Final fallback: try localStorage
        if (amount === 0) {
          const lastCartTotal = localStorage.getItem('lastCartTotal');
          if (lastCartTotal && parseFloat(lastCartTotal) > 0) {
            amount = parseFloat(lastCartTotal);
            console.log('Payment success: Using localStorage lastCartTotal:', amount);
          }
        }
      }
    } else {
      console.log('Payment success: Using amount from URL:', amount);
    }
    
    paymentData = {
      transactionId,
      amount,
      timestamp: new Date().toISOString(),
      paymentMethod: 'PIX' // or from service
    };

    console.log('Payment success: Final paymentData:', paymentData);
    console.log('Payment success: Final amount being used:', amount);

    // Start delivery status polling like checkout page does
    console.log('Payment success page: Starting delivery polling');
    deliveryService.startPolling((status) => {
      deliveryStatus = status;
      deliverySteps = deliveryService.getStepsForStatus(status);
      isDeliveryComplete = deliveryService.isDeliveryComplete(status);
      
      console.log('Payment success page - Delivery status update:', {
        status,
        deliverySteps,
        isDeliveryComplete
      });
      
      // If delivery is complete, redirect to end screen
      if (isDeliveryComplete) {
        console.log('Payment success page: Delivery complete, waiting 5 seconds before redirecting to end screen');
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
        }
        setTimeout(() => {
          console.log('Payment success page: Executing redirect to /end after 5 second delay');
          goto('/end');
        }, 5000); // Wait 5 seconds after delivery completion
      }
    }, 2000); // Poll every 2 seconds

    // Fallback: Auto-redirect to end screen after 30 seconds if delivery doesn't complete
    redirectTimeout = setTimeout(() => {
      console.warn('Delivery polling timeout - redirecting to end screen');
      goto('/end');
    }, 30000);
  });

  onDestroy(() => {
    // Clean up delivery polling and timeout
    deliveryService.stopPolling();
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
      redirectTimeout = null;
    }
  });

  function formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Pagamento Aprovado - InoBag Sales</title>
</svelte:head>

<div class="success-page">
  <div class="success-container">
    <div class="success-content">
      <div class="success-header">
        <div class="title-row">
          <div class="success-checkmark">
            <div class="checkmark-circle">
              <div class="checkmark">✓</div>
            </div>
            <div class="success-pulse"></div>
          </div>
          <h1 class="success-title">Pagamento Aprovado!</h1>
        </div>
        <p class="success-subtitle">Sua compra foi processada com sucesso</p>
      </div>

      <div class="delivery-info">
        <div class="delivery-icon">📦</div>
        <h3>
          {#if isDeliveryComplete}
            Entrega Concluída!
          {:else if deliveryStatus}
            {deliveryStatus.message}
          {:else}
            Preparando sua entrega
          {/if}
        </h3>
        <p>
          {#if isDeliveryComplete}
            Seus produtos foram entregues com sucesso. Retire-os no compartimento de entrega.
          {:else}
            Seus produtos estão sendo separados e serão entregues em instantes.
          {/if}
        </p>
        
        {#if deliverySteps && deliverySteps.length > 0}
          <div class="delivery-steps">
            {#each deliverySteps as step}
              <div class="delivery-step" class:completed={step.status === 'completed'} class:active={step.status === 'active'}>
                <div class="step-indicator">
                  {#if step.status === 'completed'}
                    ✓
                  {:else if step.status === 'active'}
                    ⏳
                  {:else}
                    ⭕
                  {/if}
                </div>
                <div class="step-content">
                  <div class="step-title">{step.title}</div>
                  <div class="step-description">{step.description}</div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="delivery-progress">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <span class="progress-text">
              {#if deliveryStatus}
                {deliveryStatus.message}
              {:else}
                Preparando pedido...
              {/if}
            </span>
          </div>
        {/if}
      </div>

      {#if paymentData}
        <div class="payment-details">
          <div class="detail-row">
            <span class="label">ID da Transação:</span>
            <span class="value">{paymentData.transactionId}</span>
          </div>
          <div class="detail-row">
            <span class="label">Valor Pago:</span>
            <span class="value amount">{formatPrice(paymentData.amount)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Data e Hora:</span>
            <span class="value">{formatDate(paymentData.timestamp)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Método:</span>
            <span class="value">{paymentData.paymentMethod}</span>
          </div>
        </div>
      {/if}

      {#if !isDeliveryComplete}
        <div class="auto-redirect">
          <p>
            {#if deliveryStatus}
              Aguardando conclusão da entrega...
            {:else}
              Você será redirecionado automaticamente para a tela de entrega em alguns segundos...
            {/if}
          </p>
          <div class="redirect-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .success-page {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 80vh;
    padding: 1rem;
    padding-top: 2rem;
  }

  .success-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 600px; /* Match wider content containers (delivery-info, payment-details) */
    gap: 1rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .success-checkmark {
    position: relative;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .checkmark-circle {
    width: 50px;
    height: 50px;
    background: var(--primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    animation: success-bounce 0.8s ease-out;
  }

  .checkmark {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
    animation: checkmark-draw 0.5s ease-out 0.3s both;
  }

  .success-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border: 2px solid var(--primary);
    border-radius: 50%;
    animation: success-pulse 2s ease-out infinite;
  }

  .success-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .success-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .success-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0;
    text-align: left;
  }

  .success-subtitle {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    margin: 0;
  }

  .payment-details {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 600px; /* Match delivery-info width */
    margin: 0 auto;
    box-sizing: border-box;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .label {
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .value {
    color: var(--foreground);
    font-weight: 600;
  }

  .value.amount {
    color: var(--primary);
    font-size: 1.125rem;
  }

  .delivery-info {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    width: 600px; /* Wider than delivery steps for better content display */
    margin: 0 auto;
    min-height: 200px; /* Ensure consistent minimum height */
    box-sizing: border-box;
  }

  .delivery-icon {
    font-size: 2rem;
  }

  .delivery-info h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--foreground);
    margin: 0;
  }

  .delivery-info p {
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.5;
  }

  .delivery-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 500px; /* Fixed width instead of max-width */
    margin: 0 auto;
    min-height: 120px; /* Consistent height with delivery-steps */
    justify-content: center;
    padding: 0.75rem; /* Match delivery-step padding for visual consistency */
    box-sizing: border-box;
    background: var(--card); /* Match delivery-info background */
    border-radius: var(--radius-lg); /* Match delivery-info border radius */
    border: 1px solid var(--border); /* Match delivery-info border */
    box-shadow: var(--shadow-sm); /* Match delivery-info shadow */
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 4px;
    animation: progress-fill 3s ease-out infinite;
  }

  .progress-text {
    font-size: 0.875rem;
    color: var(--muted-foreground);
  }

  .delivery-steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 500px; /* Fixed width to match delivery-progress */
    margin: 0 auto;
    min-height: 120px; /* Consistent height with progress bar */
    justify-content: center;
    padding: 0.75rem; /* Consistent padding with progress container */
    box-sizing: border-box;
    /* Remove background/border from outer container - styling is on individual steps */
  }

  .delivery-step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius);
    background: var(--card);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden; /* Prevent content from expanding beyond container */
  }

  .delivery-step.completed {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--success);
  }

  .delivery-step.active {
    background: rgba(0, 129, 167, 0.1);
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(0, 129, 167, 0.1);
  }

  .step-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .delivery-step.completed .step-indicator {
    background: var(--success);
    color: white;
  }

  .delivery-step.active .step-indicator {
    background: var(--primary);
    color: white;
  }

  .delivery-step:not(.completed):not(.active) .step-indicator {
    background: var(--muted);
    color: var(--muted-foreground);
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 600;
    color: var(--foreground);
    margin-bottom: 0.25rem;
  }

  .step-description {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    line-height: 1.4;
  }

  .auto-redirect {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .auto-redirect p {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    margin: 0;
  }

  .redirect-dots {
    display: flex;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: var(--muted-foreground);
    border-radius: 50%;
    animation: dot-bounce 1.4s ease-in-out infinite both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }

  .success-actions {
    margin-top: 1rem;
  }

  .continue-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    min-height: 48px;
    min-width: 250px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .continue-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @keyframes success-bounce {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes checkmark-draw {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes success-pulse {
    0% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.6);
    }
  }

  @keyframes progress-fill {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }

  @keyframes dot-bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  @media (max-width: 768px) {
    .success-page {
      padding: 1rem;
    }

    .payment-details {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
  }

  @media (max-width: 640px) {
    .title-row {
      flex-direction: column;
      gap: 0.75rem;
    }

    .success-title {
      font-size: 1.75rem;
      text-align: center;
    }

    .success-subtitle {
      font-size: 1rem;
    }

    .success-checkmark {
      width: 70px;
      height: 70px;
    }

    .checkmark-circle {
      width: 60px;
      height: 60px;
    }

    .checkmark {
      font-size: 1.75rem;
    }

    .success-pulse {
      width: 60px;
      height: 60px;
    }

    .delivery-info,
    .payment-details {
      padding: 1rem;
    }
  }
</style>