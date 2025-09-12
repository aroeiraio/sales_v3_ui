<script lang="ts">
  import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-svelte';

  export let status: 'READY' | 'BUSY' | 'UNKNOWN' | 'DISCONNECTED';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const statusConfig = {
    READY: {
      icon: CheckCircle,
      class: 'status-ready',
      label: 'Pronto'
    },
    BUSY: {
      icon: Clock,
      class: 'status-busy',
      label: 'Ocupado'
    },
    UNKNOWN: {
      icon: AlertCircle,
      class: 'status-unknown',
      label: 'Desconhecido'
    },
    DISCONNECTED: {
      icon: XCircle,
      class: 'status-disconnected',
      label: 'Desconectado'
    }
  };

  $: config = statusConfig[status];
  $: iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
</script>

<div class="status-badge status-{size} {config.class}">
  <svelte:component this={config.icon} size={iconSize} />
  <span class="status-label">{config.label}</span>
</div>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md, 6px);
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid;
  }

  .status-sm {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .status-lg {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    gap: 0.75rem;
  }

  .status-ready {
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .status-busy {
    background-color: #fef3c7;
    color: #92400e;
    border-color: #fed7aa;
  }

  .status-unknown {
    background-color: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
  }

  .status-disconnected {
    background-color: #fecaca;
    color: #dc2626;
    border-color: #fca5a5;
  }

  .status-label {
    font-weight: 500;
  }
</style>