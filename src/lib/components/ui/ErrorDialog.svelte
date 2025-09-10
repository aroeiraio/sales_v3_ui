<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { errorDialogService, type ErrorDialogConfig } from '../../services/errorDialog';
  import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-svelte';
  import { visualSettingsService } from '../../services/visualSettings';

  let dialogs: ErrorDialogConfig[] = $state([]);
  let settings: any = $state(null);
  let unsubscribe: (() => void) | null = null;

  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  };

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
    } catch (error) {
      console.warn('Failed to load visual settings for error dialog:', error);
    }
    
    unsubscribe = errorDialogService.subscribe((newDialogs) => {
      console.log('ErrorDialog: Received new dialogs:', newDialogs);
      dialogs = newDialogs;
    });
    
    dialogs = errorDialogService.getDialogs();
    console.log('ErrorDialog: Initial dialogs:', dialogs);
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function handleAction(dialog: ErrorDialogConfig, action: any) {
    console.log('handleAction called:', { dialog, action });
    try {
      action.action();
      console.log('Action executed successfully');
    } catch (error) {
      console.error('Error in dialog action:', error);
    }
    
    console.log('Checking autoClose:', action.autoClose);
    if (action.autoClose !== false) {
      console.log('Calling closeDialog for action');
      errorDialogService.closeDialog(dialog);
    }
  }

  function handleClose(dialog: ErrorDialogConfig) {
    console.log('handleClose called:', { dialog, persistent: dialog.persistent });
    if (!dialog.persistent) {
      console.log('Calling closeDialog for close');
      errorDialogService.closeDialog(dialog);
    } else {
      console.log('Dialog is persistent, not closing');
    }
  }

  function handleKeydown(event: KeyboardEvent, dialog: ErrorDialogConfig) {
    if (event.key === 'Escape' && !dialog.persistent) {
      handleClose(dialog);
    }
  }

  function getIconComponent(type: string) {
    return iconMap[type] || AlertCircle;
  }

  function getDialogStyles(type: string) {
    switch (type) {
      case 'error':
        return {
          borderColor: 'var(--destructive)',
          backgroundColor: 'var(--card)',
          iconColor: 'var(--destructive)',
          accentColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'warning':
        return {
          borderColor: 'var(--warning)',
          backgroundColor: 'var(--card)',
          iconColor: 'var(--warning)',
          accentColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'info':
        return {
          borderColor: 'var(--primary)',
          backgroundColor: 'var(--card)',
          iconColor: 'var(--primary)',
          accentColor: 'rgba(0, 129, 167, 0.1)'
        };
      case 'success':
        return {
          borderColor: 'var(--success)',
          backgroundColor: 'var(--card)',
          iconColor: 'var(--success)',
          accentColor: 'rgba(16, 185, 129, 0.1)'
        };
      default:
        return {
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)',
          iconColor: 'var(--muted-foreground)',
          accentColor: 'transparent'
        };
    }
  }
</script>

{#if dialogs.length > 0}
  <div class="dialog-overlay" role="dialog" aria-modal="true">
    {#each dialogs as dialog, index (dialog.id || dialog.title + index)}
      <div 
        class="error-dialog"
        style:z-index={1000 + index}
        style:border-color={getDialogStyles(dialog.type).borderColor}
        style:background-color={getDialogStyles(dialog.type).backgroundColor}
        onkeydown={(e) => handleKeydown(e, dialog)}
        tabindex="-1"
        role="alertdialog"
        aria-labelledby="dialog-title-{index}"
        aria-describedby="dialog-message-{index}"
      >
        <div class="dialog-header">
          <div class="dialog-icon">
            {#if dialog.type === 'error'}
              <AlertCircle size={24} color={getDialogStyles(dialog.type).iconColor} />
            {:else if dialog.type === 'warning'}
              <AlertTriangle size={24} color={getDialogStyles(dialog.type).iconColor} />
            {:else if dialog.type === 'info'}
              <Info size={24} color={getDialogStyles(dialog.type).iconColor} />
            {:else if dialog.type === 'success'}
              <CheckCircle size={24} color={getDialogStyles(dialog.type).iconColor} />
            {:else}
              <AlertCircle size={24} color={getDialogStyles(dialog.type).iconColor} />
            {/if}
          </div>
          <h3 
            id="dialog-title-{index}"
            class="dialog-title" 
            style:color={settings?.font_color || 'var(--foreground)'}
          >
            {dialog.title}
          </h3>
          {#if !dialog.persistent}
            <button 
              class="close-button"
              onclick={() => handleClose(dialog)}
              aria-label="Fechar diálogo"
              type="button"
            >
              <X size={20} />
            </button>
          {/if}
        </div>

        <div class="dialog-content">
          <p 
            id="dialog-message-{index}"
            class="dialog-message" 
            style:color={settings?.font_color || 'var(--muted-foreground)'}
          >
            {dialog.message}
          </p>
        </div>

        <!-- Debug info -->
        <div style="display: none;">
          {console.log('Rendering dialog:', { 
            title: dialog.title, 
            persistent: dialog.persistent, 
            hasActions: dialog.actions?.length > 0,
            actions: dialog.actions 
          })}
        </div>

        {#if dialog.actions && dialog.actions.length > 0}
          <div class="dialog-actions">
            {#each dialog.actions as action, actionIndex}
              <button
                class="action-button"
                class:primary={action.variant === 'primary'}
                class:secondary={action.variant === 'secondary'}
                class:destructive={action.variant === 'destructive'}
                onclick={() => handleAction(dialog, action)}
                type="button"
                autofocus={actionIndex === 0}
              >
                {action.label}
              </button>
            {/each}
          </div>
        {:else if !dialog.persistent}
          <div class="dialog-actions">
            <button
              class="action-button primary"
              onclick={() => handleClose(dialog)}
              type="button"
            >
              OK
            </button>
          </div>
        {:else}
          <!-- Debug: persistent dialog without actions -->
          <div style="color: red; font-size: 12px; padding: 8px;">
            DEBUG: Persistent dialog without actions - no buttons shown
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .error-dialog {
    background: var(--card);
    border-radius: var(--radius-lg);
    border: 2px solid;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), var(--shadow-xl);
    max-width: 500px;
    width: 100%;
    animation: dialogSlideIn 0.3s ease-out;
    outline: none;
    position: relative;
  }

  @keyframes dialogSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--muted);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin: -2px -2px 0 -2px;
  }

  .dialog-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog-title {
    flex: 1;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.3;
    color: var(--foreground);
  }

  .close-button {
    background: transparent;
    border: none;
    color: var(--muted-foreground);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
  }

  .close-button:hover {
    background: var(--muted);
    color: var(--foreground);
  }

  .close-button:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .dialog-content {
    padding: 1rem 1.5rem;
  }

  .dialog-message {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }

  .dialog-actions {
    display: flex;
    gap: 1rem;
    padding: 0 1.5rem 1.5rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    white-space: nowrap;
  }

  .action-button:focus {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  .action-button.primary {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .action-button.primary:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .action-button.primary:active {
    transform: translateY(0);
  }

  .action-button.secondary {
    background: transparent;
    color: var(--foreground);
    border: 1px solid var(--border);
  }

  .action-button.secondary:hover {
    background: var(--muted);
  }

  .action-button.destructive {
    background: var(--destructive);
    color: var(--destructive-foreground);
  }

  .action-button.destructive:hover {
    background: var(--destructive);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .action-button.destructive:active {
    transform: translateY(0);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .dialog-overlay {
      padding: 0.5rem;
    }

    .error-dialog {
      max-width: 100%;
      margin: 0.5rem;
    }

    .dialog-header {
      padding: 1rem 1rem 0;
    }

    .dialog-content {
      padding: 1rem;
    }

    .dialog-actions {
      padding: 0 1rem 1rem;
      flex-direction: column;
    }

    .action-button {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .dialog-overlay {
      padding: 0.25rem;
    }

    .error-dialog {
      margin: 0.25rem;
    }

    .dialog-title {
      font-size: 1.125rem;
    }

    .dialog-message {
      font-size: 0.875rem;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .error-dialog {
      border-width: 3px;
    }
    
    .action-button {
      border-width: 2px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .error-dialog {
      animation: none;
    }
    
    .action-button:hover {
      transform: none;
    }
  }
</style>
