import { writable, get } from 'svelte/store';
import { toastService } from './toast.js';

// Message types from websocket
export interface WebSocketMessage {
  channel: string;
  data: {
    accepted?: string;
    bridge_timestamp: string;
    device: string;
    label: string;
    topic: string;
    timestamp?: string;
    // Sensor data
    sensors?: {
      barrier: boolean;
      'door-opened': boolean;
      'drawers-unlocked': boolean;
      'hatch-opened': boolean;
      timestamp: string;
    };
    // Delivery data
    items?: Array<{
      detected: boolean;
      item: number;
      item_literal: string;
    }>;
    value?: string;
    // Device status
    state?: string;
    // Item detection
    data?: {
      detected: boolean;
      item: number;
      item_literal: string;
    };
    force?: boolean;
  };
  timestamp: string;
}

// Dispenser state tracking
export interface DispenserState {
  deviceId: string;
  status: 'READY' | 'BUSY' | 'UNKNOWN';
  sensors: {
    doorOpened: boolean;
    drawersUnlocked: boolean;
    hatchOpened: boolean;
  };
  lastActivity: string;
  connected: boolean;
}

// Portuguese translations for user messages
const translations = {
  sensors: {
    'door-opened-true': 'Porta aberta',
    'door-opened-false': 'Porta fechada',
    'drawers-unlocked-true': 'Trava da gaveta destravada',
    'drawers-unlocked-false': 'Trava da gaveta travada',
    'hatch-opened-true': 'Portinhola aberta',
    'hatch-opened-false': 'Portinhola fechada'
  },
  delivery: {
    'delivered': 'Itens retirados',
    'ready-for-picking-not-detected': 'Item em {slot} não foi detectado, mas itens estão prontos para retirada',
    'ready-for-picking': 'Itens prontos para retirada'
  },
  itemDetection: {
    'not-detected': 'Item em {slot} não foi detectado'
  },
  deviceStatus: {
    'READY': 'Pronto',
    'BUSY': 'Ocupado',
    'UNKNOWN': 'Status desconhecido'
  },
  connection: {
    'connected': 'Conectado ao sistema',
    'disconnected': 'Conexão perdida',
    'reconnecting': 'Reconectando...',
    'reconnected': 'Reconectado com sucesso'
  }
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private reconnectTimeoutId: number | null = null;
  private heartbeatIntervalId: number | null = null;
  private heartbeatTimeoutId: number | null = null;
  private lastHeartbeatResponse = 0;
  private isIntentionallyDisconnected = false;
  private visibilityChangeHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  
  // Configurable timeout settings (in milliseconds)
  public heartbeatInterval = 60000;  // Send ping every 60 seconds (was 30s)
  public heartbeatTimeout = 30000;   // Wait 30 seconds for pong response (was 10s)  
  public connectionCheckInterval = 120000; // Check connection health every 2 minutes

  // Stores
  private dispenserStates = writable<Map<string, DispenserState>>(new Map());
  private connectionStatus = writable<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  private lastMessage = writable<WebSocketMessage | null>(null);

  constructor(url = 'ws://localhost:9010') {
    this.url = url;
    this.setupBrowserEventHandlers();
  }

  // Public store accessors
  get dispenserStatesStore() {
    return { subscribe: this.dispenserStates.subscribe };
  }

  get connectionStatusStore() {
    return { subscribe: this.connectionStatus.subscribe };
  }

  get lastMessageStore() {
    return { subscribe: this.lastMessage.subscribe };
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isIntentionallyDisconnected = false;
    this.isConnecting = true;
    this.connectionStatus.set('reconnecting');
    
    // Clear any existing reconnect timeout
    this.clearReconnectTimeout();

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to', this.url);
        this.connectionStatus.set('connected');
        const wasReconnecting = this.reconnectAttempts > 0;
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // Only show toast notifications in dashboard context
        if (this.shouldShowToastNotifications()) {
          if (wasReconnecting) {
            toastService.showSuccess(translations.connection.reconnected);
          } else {
            toastService.showSuccess(translations.connection.connected);
          }
        }
        
        // Start heartbeat mechanism
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle heartbeat response
          if (message.channel === 'heartbeat') {
            this.lastHeartbeatResponse = Date.now();
            this.clearHeartbeatTimeout();
            return;
          }

          // Handle health check response
          if (message.channel === 'health_check') {
            console.log('Connection health check: pong received');
            return;
          }
          
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        this.connectionStatus.set('disconnected');
        this.isConnecting = false;
        this.stopHeartbeat();
        
        // Only show disconnection warning on first disconnect or if not intentionally disconnected
        // and only in dashboard context
        if (this.reconnectAttempts === 0 && !this.isIntentionallyDisconnected && this.shouldShowToastNotifications()) {
          toastService.showWarning(translations.connection.disconnected);
        }
        
        // Only attempt reconnection if not intentionally disconnected
        if (!this.isIntentionallyDisconnected) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        
        // Additional error logging for debugging
        console.error('WebSocket error details:', {
          url: this.url,
          readyState: this.ws?.readyState,
          reconnectAttempts: this.reconnectAttempts,
          timestamp: new Date().toISOString()
        });
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      if (!this.isIntentionallyDisconnected) {
        this.attemptReconnect();
      }
    }
  }

  private attemptReconnect() {
    if (this.isIntentionallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnection attempts reached (${this.maxReconnectAttempts}). Will retry in ${this.maxReconnectDelay/1000}s...`);
      
      // After max attempts, wait longer and then reset attempt count for another round
      this.reconnectTimeoutId = setTimeout(() => {
        console.log('Resetting reconnection attempts and trying again...');
        this.reconnectAttempts = 0;
        this.attemptReconnect();
      }, this.maxReconnectDelay);
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential backoff with jitter to prevent thundering herd
    const exponentialDelay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    // Add jitter (±25% of delay) to prevent all clients reconnecting simultaneously  
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    const finalDelay = Math.max(exponentialDelay + jitter, this.baseReconnectDelay);
    
    console.log(`Attempting to reconnect in ${Math.round(finalDelay/1000)}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      if (!this.isIntentionallyDisconnected) {
        this.connect();
      }
    }, finalDelay);
  }

  private clearReconnectTimeout() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    if (this.shouldShowToastNotifications()) {
      console.log(`Starting heartbeat: ping every ${this.heartbeatInterval/1000}s, timeout after ${this.heartbeatTimeout/1000}s`);
    }
    
    // Send ping at configurable interval
    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ channel: 'ping', timestamp: Date.now() }));
          
          if (this.shouldShowToastNotifications()) {
            console.log(`Heartbeat ping sent (timeout in ${this.heartbeatTimeout/1000}s)`);
          }
          
          // Set timeout to detect missed pong
          this.heartbeatTimeoutId = setTimeout(() => {
            if (this.shouldShowToastNotifications()) {
              console.log(`Heartbeat timeout reached (${this.heartbeatTimeout/1000}s) - connection appears dead, forcing reconnection`);
            }
            if (this.ws) {
              this.ws.close();
            }
          }, this.heartbeatTimeout);
          
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private shouldShowToastNotifications(): boolean {
    // Only show websocket toast notifications when we're in dashboard context
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/dashboard') || 
             document.querySelector('[data-dashboard-active]') !== null;
    }
    return false;
  }

  private setupBrowserEventHandlers() {
    // Handle browser tab visibility changes
    this.visibilityChangeHandler = () => {
      if (typeof document !== 'undefined') {
        if (document.hidden) {
          console.log('Page became hidden - websocket may be throttled by browser');
          // Don't disconnect immediately, but prepare for potential issues
        } else {
          console.log('Page became visible - checking websocket connection');
          // Force connection check when page becomes visible again
          this.checkConnectionHealth();
        }
      }
    };

    // Handle network online/offline events
    this.onlineHandler = () => {
      console.log('Network came online - attempting websocket reconnection');
      if (!this.isIntentionallyDisconnected) {
        // Small delay to ensure network is stable
        setTimeout(() => {
          this.forceReconnect();
        }, 1000);
      }
    };

    this.offlineHandler = () => {
      console.log('Network went offline - websocket will reconnect when online');
      // Don't explicitly disconnect, let the reconnection logic handle it
    };

    // Add event listeners (check if we're in browser environment)
    if (typeof window !== 'undefined') {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
      }
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    }
  }

  private removeBrowserEventHandlers() {
    if (typeof window !== 'undefined') {
      if (typeof document !== 'undefined' && this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      }
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler);
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler);
      }
    }
  }

  private checkConnectionHealth() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('Connection health check: websocket not open, attempting reconnection');
      if (!this.isIntentionallyDisconnected) {
        this.connect();
      }
      return;
    }

    // Send a health check ping
    try {
      this.ws.send(JSON.stringify({ 
        channel: 'health_check', 
        timestamp: Date.now() 
      }));
      console.log('Connection health check: ping sent');
    } catch (error) {
      console.error('Connection health check failed:', error);
      // Connection is likely broken, trigger reconnection
      if (this.ws) {
        this.ws.close();
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    try {
      // Store the last message for debugging
      this.lastMessage.set(message);

      // Only process messages with label = "dispenser"
      if (message.data.label !== 'dispenser') {
        return;
      }

      const deviceId = message.data.device;
      const currentStates = get(this.dispenserStates);
      const currentState = currentStates.get(deviceId) || this.createDefaultState(deviceId);

      // Process different message topics
      switch (message.data.topic) {
        case 'sensors':
          this.handleSensorMessage(message, currentState);
          break;
        case 'delivery':
          this.handleDeliveryMessage(message, currentState);
          break;
        case 'device_status':
          this.handleDeviceStatusMessage(message, currentState);
          break;
        case 'item_detection':
          this.handleItemDetectionMessage(message, currentState);
          break;
      }

      // Update last activity timestamp
      currentState.lastActivity = message.timestamp;
      currentState.connected = true;

      // Update the state store
      currentStates.set(deviceId, currentState);
      this.dispenserStates.set(currentStates);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      console.error('Problematic message:', message);
      // Don't break the connection due to message processing errors
    }
  }

  private createDefaultState(deviceId: string): DispenserState {
    return {
      deviceId,
      status: 'UNKNOWN',
      sensors: {
        doorOpened: false,
        drawersUnlocked: false,
        hatchOpened: false
      },
      lastActivity: new Date().toISOString(),
      connected: false
    };
  }

  private handleSensorMessage(message: WebSocketMessage, currentState: DispenserState) {
    if (!message.data.sensors) return;

    const sensors = message.data.sensors;
    const previousSensors = { ...currentState.sensors };

    // Update sensor states
    currentState.sensors.doorOpened = sensors['door-opened'];
    currentState.sensors.drawersUnlocked = sensors['drawers-unlocked'];
    currentState.sensors.hatchOpened = sensors['hatch-opened'];

    // Check for changes and notify user
    if (previousSensors.doorOpened !== sensors['door-opened']) {
      const messageKey = sensors['door-opened'] ? 'door-opened-true' : 'door-opened-false';
      toastService.showInfo(translations.sensors[messageKey]);
    }

    if (previousSensors.drawersUnlocked !== sensors['drawers-unlocked']) {
      const messageKey = sensors['drawers-unlocked'] ? 'drawers-unlocked-true' : 'drawers-unlocked-false';
      toastService.showInfo(translations.sensors[messageKey]);
    }

    if (previousSensors.hatchOpened !== sensors['hatch-opened']) {
      const messageKey = sensors['hatch-opened'] ? 'hatch-opened-true' : 'hatch-opened-false';
      toastService.showInfo(translations.sensors[messageKey]);
    }
  }

  private handleDeliveryMessage(message: WebSocketMessage, currentState: DispenserState) {
    if (!message.data.value) return;

    if (message.data.value === 'delivered') {
      toastService.showSuccess(translations.delivery.delivered);
    } else if (message.data.value === 'ready for picking' && message.data.items) {
      const notDetectedItems = message.data.items.filter(item => !item.detected);
      
      if (notDetectedItems.length > 0) {
        notDetectedItems.forEach(item => {
          const messageText = translations.delivery['ready-for-picking-not-detected']
            .replace('{slot}', item.item_literal);
          toastService.showWarning(messageText);
        });
      } else {
        toastService.showSuccess(translations.delivery['ready-for-picking']);
      }
    }
  }

  private handleDeviceStatusMessage(message: WebSocketMessage, currentState: DispenserState) {
    if (!message.data.state) return;

    const newStatus = message.data.state as 'READY' | 'BUSY';
    const previousStatus = currentState.status;

    currentState.status = newStatus;

    // Only notify if status actually changed
    if (previousStatus !== newStatus) {
      const statusText = translations.deviceStatus[newStatus] || translations.deviceStatus.UNKNOWN;
      toastService.showInfo(`Status: ${statusText}`);
    }
  }

  private handleItemDetectionMessage(message: WebSocketMessage, currentState: DispenserState) {
    if (!message.data.data) return;

    const detection = message.data.data;
    
    if (!detection.detected) {
      const messageText = translations.itemDetection['not-detected']
        .replace('{slot}', detection.item_literal);
      toastService.showWarning(messageText);
    }
  }

  disconnect() {
    this.isIntentionallyDisconnected = true;
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    this.removeBrowserEventHandlers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus.set('disconnected');
  }

  // Force reconnection (useful for manual retry after network issues)
  forceReconnect() {
    console.log('Forcing reconnection...');
    this.reconnectAttempts = 0;
    this.disconnect();
    
    // Brief delay before reconnecting
    setTimeout(() => {
      this.connect();
    }, 100);
  }

  // Configure websocket timeouts
  setTimeouts(options: {
    heartbeatInterval?: number;    // How often to send ping (ms)
    heartbeatTimeout?: number;     // How long to wait for pong (ms)
    connectionCheckInterval?: number; // How often to check connection health (ms)
  }) {
    if (options.heartbeatInterval) {
      this.heartbeatInterval = options.heartbeatInterval;
      console.log(`Heartbeat interval set to ${this.heartbeatInterval/1000}s`);
    }
    if (options.heartbeatTimeout) {
      this.heartbeatTimeout = options.heartbeatTimeout;
      console.log(`Heartbeat timeout set to ${this.heartbeatTimeout/1000}s`);
    }
    if (options.connectionCheckInterval) {
      this.connectionCheckInterval = options.connectionCheckInterval;
      console.log(`Connection check interval set to ${this.connectionCheckInterval/1000}s`);
    }
    
    // Restart heartbeat with new settings if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.startHeartbeat();
    }
  }

  // Get current timeout settings
  getTimeoutSettings() {
    return {
      heartbeatInterval: this.heartbeatInterval,
      heartbeatTimeout: this.heartbeatTimeout,
      connectionCheckInterval: this.connectionCheckInterval,
      heartbeatIntervalSeconds: this.heartbeatInterval / 1000,
      heartbeatTimeoutSeconds: this.heartbeatTimeout / 1000,
      connectionCheckIntervalSeconds: this.connectionCheckInterval / 1000
    };
  }

  // Get reconnection status info
  getReconnectionInfo() {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      isConnecting: this.isConnecting,
      isIntentionallyDisconnected: this.isIntentionallyDisconnected,
      connectionState: this.ws?.readyState,
      url: this.url,
      lastHeartbeat: this.lastHeartbeatResponse ? new Date(this.lastHeartbeatResponse).toISOString() : 'never',
      ...this.getTimeoutSettings()
    };
  }

  // Enhanced debugging information
  getDebugInfo() {
    const wsStates = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN', 
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };

    return {
      ...this.getReconnectionInfo(),
      connectionStateText: this.ws ? wsStates[this.ws.readyState] : 'NO_WEBSOCKET',
      hasEventHandlers: {
        visibility: !!this.visibilityChangeHandler,
        online: !!this.onlineHandler,
        offline: !!this.offlineHandler
      },
      timers: {
        reconnect: !!this.reconnectTimeoutId,
        heartbeat: !!this.heartbeatIntervalId,
        heartbeatTimeout: !!this.heartbeatTimeoutId
      },
      pageVisibility: typeof document !== 'undefined' ? !document.hidden : 'unknown',
      browserOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown'
    };
  }

  // Get current state for a specific dispenser
  getDispenserState(deviceId: string): DispenserState | undefined {
    const states = get(this.dispenserStates);
    return states.get(deviceId);
  }

  // Get all dispenser states
  getAllDispenserStates(): DispenserState[] {
    const states = get(this.dispenserStates);
    return Array.from(states.values());
  }
}

