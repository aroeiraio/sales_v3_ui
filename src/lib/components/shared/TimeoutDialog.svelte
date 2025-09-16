<script lang="ts">
  import { HelpCircle } from 'lucide-svelte';

  export let isVisible = false;
  export let onContinue: () => void;
  export let showProgressBar = false;
  export let progressWidth = 100;
</script>

<!-- Session Timeout Progress Bar -->
{#if showProgressBar}
  <div class="timeout-progress-bar">
    <div class="progress-fill" style:width="{progressWidth}%"></div>
  </div>
{/if}

<!-- Timeout Dialog -->
{#if isVisible}
  <div class="timeout-dialog-backdrop">
    <div class="timeout-dialog">
      <div class="dialog-icon">
        <HelpCircle size={48} />
      </div>
      <h3 class="dialog-title">Ei! Tem alguém aí?</h3>
      <p class="dialog-message">Clique para continuar</p>
      <button class="continue-button" on:click={onContinue}>
        OK
      </button>
    </div>
  </div>
{/if}

<style>
  /* Session Timeout Progress Bar */
  .timeout-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444);
    transition: width 0.1s ease-out;
  }

  /* Timeout Dialog Styles */
  .timeout-dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
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
    text-align: center;
    box-shadow: var(--shadow-xl);
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
    color: var(--primary-foreground);
    border: none;
    padding: 0.75rem 2rem;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .continue-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>