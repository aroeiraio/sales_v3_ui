<script>
  /**
   * @type {any}
   */
  export let cart = { total: 0 };

  /**
   * @type {number}
   */
  export let countdownTimer = 180;

  /**
   * @type {() => void}
   */
  export let onCancel;

  /**
   * Format price for display
   * @param {number} price
   * @returns {string}
   */
  function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
</script>

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

  <div class="card-footer">
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
            stroke-dashoffset={157 - (countdownTimer / 180) * 157}
          />
        </svg>
        <div class="countdown-text">{countdownTimer}s</div>
      </div>
    </div>
    <p class="card-status">
      <i class="icon-info"></i>
      Complete o pagamento antes que o tempo expire
    </p>
    <button class="cancel-payment-button card-cancel-button" onclick={onCancel}>
      <i class="icon-x"></i>
      Cancelar Pagamento
    </button>
  </div>
</section>

<style>
  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .card-payment-screen {
    width: 100%;
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

  .payment-status.active {
    display: block;
  }

  .card-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: 2rem;
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

  .card-status {
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

  /* Responsive design */
  @media (max-width: 768px) {
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

    .steps-container::before {
      left: 20px;
    }
  }

  @media (max-width: 480px) {
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
</style>