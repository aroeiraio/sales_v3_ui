<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { paymentService } from '$lib/services/payment';
  import { deliveryService } from '$lib/services/delivery';

  let paymentData: any = null;
  let deliverySteps: any[] = [];
  let deliveryStatus: any = null;
  let isDeliveryComplete = false;
  let redirectTimeout: number | null = null;
  
  onMount(async () => {
    // Ensure payment polling is stopped when reaching success page
    console.log('Payment success page: Ensuring payment polling is stopped');
    paymentService.stopPolling();
    
    // Get payment data from URL params (set by payment navigation service)
    const urlParams = new URLSearchParams($page.url.search);
    const transactionId = urlParams.get('transactionId') || `success-${Date.now()}`;
    const amount = parseFloat(urlParams.get('amount') || '0');
    
    paymentData = {
      transactionId,
      amount,
      timestamp: new Date().toISOString(),
      paymentMethod: 'PIX' // or from service
    };

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
        console.log('Payment success page: Delivery complete, redirecting to end screen');
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
        }
        setTimeout(() => {
          console.log('Payment success page: Executing redirect to /end');
          goto('/end');
        }, 2000); // Give user time to see completion
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
    <div class="success-animation">
      <div class="success-checkmark">
        <div class="checkmark-circle">
          <div class="checkmark">✓</div>
        </div>
        <div class="success-pulse"></div>
      </div>
    </div>

    <div class="success-content">
      <div class="success-header">
        <h1 class="success-title">Pagamento Aprovado!</h1>
        <p class="success-subtitle">Sua compra foi processada com sucesso</p>
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

    <div class="success-actions">
      <button class="continue-button" on:click={() => goto('/end')}>
        {#if isDeliveryComplete}
          Finalizar
        {:else}
          Ver Entrega
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .success-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1rem;
  }

  .success-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 800px;
    width: 100%;
    gap: 1.5rem;
  }

  .success-animation {
    position: relative;
    margin-bottom: 1rem;
  }

  .success-checkmark {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .checkmark-circle {
    width: 70px;
    height: 70px;
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
    font-size: 2rem;
    font-weight: bold;
    line-height: 1;
    animation: checkmark-draw 0.5s ease-out 0.3s both;
  }

  .success-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70px;
    height: 70px;
    border: 2px solid var(--primary);
    border-radius: 50%;
    animation: success-pulse 2s ease-out infinite;
  }

  .success-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .success-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .success-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0;
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
    background: var(--muted);
    border-radius: var(--radius-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
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
    width: 100%;
    max-width: 300px;
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
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
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
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 200px;
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

  @media (max-width: 640px) {
    .success-title {
      font-size: 1.75rem;
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
      padding: 0.75rem;
    }
  }
</style>