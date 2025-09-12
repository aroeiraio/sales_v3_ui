<script lang="ts">
  import { Wifi, WifiOff, RotateCw } from 'lucide-svelte';

  export let status: 'connected' | 'disconnected' | 'reconnecting';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const statusConfig = {
    connected: {
      icon: Wifi,
      class: 'connection-connected',
      label: 'Conectado'
    },
    disconnected: {
      icon: WifiOff,
      class: 'connection-disconnected',
      label: 'Desconectado'
    },
    reconnecting: {
      icon: RotateCw,
      class: 'connection-reconnecting',
      label: 'Reconectando...'
    }
  };

  $: config = statusConfig[status];
  $: iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
</script>

<div class="connection-status connection-{size} {config.class}">
  <svelte:component 
    this={config.icon} 
    size={iconSize} 
    class="{status === 'reconnecting' ? 'animate-spin' : ''}"
  />
  <span class="connection-label">{config.label}</span>
</div>

<style>
  .connection-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md, 6px);
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid;
  }

  .connection-sm {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .connection-lg {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    gap: 0.75rem;
  }

  .connection-connected {
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .connection-disconnected {
    background-color: #fecaca;
    color: #dc2626;
    border-color: #fca5a5;
  }

  .connection-reconnecting {
    background-color: #fef3c7;
    color: #92400e;
    border-color: #fed7aa;
  }

  .connection-label {
    font-weight: 500;
  }

  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>