export const websocketService = new WebSocketService();

// Global debugging helper (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).websocketDebug = {
    getInfo: () => websocketService.getDebugInfo(),
    forceReconnect: () => websocketService.forceReconnect(),
    getReconnectionInfo: () => websocketService.getReconnectionInfo(),
    checkHealth: () => websocketService['checkConnectionHealth'](),
    getTimeouts: () => websocketService.getTimeoutSettings(),
    setTimeouts: (options: any) => websocketService.setTimeouts(options),
    service: websocketService,
    
    // Predefined timeout configurations
    presets: {
      conservative: () => websocketService.setTimeouts({
        heartbeatInterval: 120000,    // 2 minutes
        heartbeatTimeout: 60000       // 1 minute
      }),
      moderate: () => websocketService.setTimeouts({
        heartbeatInterval: 60000,     // 1 minute (current default)
        heartbeatTimeout: 30000       // 30 seconds (current default)
      }),
      aggressive: () => websocketService.setTimeouts({
        heartbeatInterval: 30000,     // 30 seconds
        heartbeatTimeout: 15000       // 15 seconds
      }),
      veryLong: () => websocketService.setTimeouts({
        heartbeatInterval: 300000,    // 5 minutes
        heartbeatTimeout: 120000      // 2 minutes
      })
    }
  };
}