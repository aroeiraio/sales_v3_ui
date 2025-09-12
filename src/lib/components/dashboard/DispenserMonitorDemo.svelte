<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import DispenserMonitor from './DispenserMonitor.svelte';
  import { websocketService } from '../../services/websocketService.js';

  let demoInterval: number | undefined;
  let isDemo = $state(false);
  let currentMessageIndex = 0;
  
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
            detected: true,
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
      demoInterval = undefined;
    }
  }

  onDestroy(() => {
    stopDemo();
  });
</script>

<div class="monitor-demo">
  <div class="demo-controls">
    <button 
      class="demo-button" 
      class:active={isDemo}
      onclick={isDemo ? stopDemo : startDemo}
    >
      {isDemo ? '⏹️ Parar Demo' : '▶️ Iniciar Demo'}
    </button>
  </div>
  
  <DispenserMonitor />
</div>

<style>
  .monitor-demo {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .demo-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    background-color: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 1rem 1rem 0 0;
  }

  .demo-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .demo-button:hover {
    background-color: #2563eb;
  }

  .demo-button.active {
    background-color: #dc2626;
  }

  .demo-button.active:hover {
    background-color: #b91c1c;
  }

  @media (max-width: 768px) {
    .demo-controls {
      justify-content: center;
      padding: 1rem;
    }
  }
</style>