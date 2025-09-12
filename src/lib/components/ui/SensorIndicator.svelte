<script lang="ts">
  import { Lock, Unlock, DoorOpen, DoorClosed } from 'lucide-svelte';

  export let type: 'door' | 'drawer' | 'hatch';
  export let isOpen: boolean;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sensorConfig = {
    door: {
      openIcon: DoorOpen,
      closedIcon: DoorClosed,
      openLabel: 'Porta Aberta',
      closedLabel: 'Porta Fechada',
      openClass: 'sensor-open',
      closedClass: 'sensor-closed'
    },
    drawer: {
      openIcon: Unlock,
      closedIcon: Lock,
      openLabel: 'Gaveta Destravada',
      closedLabel: 'Gaveta Travada',
      openClass: 'sensor-unlocked',
      closedClass: 'sensor-locked'
    },
    hatch: {
      openIcon: DoorOpen,
      closedIcon: DoorClosed,
      openLabel: 'Portinhola Aberta',
      closedLabel: 'Portinhola Fechada',
      openClass: 'sensor-open',
      closedClass: 'sensor-closed'
    }
  };

  $: config = sensorConfig[type];
  $: icon = isOpen ? config.openIcon : config.closedIcon;
  $: label = isOpen ? config.openLabel : config.closedLabel;
  $: statusClass = isOpen ? config.openClass : config.closedClass;
  $: iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
</script>

<div class="sensor-indicator sensor-{size} {statusClass}">
  <svelte:component this={icon} size={iconSize} />
  <span class="sensor-label">{label}</span>
</div>

<style>
  .sensor-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md, 6px);
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid;
  }

  .sensor-sm {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .sensor-lg {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    gap: 0.75rem;
  }

  .sensor-open {
    background-color: #fef3c7;
    color: #92400e;
    border-color: #fed7aa;
  }

  .sensor-closed {
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .sensor-unlocked {
    background-color: #fef3c7;
    color: #92400e;
    border-color: #fed7aa;
  }

  .sensor-locked {
    background-color: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .sensor-label {
    font-weight: 500;
  }
</style>