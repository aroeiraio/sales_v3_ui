# Dashboard - Monitor de Dispensers WebSocket

Este novo sistema foi criado para monitorar em tempo real os eventos dos dispensers através de WebSocket, complementando o dashboard administrativo existente.

## 🚀 Como Acessar

### Através do Dashboard Principal (Integrado)
```
http://localhost:8092/
```

**Passo a passo**:
1. **Acesse a página inicial**: `http://localhost:8092/`
2. **Ative o dashboard**: Long press (10s) no ícone ⚙️ no canto inferior direito
3. **Faça login**: Username: `repositor`, Password: `1234` 
4. **Selecione "Monitor de Dispensers"**: Nova opção na grade de ações
5. **Use o demo**: Clique "▶️ Iniciar Demo" para simular eventos

### Dashboard Monitor Standalone
```
http://localhost:8092/dashboard
```
- Conecta ao WebSocket real em `ws://localhost:9010`
- Mostra dados em tempo real dos dispensers  

### Dashboard Demo Standalone
```
http://localhost:8092/dashboard/demo
```
- Simula mensagens WebSocket para demonstração
- Útil para testes independentes

## 🎯 Funcionalidades Implementadas

### 1. Conexão WebSocket Robusta
- **URL**: `ws://localhost:9010`
- **Reconexão automática**: Até 5 tentativas com delay progressivo
- **Status visual**: Indicador em tempo real da conexão
- **Tratamento de erros**: Recuperação automática de falhas

### 2. Monitoramento de Eventos

#### 📡 Sensores (`topic: sensors`)
- **Porta**: `door-opened = true/false` → "Porta aberta/fechada"  
- **Gaveta**: `drawers-unlocked = true/false` → "Trava da gaveta destravada/travada"
- **Portinhola**: `hatch-opened = true/false` → "Portinhola aberta/fechada"

#### 📦 Entrega (`topic: delivery`)
- **Entregue**: `value = delivered` → "Itens retirados"
- **Pronto p/ retirada**: `value = ready for picking` + `detected = false` → "Item em A1 não foi detectado, mas itens estão prontos para retirada"

#### 🔍 Detecção (`topic: item_detection`)  
- **Item perdido**: `detected = false` → "Item em A1 não foi detectado"

#### ⚡ Status (`topic: device_status`)
- **Pronto**: `state = READY` → "Pronto"
- **Ocupado**: `state = BUSY` → "Ocupado"

### 3. Interface de Usuário Intuitiva

#### 🔔 Sistema de Notificações Toast
- **Eventos transitórios**: Notificações automáticas (3-5 segundos)
- **Cores inteligentes**:
  - ✅ **Verde**: Entregas realizadas, conexões estabelecidas
  - ⚠️ **Amarelo**: Itens não detectados, avisos
  - ℹ️ **Azul**: Mudanças de status, informações de sensores
  - ❌ **Vermelho**: Falhas de conexão, erros críticos

#### 📊 Indicadores Persistentes
- **Status Badge**: Estado atual (PRONTO/OCUPADO/DESCONECTADO)
- **Indicadores de Sensores**: Estado visual de porta/gaveta/portinhola
- **Status de Conexão**: Conectado/Desconectado/Reconectando com ícones

### 4. Sistema Anti-Spam
- **Rastreamento inteligente**: Armazena último estado conhecido
- **Comparação de mudanças**: Notifica apenas quando há mudança real
- **Cache eficiente**: Mantém histórico da última atividade
- **Prevenção de duplicatas**: Evita notificações repetidas

## 🏗️ Arquitetura Técnica

### Estrutura de Arquivos
```
src/lib/
├── components/
│   ├── dashboard/
│   │   └── DispenserMonitor.svelte    # Componente principal
│   └── ui/
│       ├── StatusBadge.svelte         # Badge de status 
│       ├── SensorIndicator.svelte     # Indicador de sensores
│       ├── ConnectionStatus.svelte    # Status da conexão
│       └── Toast.svelte               # Sistema de notificações
└── services/
    └── websocketService.ts            # Serviço WebSocket principal

src/routes/
├── dashboard/
│   ├── +page.svelte                   # Página monitor principal  
│   └── demo/
│       └── +page.svelte               # Página de demonstração
```

### Serviço WebSocket (`websocketService.ts`)
```typescript
class WebSocketService {
  // Conexão robusta com reconexão automática
  connect(): void
  disconnect(): void
  
  // Stores reativas para componentes Svelte
  dispenserStatesStore: Readable<DispenserState[]>
  connectionStatusStore: Readable<ConnectionStatus>
  lastMessageStore: Readable<WebSocketMessage>
  
  // Métodos de consulta
  getDispenserState(deviceId: string): DispenserState | undefined
  getAllDispenserStates(): DispenserState[]
}
```

