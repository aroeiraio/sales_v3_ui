<script lang="ts">
  import { Check, Package, CheckCircle } from 'lucide-svelte';
  import type { DeliveryStep } from '../../services/delivery';

  export let steps: DeliveryStep[] = [];

  function getIcon(iconName: string) {
    switch (iconName) {
      case 'check':
        return Check;
      case 'package':
        return Package;
      case 'check-circle':
        return CheckCircle;
      default:
        return Check;
    }
  }
</script>

<div class="progress-section">
  <div class="progress-steps">
    {#each steps as step, index (step.id)}
      <div class="progress-step" class:active={step.status === 'active'} class:completed={step.status === 'completed'}>
        <div class="step-indicator">
          <svelte:component this={getIcon(step.icon)} size={16} />
        </div>
        <div class="step-content">
          <div class="step-title">{step.title}</div>
          <div class="step-description">{step.description}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .progress-section {
    max-width: 400px;
    margin: 0 auto;
  }

  .progress-steps {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
    padding-left: 2.5rem;
  }

  .progress-steps::before {
    content: '';
    position: absolute;
    left: 12px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border, #E2E8F0);
    z-index: 0;
  }

  .progress-step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    position: relative;
  }

  .step-indicator {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--card, #FFFFFF);
    border: 2px solid var(--border, #E2E8F0);
    position: absolute;
    left: -2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    color: var(--muted-foreground, #64748B);
  }

  .step-content {
    flex: 1;
    padding-bottom: 1.5rem;
  }

  .step-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--foreground, #1E293B);
  }

  .step-description {
    font-size: 0.875rem;
    color: var(--muted-foreground, #64748B);
  }

  /* Active step styles */
  .progress-step.active .step-indicator {
    border-color: var(--primary, #0081a7);
    background: var(--primary, #0081a7);
    color: white;
    animation: pulse 2s infinite;
  }

  .progress-step.active .step-title {
    color: var(--primary, #0081a7);
  }

  .progress-step.completed .step-indicator {
    border-color: var(--success, #10B981);
    background: var(--success, #10B981);
    color: white;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .progress-steps {
      padding-left: 2rem;
    }
    
    .step-indicator {
      left: -2rem;
    }
  }
</style>