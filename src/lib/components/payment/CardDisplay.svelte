<script lang="ts">
  export let cart: { total: number };
  export let paymentMethod: string;
  export let countdown: string; // Formatted countdown (MM:SS)
  export let countdownSeconds: number; // Raw seconds for progress calculation
  export let onCancel: () => void;

  // Payment flow states
  let currentStep = 2; // Start directly at step 2 (terminal instructions)
  let showButtonInstructions = true; // Show terminal instructions immediately
  let currentButtonStep = 1; // 1: Press red, 2: Press green
  let buttonStepCompleted = false;

  function formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
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
        return '💳';
      default:
        return '💳';
    }
  }

  // Calculate progress for 180 seconds (100% to 0%)
  $: progressPercent = (countdownSeconds / 180) * 100;

  // Skip card insertion step - go directly to terminal instructions

  // Simulate button step progression
  setTimeout(() => {
    if (currentStep === 2 && currentButtonStep === 1) {
      currentButtonStep = 2; // Move to green button step
    }
  }, 8000); // Progress to step 2 after 8 seconds

  setTimeout(() => {
    if (currentStep === 2) {
      buttonStepCompleted = true;
      // Stay on step 2, don't move to processing step
    }
  }, 12000); // Complete button steps after 12 seconds

  function getCurrentStepMessage(): string {
    switch (currentStep) {
      case 2:
        return 'Siga as instruções no terminal de pagamento';
      default:
        return 'Aguardando...';
    }
  }
</script>

<section class="card-display">
  <div class="card-header">
    <div class="header-title-row">
      <div class="payment-icon">{getPaymentIcon(paymentMethod)}</div>
      <div class="status-message">{getPaymentTitle(paymentMethod)}</div>
    </div>
    <div class="status-description">
      {getCurrentStepMessage()}
    </div>
  </div>

  <div class="card-main-container">
    <!-- Show button instructions with point_buttons.png -->
    <div class="button-instructions-section">
      <div class="instructions-header">
        <h3 class="instructions-title">Instruções no Terminal</h3>
      </div>
      
      <div class="button-image-container">
        <img src="/point_buttons.png" alt="Instruções dos botões do terminal" class="button-instructions-image" />
      </div>
      
      <div class="steps-description">
        <div class="step-item" class:active={currentButtonStep === 1} class:completed={currentButtonStep > 1}>
          <div class="step-number">1</div>
          <div class="step-text">Pressione o botão <strong class="red-button">vermelho</strong></div>
          {#if currentButtonStep > 1}
            <div class="step-check">✓</div>
          {/if}
        </div>
        <div class="step-item" class:active={currentButtonStep === 2} class:completed={buttonStepCompleted}>
          <div class="step-number">2</div>
          <div class="step-text">Em seguida, pressione o botão <strong class="green-button">verde</strong></div>
          {#if buttonStepCompleted}
            <div class="step-check">✓</div>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="payment-info-row">
      <div class="payment-amount-card">
        <div class="amount-label">Valor a pagar</div>
        <div class="amount-value">{formatPrice(cart.total)}</div>
      </div>
      
      <div class="countdown-container">
        <div class="countdown-display">
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
                stroke-dasharray="157.1"
                stroke-dashoffset={(100 - progressPercent) / 100 * 157.1}
              />
            </svg>
            <div class="countdown-text">{countdown}</div>
          </div>
          <div class="countdown-label">Tempo restante</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card-footer">
    
    <div class="card-status">
      <div class="status-indicator pulsing"></div>
      <p>
        {#if currentStep === 2}
          Aguardando confirmação no terminal...
        {/if}
      </p>
    </div>
    
    <button class="cancel-button" on:click={onCancel}>
      Cancelar
    </button>
  </div>
</section>

<style>
  .card-display {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    border: 1px solid var(--border);
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .payment-icon {
    font-size: 2.5rem;
  }

  .status-message {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--foreground);
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    max-width: 400px;
    line-height: 1.4;
  }

  .card-main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  /* Button instructions styles */
  .button-instructions-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 500px;
  }

  .instructions-header {
    text-align: center;
  }

  .instructions-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0 0 0.5rem 0;
  }

  .instructions-subtitle {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin: 0;
  }

  .button-image-container {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    background: var(--muted);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border);
  }

  .button-instructions-image {
    max-width: 100%;
    height: auto;
    max-height: 250px;
    border-radius: var(--radius);
  }

  .steps-description {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    transition: all 0.3s ease;
  }

  .step-item.active {
    background: rgba(0, 129, 167, 0.1);
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }

  .step-item.completed {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
    opacity: 0.8;
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

  .step-item.completed .step-number {
    background: #22c55e;
  }

  .step-text {
    font-size: 1rem;
    color: var(--foreground);
    font-weight: 500;
    flex: 1;
  }

  .step-text strong {
    color: var(--primary);
  }

  .step-text .red-button {
    color: #ef4444;
  }

  .step-text .green-button {
    color: #22c55e;
  }

  .step-item.completed .step-text strong {
    color: #22c55e;
  }

  .step-check {
    color: #22c55e;
    font-size: 1.25rem;
    font-weight: 700;
    flex-shrink: 0;
  }



  .payment-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    width: 100%;
  }

  .payment-amount-card {
    background: var(--muted);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem;
    flex: 1;
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
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
  }

  .card-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: auto;
  }

  .countdown-container {
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .countdown-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary);
    font-family: monospace;
  }

  .countdown-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .card-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(0, 129, 167, 0.1);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    background: var(--primary);
    border-radius: 50%;
  }

  .status-indicator.pulsing {
    animation: pulse 2s ease-in-out infinite;
  }

  .card-status p {
    margin: 0;
    color: var(--primary);
    font-weight: 500;
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


  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  @media (max-width: 640px) {
    .card-display {
      padding: 1rem;
    }
    
    .payment-info-row {
      flex-direction: column;
      gap: 1rem;
    }
    
    .payment-amount-card {
      max-width: 100%;
    }
    
    .cancel-button {
      min-width: 250px;
    }
    
    .countdown-text {
      font-size: 0.875rem;
    }
    
    .amount-value {
      font-size: 1.5rem;
    }

    /* Button instructions responsive styles */
    .button-instructions-section {
      max-width: 100%;
    }

    .instructions-title {
      font-size: 1.25rem;
    }

    .button-instructions-image {
      max-height: 250px;
    }

    .step-item {
      padding: 0.75rem;
    }

    .step-text {
      font-size: 0.875rem;
    }
  }
</style>