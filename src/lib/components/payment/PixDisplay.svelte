<script lang="ts">
  import { MEDIA_BASE_URL } from '../../utils/constants';
  
  export let paymentResult: any = null;
  export let cart: { total: number };
  export let countdown: number = 60;
  export let onShowInstructions: () => void;
  export let onCancel: () => void;

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

<section class="pix-display">
  <div class="qr-header">
    <div class="status-message">Escaneie o QR Code</div>
    <div class="status-description">Use seu celular para escanear o código PIX</div>
  </div>

  <div class="qr-main-container">
    <div class="qr-code-display">
      {#if paymentResult?.qrcode_source}
        <img 
          src="{MEDIA_BASE_URL}{paymentResult.qrcode_source}" 
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
    
    <div class="amount-timer-row">
      <div class="payment-amount-qr">
        <div class="amount-label">Valor do PIX</div>
        <div class="amount-value">{formatPrice(cart.total)}</div>
      </div>
      
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
              stroke-dashoffset={157 - (countdown / 60) * 157}
            />
          </svg>
          <div class="countdown-text">{countdown}s</div>
        </div>
      </div>
    </div>
  </div>

  <div class="qr-footer">
    <p class="qr-status">
      <i class="icon-info"></i>
      Complete o pagamento antes que o tempo expire
    </p>

    <button class="cancel-button" on:click={onCancel}>
      Cancelar
    </button>
  </div>
</section>

<style>
  .pix-display {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
    height: fit-content;
    max-height: 100vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  .qr-header {
    margin-bottom: 0;
    width: 100%;
  }

  .status-message {
    font-size: 2rem;
    font-weight: 700;
    color: var(--foreground);
    margin-bottom: 0.75rem;
    line-height: 1.2;
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    line-height: 1.4;
  }

  .qr-main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin: 0;
  }

  .qr-code-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    width: 280px;
    margin: 0 auto;
    background: var(--background);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
  }

  .amount-timer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1.5rem;
    background: var(--muted);
    padding: 1rem 1.5rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .qr-code-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius);
    background: white;
    padding: 0.5rem;
  }

  .qr-code-placeholder {
    width: 100%;
    height: 100%;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--muted);
    gap: 1rem;
  }

  .qr-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid var(--border);
    border-top: 6px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: var(--muted-foreground);
    font-size: 1rem;
    font-weight: 500;
  }

  .payment-amount-qr {
    background: transparent;
    border: none;
    border-radius: var(--radius);
    padding: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .amount-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .amount-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--foreground);
  }

  .instructions-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    min-width: 250px;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .instructions-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .qr-footer {
    margin-top: 0;
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .countdown-container {
    display: flex;
    justify-content: center;
    flex-shrink: 0;
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
    padding: 1rem 1.5rem;
    background: rgba(0, 129, 167, 0.1);
    border-radius: var(--radius-lg);
    font-weight: 500;
    margin: 0;
    border: 1px solid rgba(0, 129, 167, 0.2);
  }

  .cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid var(--border);
    min-width: 250px;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cancel-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .icon-info::before {
    content: "ℹ️";
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .pix-display {
      padding: 1.5rem;
      gap: 1.5rem;
    }
    
    .qr-code-display {
      width: 240px;
      height: 240px;
      padding: 1rem;
    }
    
    .qr-code-image,
    .qr-code-placeholder {
      max-width: 100%;
      max-height: 100%;
    }
    
    .amount-timer-row {
      flex-direction: column;
      gap: 1.5rem;
      padding: 1rem;
    }
    
    .instructions-button,
    .cancel-button {
      min-width: 250px;
      min-height: 48px;
      font-size: 1.125rem;
    }
    
    .status-message {
      font-size: 1.75rem;
    }
    
    .amount-value {
      font-size: 1.125rem;
    }
  }
</style>