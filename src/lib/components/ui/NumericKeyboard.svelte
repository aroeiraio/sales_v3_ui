<script lang="ts">
  import { X, ChevronDown } from 'lucide-svelte';

  interface Props {
    isVisible: boolean;
    value: string;
    oninput: (value: string) => void;
    onenter: () => void;
    onclose: () => void;
  }

  let { isVisible = false, value = '', oninput, onenter, onclose }: Props = $props();

  const digitKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'], 
    ['7', '8', '9'],
    ['', '0', 'backspace']
  ];

  function handleKeyPress(key: string) {
    if (key === '') return;
    
    if (key === 'backspace') {
      handleBackspace();
      return;
    }

    const newValue = value + key;
    oninput(newValue);
  }

  function handleBackspace() {
    const newValue = value.slice(0, -1);
    oninput(newValue);
  }

  function handleEnter() {
    onenter();
  }

  function handleClose() {
    onclose();
  }
</script>

{#if isVisible}
  <div class="keyboard-overlay" onclick={handleClose}>
    <div class="numeric-keyboard" onclick={(e) => e.stopPropagation()}>
      <div class="keyboard-header">
        <h3>Digite a senha</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Fechar teclado">
          <ChevronDown size={24} />
        </button>
      </div>

      <div class="password-display">
        <div class="password-dots">
          {#each Array(value.length) as _, i}
            <span class="dot">●</span>
          {/each}
          <span class="cursor">|</span>
        </div>
      </div>

      <div class="keyboard-keys">
        {#each digitKeys as row, rowIndex}
          <div class="keyboard-row">
            {#each row as key}
              {#if key === ''}
                <div class="key-spacer"></div>
              {:else if key === 'backspace'}
                <button 
                  class="key special-key backspace-key" 
                  onclick={() => handleKeyPress(key)}
                  disabled={value.length === 0}
                >
                  <X size={24} />
                </button>
              {:else}
                <button 
                  class="key digit-key" 
                  onclick={() => handleKeyPress(key)}
                >
                  {key}
                </button>
              {/if}
            {/each}
          </div>
        {/each}

        <div class="keyboard-row action-row">
          <button 
            class="key action-key clear-key" 
            onclick={() => oninput('')}
            disabled={value.length === 0}
          >
            Limpar
          </button>
          
          <button 
            class="key action-key enter-key" 
            onclick={handleEnter}
            disabled={value.length === 0}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .keyboard-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .numeric-keyboard {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    max-width: 400px;
    width: 90vw;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideIn {
    from { 
      transform: scale(0.9) translateY(-20px);
      opacity: 0;
    }
    to { 
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .keyboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .keyboard-header h3 {
    margin: 0;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .password-display {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 2px solid #e5e7eb;
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .password-dots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    color: #374151;
  }

  .dot {
    color: #111827;
  }

  .cursor {
    animation: blink 1s infinite;
    color: #3b82f6;
    font-weight: 100;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .keyboard-keys {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .keyboard-row {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .key {
    background: #f3f4f6;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .key:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #d1d5db;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .key:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .key:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .digit-key {
    background: #3b82f6;
    border-color: #2563eb;
    color: white;
  }

  .digit-key:hover:not(:disabled) {
    background: #2563eb;
    border-color: #1d4ed8;
  }

  .digit-key:active:not(:disabled) {
    background: #1d4ed8;
  }

  .special-key {
    background: #ef4444;
    border-color: #dc2626;
    color: white;
  }

  .special-key:hover:not(:disabled) {
    background: #dc2626;
    border-color: #b91c1c;
  }

  .key-spacer {
    width: 4rem;
    height: 4rem;
  }

  .action-row {
    margin-top: 0.5rem;
  }

  .action-key {
    width: auto;
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
  }

  .clear-key {
    background: #6b7280;
    border-color: #4b5563;
    color: white;
  }

  .clear-key:hover:not(:disabled) {
    background: #4b5563;
    border-color: #374151;
  }

  .enter-key {
    background: #10b981;
    border-color: #059669;
    color: white;
  }

  .enter-key:hover:not(:disabled) {
    background: #059669;
    border-color: #047857;
  }

  @media (max-width: 480px) {
    .numeric-keyboard {
      padding: 1rem;
      width: 95vw;
    }

    .key {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.25rem;
    }

    .keyboard-keys {
      gap: 0.75rem;
    }

    .keyboard-row {
      gap: 0.75rem;
    }
  }
</style>