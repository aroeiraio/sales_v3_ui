<script>
  /**
   * @type {boolean}
   */
  export let show = false;

  /**
   * @type {() => void}
   */
  export let onClose;
</script>

{#if show}
  <div class="popup-overlay" onclick={onClose}>
    <div class="popup-content" onclick={(e) => e.stopPropagation()}>
      <div class="popup-header">
        <h3 class="popup-title">Como pagar com PIX</h3>
        <button class="popup-close" onclick={onClose}>
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

  .instruction-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .instruction-step {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--muted);
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
    font-size: 1rem;
    color: var(--foreground);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .popup-content {
      width: 95%;
      margin: 1rem;
    }

    .popup-header {
      padding: 1rem 1.5rem;
    }

    .popup-body {
      padding: 1.5rem;
    }

    .step-text {
      font-size: 0.875rem;
    }
  }
</style>