## 📋 Exemplos de Mensagens WebSocket

### Mudança de Sensor
```json
{
    "channel": "dispenser",
    "data": {
        "device": "dispenser_1",
        "label": "dispenser",
        "sensors": {
            "door-opened": false,
            "drawers-unlocked": false, 
            "hatch-opened": true,
            "timestamp": "2025-09-12T10:35:58.922"
        },
        "topic": "sensors"
    },
    "timestamp": "2025-09-12T10:35:59"
}
```

### Item Entregue
```json
{
    "channel": "dispenser", 
    "data": {
        "device": "dispenser_1",
        "label": "dispenser",
        "topic": "delivery",
        "value": "delivered",
        "items": [
            {
                "detected": false,
                "item": 1,
                "item_literal": "A1"
            }
        ]
    },
    "timestamp": "2025-09-12T10:35:58"
}
```

### Status do Dispositivo  
```json
{
    "channel": "device_status",
    "data": {
        "device": "dispenser_1", 
        "label": "dispenser",
        "state": "READY",
        "topic": "device_status"
    },
    "timestamp": "2025-09-12T10:33:29"
}
```

## 🚀 Como Usar

### Monitor em Tempo Real
1. **Navegue**: `http://localhost:8092/dashboard`
2. **Conexão automática**: Sistema conecta ao WebSocket automaticamente
3. **Visualização**: Dispensers aparecem conforme enviam mensagens
4. **Notificações**: Toast notifications para eventos importantes  
5. **Reconexão**: Sistema tenta reconectar automaticamente se desconectado

### Modo Demonstração (Para Testes)
1. **Navegue**: `http://localhost:8092/dashboard/demo` 
2. **Inicie demo**: Clique "Iniciar Demo" para simular mensagens
3. **Observe**: Notificações e mudanças de estado em tempo real
4. **Controle**: Clique "Parar Demo" para interromper simulação

## 🎨 Customização

### Alterar Traduções Portuguesas
Edite o objeto `translations` em `websocketService.ts`:
```typescript
const translations = {
  sensors: {
    'door-opened-true': 'Porta aberta',
    'door-opened-false': 'Porta fechada',
    // ... outras traduções
  }
  // ... outros grupos de mensagens  
};
```

### Personalizar Cores e Estilos
Modifique as classes CSS nos componentes UI:
```css
.status-ready {
  background-color: #dcfce7; /* Verde claro */
  color: #166534;            /* Verde escuro */
  border-color: #bbf7d0;     /* Borda verde */
}
```

### Adicionar Novos Tipos de Evento
Implemente novos handlers no `websocketService.ts`:
```typescript
private handleMessage(message: WebSocketMessage) {
  switch (message.data.topic) {
    case 'sensors':
      this.handleSensorMessage(message, currentState);
      break;
    case 'my_new_topic':  // ← Novo tipo de evento
      this.handleMyNewTopic(message, currentState);
      break;
  }
}
```

## 🔧 Recursos Técnicos Avançados

### Estado Reativo com Svelte Stores
```typescript
// Assinatura reativa para mudanças de estado
websocketService.dispenserStatesStore.subscribe(states => {
  dispenserStates = Array.from(states.values());
});
```

### Tratamento de Reconexão Inteligente  
```typescript
private attemptReconnect() {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
  
  this.reconnectAttempts++;
  setTimeout(() => {
    this.connect(); 
  }, this.reconnectDelay * this.reconnectAttempts); // Delay progressivo
}
```

### Filtragem de Mensagens
```typescript  
// Processa apenas mensagens de dispensers
if (message.data.label !== 'dispenser') {
  return; // Ignora outras mensagens
}
```

## 🎯 Diferenças do Dashboard Administrativo

### Dashboard Administrativo (Existente)
- **Foco**: Controle manual de hardware (porta, portinhola, motores)
- **Autenticação**: Login obrigatório com credenciais
- **Operações**: Reabastecimento, testes de motor, gestão de estoque
- **Interface**: Botões de ação e formulários

### Monitor de Dispensers (Novo)
- **Foco**: Monitoramento passivo em tempo real  
- **Sem autenticação**: Acesso direto ao monitor
- **Informações**: Status, sensores, eventos de entrega
- **Interface**: Indicadores visuais e notificações automáticas

Ambos sistemas são complementares e podem ser usados simultaneamente para operação completa do sistema de vending machines.