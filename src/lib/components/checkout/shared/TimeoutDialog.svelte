<script>
  import { HelpCircle } from 'lucide-svelte';

  /**
   * @type {boolean}
   */
  export let show = false;

  /**
   * @type {() => void}
   */
  export let onContinue;
</script>

{#if show}
  <div class="timeout-dialog-backdrop">
    <div class="timeout-dialog">
      <div class="dialog-icon">
        <HelpCircle size={48} />
      </div>
      <h3 class="dialog-title">Ei! Tem alguém aí?</h3>
      <p class="dialog-message">Clique para continuar</p>
      <button class="continue-button" onclick={onContinue}>
        OK
      </button>
    </div>
  </div>
{/if}

<style>
  /* Timeout Dialog Styles */
  .timeout-dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  }

  .timeout-dialog {
    background: white;
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease-out;
  }

  .dialog-icon {
    color: #f59e0b;
    margin-bottom: 1rem;
  }

  .dialog-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0 0 1rem 0;
  }

  .dialog-message {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin: 0 0 2rem 0;
  }

  .continue-button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .continue-button:hover {
    background: var(--primary-hover, #006b8a);
    transform: translateY(-1px);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>