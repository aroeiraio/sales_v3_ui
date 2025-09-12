<script lang="ts">
  import { onMount } from 'svelte';
  import DispenserMonitor from '../../../lib/components/dashboard/DispenserMonitor.svelte';
  import Toast from '../../../lib/components/ui/Toast.svelte';
  import { websocketService } from '../../../lib/services/websocketService.js';

  let demoInterval: number;
  
  // Demo messages to simulate websocket data
  const demoMessages = [
    {
      channel: "dispenser",
      data: {
        accepted: "2025-09-12T10:35:59.026",
        bridge_timestamp: "2025-09-12T10:35:59",
        device: "dispenser_1",
        force: true,
        label: "dispenser",
        sensors: {
          barrier: false,
          "door-opened": false,
          "drawers-unlocked": false,
          "hatch-opened": true,
          timestamp: "2025-09-12T10:35:58.922"
        },
        topic: "sensors"
      },
      timestamp: "2025-09-12T10:35:59"
    },
    {
      channel: "device_status",
      data: {
        bridge_timestamp: "2025-09-12T10:33:29",
        device: "dispenser_1",
        label: "dispenser",
        state: "READY",
        timestamp: "2025-09-12T10:33:29.615",
        topic: "device_status"
      },
      timestamp: "2025-09-12T10:33:29"
    },
    {
      channel: "dispenser",
      data: {
        accepted: "2025-09-12T10:35:58.974",
        bridge_timestamp: "2025-09-12T10:35:58",
        device: "dispenser_1",
        items: [
          {
            detected: false,
            item: 1,
            item_literal: "A1"
          }
        ],
        label: "dispenser",
        topic: "delivery",
        value: "delivered"
      },
      timestamp: "2025-09-12T10:35:58"
    },
    {
      channel: "dispenser",
      data: {
        accepted: "2025-09-12T10:33:27.452",
        bridge_timestamp: "2025-09-12T10:33:27",
        device: "dispenser_2",
        items: [
          {
            detected: false,
            item: 1,
            item_literal: "A1"
          }
        ],
        label: "dispenser",
        topic: "delivery",
        value: "ready for picking"
      },
      timestamp: "2025-09-12T10:33:27"
    },
    {
      channel: "item_detection",
      data: {
        accepted: "2025-09-12T10:33:27.288",
        bridge_timestamp: "2025-09-12T10:33:27",
        data: {
          detected: false,
          item: 1,
          item_literal: "A1"
        },
        device: "dispenser_2",
        label: "dispenser",
        topic: "item_detection"
      },
      timestamp: "2025-09-12T10:33:27"
    },
    {
      channel: "device_status",
      data: {
        bridge_timestamp: "2025-09-12T10:33:26",
        device: "dispenser_2",
        label: "dispenser",
        state: "BUSY",
        timestamp: "2025-09-12T10:33:26.615",
        topic: "device_status"
      },
      timestamp: "2025-09-12T10:33:26"
    }
  ];

  let currentMessageIndex = 0;
  let isDemo = false;

  function startDemo() {
    if (isDemo) return;
    
    isDemo = true;
    
    // Simulate incoming websocket messages
    demoInterval = setInterval(() => {
      const message = demoMessages[currentMessageIndex];
      
      // Update timestamp to current time
      const now = new Date().toISOString();
      message.timestamp = now;
      message.data.bridge_timestamp = now;
      if (message.data.sensors) {
        message.data.sensors.timestamp = now;
      }
      if (message.data.timestamp) {
        message.data.timestamp = now;
      }

      // Randomly change sensor states for more dynamic demo
      if (message.data.sensors) {
        message.data.sensors['door-opened'] = Math.random() > 0.7;
        message.data.sensors['drawers-unlocked'] = Math.random() > 0.8;
        message.data.sensors['hatch-opened'] = Math.random() > 0.6;
      }

      // Simulate message handling (normally would come from websocket)
      console.log('Demo message:', message);
      
      // Manually trigger message handling in the websocket service
      (websocketService as any).handleMessage(message);
      
      currentMessageIndex = (currentMessageIndex + 1) % demoMessages.length;
    }, 3000); // Send a new message every 3 seconds
  }

  function stopDemo() {
    if (demoInterval) {
      clearInterval(demoInterval);
      isDemo = false;
    }
  }

  onMount(() => {
    return () => {
      stopDemo();
    };
  });
</script>

<svelte:head>
  <title>Dashboard Demo - Monitor de Dispensers</title>
</svelte:head>

<main class="dashboard-demo">
  <div class="demo-controls">
    <div class="controls-content">
      <h1>Demo Dashboard - Monitor de Dispensers</h1>
      <p>Esta página simula mensagens do websocket para demonstrar o funcionamento do monitor.</p>
      <div class="buttons">
        <button 
          class="demo-button" 
          class:active={isDemo}
          on:click={isDemo ? stopDemo : startDemo}
        >
          {isDemo ? 'Parar Demo' : 'Iniciar Demo'}
        </button>
      </div>
    </div>
  </div>
  
  <DispenserMonitor />
  <Toast />
</main>

<style>
  .dashboard-demo {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--background, #ffffff);
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .demo-controls {
    background-color: var(--primary, #3b82f6);
    color: white;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .controls-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .controls-content h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .controls-content p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.875rem;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .demo-button {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md, 6px);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .demo-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .demo-button.active {
    background-color: rgba(255, 255, 255, 0.9);
    color: var(--primary, #3b82f6);
  }

  @media (max-width: 768px) {
    .controls-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .controls-content h1 {
      font-size: 1.25rem;
    }
  }
</style>