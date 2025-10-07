<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Space, ArrowUp, ChevronDown, Delete } from 'lucide-svelte';

  export let isVisible = false;
  export let value = '';
  export let numericMode = false;
  
  const dispatch = createEventDispatcher<{
    input: string;
    enter: void;
    close: void;
  }>();

  let isUpperCase = false;
  let isSymbols = false;

  const normalKeys = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const numericKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['↑', '0', '⌫']
  ];

  const symbolKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '&', '*', '(', ')'],
    ['-', '=', '[', ']', ';', "'", ',', '.', '/']
  ];

  function handleKeyPress(key: string) {
    // Handle special keys in numeric mode
    if (numericMode) {
      if (key === '↑') {
        // Handle up arrow - could be used for navigation or other functionality
        return;
      } else if (key === '⌫') {
        handleBackspace();
        return;
      }
    }
    
    const newValue = value + (isUpperCase && !isSymbols ? key.toUpperCase() : key);
    dispatch('input', newValue);
  }

  function handleBackspace() {
    const newValue = value.slice(0, -1);
    dispatch('input', newValue);
  }

  function handleSpace() {
    const newValue = value + ' ';
    dispatch('input', newValue);
  }

  function toggleCase() {
    isUpperCase = !isUpperCase;
  }

  function toggleSymbols() {
    isSymbols = !isSymbols;
  }

  function handleEnter() {
    dispatch('enter');
  }

  function handleClose() {
    dispatch('close');
  }

  $: currentKeys = numericMode ? numericKeys : (isSymbols ? symbolKeys : normalKeys);
</script>

{#if isVisible}
  <div class="keyboard-overlay" onclick={handleClose}>
    <div class="virtual-keyboard" class:numeric={numericMode} onclick={(e) => e.stopPropagation()}>


      <div class="keyboard-keys">
        {#each currentKeys as row, rowIndex}
          <div class="keyboard-row">
            {#if rowIndex === 2 && !isSymbols && !numericMode}
              <!-- Shift key for letters -->
              <button 
                class="key special-key shift-key" 
                class:active={isUpperCase}
                onclick={toggleCase}
              >
                <ArrowUp size={16} />
              </button>
            {/if}

            {#each row as key}
              <button 
                class="key" 
                onclick={() => handleKeyPress(key)}
              >
                {isUpperCase && !isSymbols ? key.toUpperCase() : key}
              </button>
            {/each}

            {#if rowIndex === 2 && !numericMode}
              <!-- Backspace key -->
              <button 
                class="key special-key backspace-key" 
                onclick={handleBackspace}
              >
                <Delete size={16} />
              </button>
            {/if}
          </div>
        {/each}

        <!-- Bottom row with special keys -->
        <div class="keyboard-row">
          {#if !numericMode}
            <button 
              class="key special-key symbols-key" 
              onclick={toggleSymbols}
            >
              {isSymbols ? 'ABC' : '123'}
            </button>
          {/if}
          
          {#if !numericMode}
            <button 
              class="key space-key" 
              onclick={handleSpace}
            >
              <Space size={16} />
              Espaço
            </button>
          {/if}
          
          {#if !numericMode}
            <button 
              class="key special-key enter-key" 
              onclick={handleEnter}
            >
              Buscar
            </button>
          {:else}
            <button 
              class="key special-key enter-key" 
              onclick={handleEnter}
            >
              Confirma
            </button>
          {/if}
          
          <button 
            class="key special-key close-key" 
            onclick={handleClose}
          >
            <ChevronDown size={20} />
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
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .virtual-keyboard {
    background: var(--card, white);
    border-radius: var(--radius-lg, 1rem) var(--radius-lg, 1rem) 0 0;
    padding: 1rem;
    max-width: 100vw;
    width: 100%;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .virtual-keyboard.numeric {
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .virtual-keyboard.numeric .keyboard-keys {
    gap: 0.75rem;
  }

  .virtual-keyboard.numeric .keyboard-row {
    gap: 0.5rem;
    justify-content: stretch;
  }

  .virtual-keyboard.numeric .key {
    min-height: 4rem;
    font-size: 1.4rem;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    width: 100%;
  }

  .virtual-keyboard.numeric .keyboard-row:last-child {
    justify-content: stretch;
  }

  .virtual-keyboard.numeric .keyboard-row:last-child .key {
    flex: 1;
    min-width: 0;
  }

  @keyframes slideUp {
    from { 
      transform: translateY(100%);
      opacity: 0;
    }
    to { 
      transform: translateY(0);
      opacity: 1;
    }
  }


  .keyboard-keys {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .keyboard-row {
    display: flex;
    gap: 0.5rem;
    justify-content: stretch;
  }

  .key {
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: var(--radius, 0.5rem);
    padding: 0.825rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: all 0.1s ease;
    flex: 1;
    min-height: 3.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .key:hover {
    background: #4b5563;
    transform: translateY(-1px);
  }

  .key:active {
    transform: translateY(0);
    background: #6b7280;
  }

  .special-key {
    background: #1f2937;
    color: white;
    font-weight: 700;
  }

  .special-key:hover {
    background: #111827;
  }

  .shift-key.active {
    background: #111827;
    color: white;
  }

  .space-key {
    flex: 4;
    gap: 0.5rem;
  }

  .symbols-key,
  .enter-key,
  .close-key {
    flex: 1.5;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .enter-key {
    background: #111827;
    color: white;
    font-weight: 700;
  }

  .enter-key:hover {
    background: #030712;
  }

  .close-key {
    background: #1f2937;
    color: white;
    font-weight: 700;
  }

  .close-key:hover {
    background: #111827;
  }

  .backspace-key {
    flex: 1.5;
  }

  /* Responsive adjustments */
  @media (min-width: 768px) {
    .virtual-keyboard {
      max-width: 800px;
      border-radius: var(--radius-lg, 1rem) var(--radius-lg, 1rem) 0 0;
    }
    
    .virtual-keyboard.numeric {
      max-width: 700px;
    }

    .virtual-keyboard.numeric .key {
      min-height: 4.5rem;
      font-size: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .virtual-keyboard {
      padding: 1rem;
    }

    .virtual-keyboard.numeric .key {
      min-height: 3.5rem;
      font-size: 1.2rem;
    }

    .key {
      padding: 0.6rem;
      min-width: 2rem;
      min-height: 2.5rem;
      font-size: 0.9rem;
    }

    .keyboard-keys {
      gap: 0.4rem;
    }

    .keyboard-row {
      gap: 0.4rem;
    }
  }
</style>