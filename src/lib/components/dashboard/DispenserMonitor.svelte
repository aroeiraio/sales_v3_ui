<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { websocketService, type DispenserState } from '../../services/websocketService.js';
  import StatusBadge from '../ui/StatusBadge.svelte';
  import SensorIndicator from '../ui/SensorIndicator.svelte';
  import ConnectionStatus from '../ui/ConnectionStatus.svelte';
  import { Activity, Clock, Zap } from 'lucide-svelte';

  let dispenserStates: DispenserState[] = [];
  let connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  let lastMessage: any = null;

  // Reactive subscriptions
  let dispenserStatesUnsubscribe: () => void;
  let connectionStatusUnsubscribe: () => void;
  let lastMessageUnsubscribe: () => void;

  onMount(() => {
    // Subscribe to stores
    dispenserStatesUnsubscribe = websocketService.dispenserStatesStore.subscribe(states => {
      dispenserStates = Array.from(states.values());
    });

    connectionStatusUnsubscribe = websocketService.connectionStatusStore.subscribe(status => {
      connectionStatus = status;
    });

    lastMessageUnsubscribe = websocketService.lastMessageStore.subscribe(message => {
      lastMessage = message;
    });

    // Connect to websocket (safe to call multiple times)
    websocketService.connect();
  });

  onDestroy(() => {
    if (dispenserStatesUnsubscribe) dispenserStatesUnsubscribe();
    if (connectionStatusUnsubscribe) connectionStatusUnsubscribe();
    if (lastMessageUnsubscribe) lastMessageUnsubscribe();
    
    // Note: We don't disconnect here as other components might be using it
    // websocketService.disconnect();
  });

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('pt-BR');
  }

  function getTimeSinceLastActivity(timestamp: string): string {
    const now = new Date();
    const lastActivity = new Date(timestamp);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora mesmo';
    if (diffMinutes === 1) return '1 minuto atrás';
    if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hora atrás';
    return `${diffHours} horas atrás`;
  }

  function reconnect() {
    websocketService.connect();
  }
</script>

<div class="dispenser-monitor">
  <div class="monitor-header">
    <div class="header-content">
      <div class="header-title">
        <Activity size={24} />
        <h2>Monitor de Dispensers</h2>
      </div>
      <div class="header-status">
        <ConnectionStatus status={connectionStatus} />
        {#if connectionStatus === 'disconnected'}
          <button class="reconnect-button" on:click={reconnect}>
            Reconectar
          </button>
        {/if}
      </div>
    </div>
  </div>

  <div class="monitor-content">
    {#if dispenserStates.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <Zap size={48} />
        </div>
        <h3>Nenhum dispenser detectado</h3>
        <p>Aguardando mensagens dos dispositivos...</p>
      </div>
    {:else}
      <div class="dispensers-grid">
        {#each dispenserStates as dispenser (dispenser.deviceId)}
          <div class="dispenser-card">
            <div class="card-header">
              <div class="device-info">
                <h3>{dispenser.deviceId}</h3>
                <div class="device-status">
                  <StatusBadge 
                    status={dispenser.connected ? dispenser.status : 'DISCONNECTED'} 
                  />
                </div>
              </div>
              <div class="last-activity">
                <Clock size={16} />
                <span>{getTimeSinceLastActivity(dispenser.lastActivity)}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="sensors-section">
                <h4>Sensores</h4>
                <div class="sensors-grid">
                  <SensorIndicator 
                    type="door" 
                    isOpen={dispenser.sensors.doorOpened}
                    size="sm"
                  />
                  <SensorIndicator 
                    type="drawer" 
                    isOpen={dispenser.sensors.drawersUnlocked}
                    size="sm"
                  />
                  <SensorIndicator 
                    type="hatch" 
                    isOpen={dispenser.sensors.hatchOpened}
                    size="sm"
                  />
                </div>
              </div>

              <div class="activity-info">
                <small>Última atividade: {formatTimestamp(dispenser.lastActivity)}</small>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if lastMessage && connectionStatus === 'connected'}
      <div class="debug-section">
        <details>
          <summary>Última mensagem recebida</summary>
          <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
        </details>
      </div>
    {/if}
  </div>
</div>

<style>
  .dispenser-monitor {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--background, #ffffff);
    color: var(--foreground, #000000);
  }

  .monitor-header {
    background-color: var(--card, #f8fafc);
    border-bottom: 1px solid var(--border, #e2e8f0);
    padding: 1rem 1.5rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-title h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .reconnect-button {
    background-color: var(--primary, #3b82f6);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md, 6px);
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .reconnect-button:hover {
    background-color: var(--primary-hover, #2563eb);
  }

  .monitor-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--muted-foreground, #64748b);
  }

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .dispensers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .dispenser-card {
    background-color: var(--card, #ffffff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-lg, 12px);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .dispenser-card:hover {
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
  }

  .card-header {
    padding: 1rem 1.5rem;
    background-color: var(--muted, #f1f5f9);
    border-bottom: 1px solid var(--border, #e2e8f0);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .device-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .last-activity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--muted-foreground, #64748b);
  }

  .card-body {
    padding: 1.5rem;
  }

  .sensors-section {
    margin-bottom: 1rem;
  }

  .sensors-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--foreground, #000000);
  }

  .sensors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .activity-info {
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e2e8f0);
  }

  .activity-info small {
    color: var(--muted-foreground, #64748b);
    font-size: 0.8125rem;
  }

  .debug-section {
    margin-top: 2rem;
    padding: 1rem;
    background-color: var(--muted, #f1f5f9);
    border-radius: var(--radius-md, 6px);
  }

  .debug-section details summary {
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .debug-section pre {
    background-color: var(--card, #ffffff);
    padding: 1rem;
    border-radius: var(--radius-sm, 4px);
    border: 1px solid var(--border, #e2e8f0);
    overflow-x: auto;
    font-size: 0.875rem;
    margin: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .monitor-header {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .monitor-content {
      padding: 1rem;
    }

    .dispensers-grid {
      grid-template-columns: 1fr;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .sensors-grid {
      grid-template-columns: 1fr;
    }
  }
</style>