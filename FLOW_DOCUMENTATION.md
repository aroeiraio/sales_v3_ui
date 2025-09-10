# InoBag Sales V3 UI - Complete Flow Documentation

## Overview
This document provides a comprehensive analysis of the sales application's UI flow, including user actions, system requirements, timers, and state management. This documentation is designed to facilitate future adjustments and maintenance.

---

## 1. Start Screen Flow (`/`)

### **File**: `src/routes/+page.svelte`

### **Purpose**
Initial landing screen that can function as both a digital signage display and entry point to the shopping experience.

### **States & Requirements**

#### **Digital Signage Mode**
- **Requirements**: 
  - Valid video URLs configured in digital signage settings
  - Video files accessible and playable
- **Behavior**: 
  - Displays fullscreen video player
  - Supports playlist functionality
  - Auto-plays muted videos
  - Click to interact with video controls

#### **Welcome Mode (Default)**
- **UI Elements**:
  - Status bar with current time (updates every second)
  - Logo display (configurable via visual settings)
  - Welcome message: "Bem-vindo à Máquina de Vendas"
  - Subtitle: "Escolha seus produtos favoritos com facilidade"
  - Primary CTA: "Começar Compra" button

### **Timers & Intervals**
- **Time Display**: Updates every 1000ms
- **Visual Settings Refresh**: 15-minute automatic refresh timer
- **Digital Signage Refresh**: 15-minute automatic refresh timer

### **Actions & Transitions**

#### **On Mount**
1. **Session Cleanup**: `sessionService.endSession()` - Destroys any existing session
2. **Data Loading**: Parallel loading of:
   - Visual settings via `visualSettingsActions.loadSettings()`
   - Digital signage data via `digitalSignageActions.loadSignageData()`
3. **Video Initialization**: If valid videos exist, starts playback
4. **Timer Setup**: Initializes refresh timers

#### **User Actions**
- **"Começar Compra" Button** and **Video Click**:
  1. Stops any video playback
  2. Calls `sessionService.startSession()`
  3. Navigates to `/products` via `window.location.href`
- **Video Click**: Calls `digitalSignageActions.onVideoClick()`
- **Video End**: Calls `digitalSignageActions.onVideoEnded()`

### **Error Handling**
- Session errors are logged but don't block UI
- Visual settings loading failures are handled gracefully
- Video loading errors fall back to welcome interface

---

## 2. Products Screen Flow (`/products`)

### **File**: `src/routes/products/+page.svelte` → `src/lib/components/screens/ProductsScreen.svelte`

### **Purpose**
Product catalog display and selection interface with cart management.

### **Requirements**
- Active user session (created from start screen)
- Product data loaded from API
- Cart service initialized

### **UI Components**
- **Header**: Back navigation, page title, time display
- **Product Grid**: Responsive grid of available products
- **Product Cards**: Image, name, price, stock status
- **Quantity Controls**: Add/remove product controls
- **Cart Integration**: Real-time cart updates

### **Session Management**
- **Timeout Reset**: All user interactions call `sessionService.resetTimeout()`
- **Session Validation**: Checks for valid session, redirects if expired

### **Actions & Transitions**

#### **Navigation Actions**
- **Back Button**: Returns to `/` (start screen)
- **Cart Navigation**: Proceeds to `/cart` when cart has items

#### **Product Actions**
- **Add to Cart**: Updates cart via `cartService.addItem()`
- **Update Quantity**: Modifies quantities via `cartService.updateQuantity()`
- **Remove from Cart**: Removes items via `cartService.removeItem()`

### **Real-time Updates**
- Cart state synchronization across components
- Stock level updates
- Price calculations

---

## 3. Cart Screen Flow (`/cart`)

### **File**: `src/routes/cart/+page.svelte`

### **Purpose**
Cart review, item management, and order finalization.

### **Requirements**
- Active user session
- Cart service with stored items
- Visual settings for theming

### **States**

#### **Cart with Items**
- **Summary Section**: Order totals, item count, service fees, discounts
- **Items List**: Product details, quantities, individual prices
- **Action Buttons**: 
  - "Finalizar Pedido" (primary)
  - "Cancelar" (secondary)

#### **Empty Cart**
- **Empty State**: Shopping cart icon, "Seu carrinho está vazio" message
- **Continue Shopping**: Returns to products screen

### **Timers**
- **Time Display**: Updates every 1000ms
- **Session Timeout**: Reset on any user interaction

### **Actions & Transitions**

#### **Item Management**
- **Quantity Update**: 
  - Plus/minus buttons call `updateQuantity(productId, newQuantity)`
  - Includes validation against sale limits
  - Shows success toast notifications
- **Item Removal**: 
  - Trash button or quantity reduction to 0
  - Calls `removeItem(productId)` 
  - Shows success toast confirmation

#### **Navigation Actions**
- **Back to Products**: `window.location.href = '/products'`
- **Proceed to Checkout**: `window.location.href = '/checkout'`
- **Cancel Order**: `window.location.href = '/'` (returns to start)

