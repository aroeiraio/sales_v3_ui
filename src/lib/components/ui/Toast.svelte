<script lang="ts">
  import { toastService, type Toast } from '../../services/toast';
  import { fly } from 'svelte/transition';
  import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-svelte';

  let toasts: Toast[] = [];

  toastService.subscribe(value => {
    toasts = value;
  });

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div in:fly={{ y: 100, duration: 300 }} out:fly={{ y: 100, duration: 300 }} class="toast toast-{toast.type}">
      <div class="toast-icon">
        <svelte:component this={icons[toast.type]} size={24} />
      </div>
      <div class="toast-message">{toast.message}</div>
      <button class="toast-close" on:click={() => toastService.remove(toast.id)}>
        <XCircle size={20} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10000;
  }

  .toast {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-lg, 12px);
    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
    min-width: 300px;
    max-width: 400px;
    border: 1px solid transparent;
    color: white;
  }

  .toast-success {
    background-color: var(--success, #10B981);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .toast-error {
    background-color: var(--error, #F07167);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .toast-info {
    background-color: var(--cerulean, #0081A7);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .toast-warning {
    background-color: var(--warning, #F59E0B);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .toast-icon {
    margin-right: 1rem;
    display: flex;
    align-items: center;
  }

  .toast-message {
    flex: 1;
    font-weight: 500;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    margin-left: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
