# Projeto: Interface PoS para Tablets - Máquinas de Venda

## Visão Geral do Projeto

Este documento detalha o desenvolvimento de 


Construa uma **interface moderna Point of Sale (PoS)** otimizada para **máquinas de venda automática** executando em **tablets no modo retrato**. 
A solução utiliza e prioriza **experiência touch-first**, **design minimalista** e **integração fluida com APIs**.

---

## Arquitetura do Sistema
- **Stack**: Svelte + Tailwind CSS
- **API**: Irá consumir uma REST API (backend separado - disponível em http://localhost:8090/interface/)
- **Lingua**: Português Brasileiro


**Requisitos Offline:**
- Todos os assets devem ser **bundled localmente**
- Sem dependências de CDN para garantir **disponibilidade offline**
- Build otimizado para **startup rápido**

---

## Requisitos Funcionais

### 1.1 Configuração Geral

**Idioma e Localização:**
- Todos os textos em **Português Brasileiro**
- Formatação de moeda: R$ (Real)
- Formato de data/hora: dd/MM/yyyy HH:mm

**Branding Dinâmico:**
- Configuração visual via API `GET /visual_settings`
- Fallback para estilos neutros se API retornar `null`
- Logo da empresa carregado dinamicamente
- Paleta de cores personalizável

**Controle de Sessão:**
```javascript
// Iniciar sessão
POST /interface/session

// Destruir sessão
DELETE /interface/session

// Timeout de inatividade: 60s (exceto Start/Transaction screens)
```

**Sistema de Feedback:**
- **Sucesso**: Snackbar verde com ícone com fadeout de 3s ✓
- **Erro**: Snackbar vermelho com ícone com fadeout de 5s ✗
- **Aviso**: Snackbar amarelo com ícone com fadeout de 3s⚠
- **Loading**: Skeleton loaders e progress indicators

### 1.2 Otimização para Hardware

**Contexto Touch-First:**
- Targets de toque mínimos: 44x44px
- Sem estados hover
- Gestos de swipe para navegação

**Performance:**
- Lazy loading de imagens
- Virtual scrolling para listas longas
- Debounce em inputs de busca
- Cache de dados frequentes no localStorage

**Responsividade:**
- Suporte a tablets 10 a 23 polegadas
- Resolução HD e FullHD
- Orientação portrait prioritária

---

## Fluxo de Telas

### 2. Tela Inicial (Start Screen)

**Layout e Componentes:**
- Background: cor/imagem de `/visual_settings`
- Logo centralizado (fonte: `/visual_settings`)
- Call-to-Action: **"Toque aqui para começar"**
- Vídeos promocionais de `/digital_signage` (se disponível)

Basear-se no documento 01_initial_screen.md


**Funcionalidade:**
1. Ao tocar na tela → `POST /interface/session`
2. Redirect para **Showcase de Produtos**
3. Destruir sessão anterior (se existir)

### 3. Showcase de Produtos

**Layout Responsivo:**
- **Sidebar esquerda**: Lista de categorias (scrollável)
- **Área principal**: Grid de produtos com cards

**APIs Utilizadas:**
- `GET /interface/categories` - Lista de categorias
- `GET /interface/products/{categoryId}` - Produtos por categoria

**Estados de Loading:**
- Skeleton loaders para cards
- Shimmer effect durante carregamento de imagens
- Progress linear para mudança de categoria

Basear-se no documento 02_products.md

### 4. Carrinho de Compras

**API Endpoints:**
```javascript
// Gerenciamento do carrinho
POST /interface/cart/     // Adicionar item
DELETE /interface/cart/   // Remover item  
GET /interface/cart/      // Listar itens
```

Basear se no documento: 03_cart.md

**Tratamento de Erros:**
- Estoque esgotado: "Produto indisponível no momento"
- Máximo items permitido: "Número máximo de itens alcançado"
- Erro de rede: "Erro de conexão. Tente novamente."
- Sucesso: "Produto adicionado ao carrinho!"

### 5. Checkout

**API Endpoint:**
```javascript
GET /interface/checkout 
```
Responde com a lista de sistemas de pagamento disponíveis. Essa lista deve ser visualizada na tela.

Exemplo:

[    {
        "available": true,
        "broker": "MERCADOPAGO",
        "methods": [
            "qrcode"
        ]
    },
    {
        "available": true,
        "broker": "MERCADOPAGO_PINPAD",
        "methods": [
            "debit_card",
            "credit_card"
        ]
    },
    {
        "timestamp": "2025-09-05T11:07:39.264"
    }
]

Deve ser visualizado 3 opções [Mercado Pago: QRCode] [Mercado Pago: Débito] [ Mercado Pago: Crédito ] 

Basear se no documento: 04_checkout.md


### 6. Escolha do sistema de pagamento

Se crédito, basear-se no documento 06_payment_with_card.md
Se pix, basear-se no documento 05_payment_with_pix.md


### 7. Resultado do Pagamento 

**Estados de Pagamento:**
- ✅ **Aprovado**: Tela verde com animação de sucesso - 08_payment_approved.md
- ❌ **Negado**: Tela vermelha com opção de retry - basear se no documento 07_payment_refused.md
- ⏳ **Processando**: Loading com timeout

Se aprovado, status de Entrega

**Fases de Entrega:**
1. **Preparando**: Selecionando produtos
2. **Dispensando**: Produtos sendo liberados
3. **Concluído**: Retire seus produtos

#### 8. Agradecendo pela compra
Basear-se no documento 09_end_screen.md

- Finalizar sessão e ir para tela inicial após 10s. Se pessionado o botão, ir para tela inicial.