#### **Cart Synchronization**
- **Service Subscription**: Real-time cart updates via `cartService.subscribe()`
- **Server Sync**: Periodic refresh from server with `cartService.getCart()`

### **Error Handling**
- Cart service errors handled gracefully with fallback UI sync
- Network failures don't block user interactions
- Error dialogs managed by `errorDialogService`

---

## 4. Checkout/Payment Screen Flow (`/checkout`)

### **File**: `src/routes/checkout/+page.svelte`

### **Purpose**
Comprehensive payment processing with multiple payment methods and states.

### **Requirements**
- Active user session
- Non-empty cart
- Available payment brokers from checkout service
- Payment service initialization

### **Payment States**

#### **4.1 Payment Selection State (`idle`)**

**UI Elements**:
- Payment method cards (PIX, Credit, Debit)
- Order summary with itemized list
- Debug testing buttons (development)

**Available Methods**:
- **PIX** (`MERCADOPAGO-mercadopago`): QR code payment
- **Credit Card** (`MERCADOPAGO_PINPAD-credit`): Chip/contactless
- **Debit Card** (`MERCADOPAGO_PINPAD-debit`): Chip/contactless

**Actions**:
- **Method Selection**: Calls `selectPaymentMethod(methodId)` with 500ms delay
- **Payment Processing**: Calls `paymentService.processPayment(methodId)`

#### **4.2 Processing State (`processing`)**

**Duration**: Variable (typically 3-10 seconds)

**UI Elements**:
- Loading spinner animation
- Processing steps visualization
- Payment amount display
- Selected method confirmation

**PIX-Specific Processing**:
- "Preparando PIX" messaging
- "Gerando QR Code" step indication
- Different animation for QR code generation

**Card-Specific Processing**:
- Generic "Processando pagamento" messaging
- Card validation steps
- Payment authorization flow

#### **4.3 PIX QR Code State (`show_qrcode`)**

**Timer**: 60-second countdown with auto-timeout
**UI Elements**:
- QR code image display (from `paymentResult.qrcode_source`)
- Payment amount prominent display  
- 6-step payment instructions
- Countdown timer with circular progress
- Cancel payment option

**Instructions Flow**:
1. "Abra o aplicativo do seu banco"
2. "Escolha a opção 'Pagar com PIX'"
3. "Escaneie o QR Code exibido na tela" 
4. "Confirme as informações e valor"
5. "Aguarde a confirmação do pagamento"
6. "Aguarde a liberação dos itens"

**Timer Behavior**:
- **Countdown**: Decrements every 1000ms from 60 to 0
- **Timeout Action**: Calls `paymentService.cancelPayment()`, transitions to `retry` state
- **Manual Cancel**: Available throughout countdown period

#### **4.4 Card Payment State (`insert_tap_card`)**

**UI Elements**:
- Step-by-step pinpad instructions
- Visual progress indicators
- Button press indicators (red/green)
- Card insertion guidance

**Instruction Steps**:
1. **Press Buttons**: Red button → Green button sequence
2. **Insert/Tap Card**: Chip insertion or contactless tap
3. **Wait for Confirmation**: Transaction processing
4. **Remove Card**: When prompted by pinpad

#### **4.5 Success State (`success`)**

**Features**:
- **Success Animation**: Pulsing package icon
- **Status Badge**: "Pagamento Aprovado" confirmation
- **Progress Tracking**: Real-time delivery status updates
- **Transaction Details**: Receipt with transaction ID, timestamp, items, total

**Delivery Integration**:
- **Polling**: Starts `deliveryService.startPolling()` for status updates
- **Progress Steps**: Dynamic step display based on delivery status
- **Auto-Transition**: 5-second delay after delivery completion → `/end`

**Receipt Information**:
- Transaction ID (generated)
- Timestamp (ISO format)
- Item list with quantities and prices
- Total amount
- Payment method used

#### **4.6 Error States**

**Failed State (`failed`)**:
- Error animation with exclamation mark
- "Pagamento Recusado" messaging
- Return to start option

**Retry State (`retry`)**:
- **Retry Limit**: Maximum 3 attempts (`maxRetries = 3`)
- **Retry Button**: Calls `paymentService.retryPayment()`
- **Exceeded Limit**: Shows "Limite de tentativas excedido"

**Timeout State (`payment_timeout`)**:
- Clock icon with error styling
- "Tempo esgotado" message
- Retry and cancel options

### **Session & State Management**

#### **Payment State Transitions**
```
idle → processing → show_qrcode → success → (delivery tracking) → /end
  ↓      ↓            ↓           ↓
retry ← failed ← payment_timeout
  ↓
idle (if retries < maxRetries)
  ↓  
/ (if retries >= maxRetries)
```

#### **Service Integration**
- **Checkout Service**: `checkoutService.performCheckout()` for broker availability
- **Payment Service**: State management with `onStateChange()` callback
- **Delivery Service**: Status polling with callback updates
- **Error Service**: `errorDialogService` for user notifications

#### **Cleanup & Timeouts**
- **Component Unmount**: Stops all polling services
- **Payment Timeout**: Automatic cancellation and state reset
- **Session Reset**: `sessionService.resetTimeout()` on user interactions

---

## 5. End/Thank You Screen Flow (`/end`)

### **File**: `src/routes/end/+page.svelte`

### **Purpose**
Order completion confirmation and return to shopping flow.

### **Requirements**
- Completed successful payment
- Transaction completion

### **UI Elements**
- **Success Animation**: Scaling checkmark with timing
- **Thank You Message**: "Obrigado pela sua compra!"
- **Order Information**: Generated order number with receipt icon
- **Action Button**: "Fazer Nova Compra"
- **Auto-Redirect**: Countdown timer display

### **Timers & Animation**

#### **Animation Sequence**
- **Component Mount**: 200ms delay before animation start
- **Circle Animation**: 400ms scale animation (`circle-scale`)
- **Checkmark Animation**: 300ms appearance with 600ms delay (`checkmark-appear`)

#### **Auto-Redirect Timer**
- **Duration**: 10 seconds countdown
- **Interval**: Updates every 1000ms
- **Action**: Automatic navigation to `/` (start screen)
- **Manual Override**: "Fazer Nova Compra" button immediate redirect

### **Actions & Transitions**
- **Manual Return**: `goto('/')` via action button
- **Automatic Return**: `goto('/')` after countdown completion
- **Cleanup**: Interval cleared on component destroy

---

## System Requirements & Dependencies

### **Service Dependencies**
1. **Session Service**: User session management and timeouts
2. **Cart Service**: Shopping cart state and persistence  
3. **Payment Service**: Payment processing and state management
4. **Checkout Service**: Payment broker availability
5. **Delivery Service**: Order fulfillment tracking
6. **Visual Settings Service**: UI theming and branding
7. **Digital Signage Service**: Video content management
8. **Error Dialog Service**: User error communication

### **External Integrations**
- **MercadoPago**: PIX and card payment processing
- **Pinpad Integration**: Physical card reader hardware
- **Media Server**: Video and image content delivery
- **Backend APIs**: Product catalog, order management, configuration

### **Browser Requirements**
- **ES6+ Support**: Modern JavaScript features
- **Video Playback**: HTML5 video element support
- **Local Storage**: Session and cart persistence
- **Fullscreen API**: Digital signage video display
- **Touch Events**: Mobile and tablet interaction

---

## Configuration & Customization

### **Visual Settings**
- **Background**: Image or color customization
- **Logo**: Custom logotype display
- **Fonts**: Typography configuration
- **Colors**: Brand color theming

### **Payment Configuration**
- **Broker Availability**: Dynamic payment method selection
- **Timeout Settings**: PIX countdown duration
- **Retry Limits**: Maximum payment retry attempts
- **Service Fees**: Additional charges configuration

### **Session Management**
- **Timeout Duration**: User inactivity limits
- **Interaction Reset**: Actions that extend session
- **Cleanup Behavior**: Session end procedures

### **Content Management**
- **Product Data**: API-driven catalog
- **Digital Signage**: Video playlist configuration
- **Messaging**: Customizable text content
- **Images**: Dynamic media loading

---

## Development & Debugging

### **Debug Features** (Development Mode)
- **Payment State Testing**: Buttons to simulate all payment states
- **State Transitions**: Manual triggering of success/failure scenarios
- **Timer Controls**: Override automatic timeouts
- **Service Mocking**: Isolated component testing

### **Error Handling Strategy**
- **Graceful Degradation**: UI continues functioning with service failures
- **User Feedback**: Clear error messages and recovery options
- **Logging**: Comprehensive error tracking for debugging
- **Fallback Behavior**: Alternative flows when services unavailable

### **Performance Considerations**
- **Image Optimization**: Responsive image loading
- **Service Polling**: Efficient background updates
- **Memory Management**: Timer and interval cleanup
- **Touch Optimization**: Large touch targets for kiosk use

---

## Future Enhancement Opportunities

### **User Experience**
- **Accessibility**: Screen reader and keyboard navigation support
- **Multi-language**: Internationalization support
- **Offline Mode**: Enhanced offline functionality
- **Voice Interaction**: Voice-guided shopping experience

### **Business Features**
- **Loyalty Integration**: Customer account management
- **Promotional Offers**: Dynamic pricing and discounts
- **Inventory Integration**: Real-time stock management
- **Analytics**: User behavior tracking and optimization

### **Technical Improvements**
- **Progressive Web App**: Installable kiosk application
- **Performance Monitoring**: Real-time performance metrics
- **A/B Testing**: UI variation testing framework
- **Security Enhancements**: Enhanced payment security measures

---

*This documentation should be updated whenever flow modifications are made to ensure accuracy for future development and maintenance.*
