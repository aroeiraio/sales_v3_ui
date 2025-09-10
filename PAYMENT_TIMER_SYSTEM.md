# Payment Timer System Documentation

## Overview

The InoBag Sales V3 UI implements a comprehensive timer system to manage payment timeouts and ensure proper resource cleanup. This system handles multiple types of timers for different payment scenarios and user interaction states.

## Timer Types

### 1. Session Inactivity Timer (60 seconds)
- **Purpose**: Prevents indefinite idle sessions on the checkout screen
- **Duration**: 60 seconds
- **Location**: `src/routes/checkout/+page.svelte`
- **Behavior**: 
  - Active only during payment method selection (`idle` state)
  - Shows warning dialog at 11 seconds remaining
  - Automatically redirects to home page on timeout
  - **Disabled during active payments**

### 2. PIX QR Code Payment Timer (60 seconds)
- **Purpose**: Limits time for customer to complete PIX payment after QR code display
- **Duration**: 60 seconds
- **Location**: `src/routes/checkout/+page.svelte:startQRCodeCountdown()`
- **Behavior**:
  - Starts when entering `show_qrcode` state
  - Displays countdown with circular progress indicator
  - **Cancels payment via API** when timeout reached
  - Transitions to `retry` state on timeout

### 3. Card Payment Timer (180 seconds) 
- **Purpose**: Prevents indefinite card payment operations
- **Duration**: 180 seconds (3 minutes)
- **Location**: `src/routes/checkout/+page.svelte:startCardPaymentCountdown()`
- **Behavior**:
  - Starts when entering `insert_tap_card` state
  - Displays countdown with circular progress indicator
  - **Cancels payment via API** when timeout reached
  - Transitions to `payment_timeout` state on timeout

### 4. Payment Service Timeout (30 seconds)
- **Purpose**: QR code generation timeout for PIX payments
- **Duration**: 30 seconds
- **Location**: `src/lib/services/payment.ts:startWaitTimeout()`
- **Behavior**:
  - Monitors QR code generation process
  - **Cancels payment via API** if QR code not generated in time
  - Transitions to `payment_timeout` state

## Timer State Management

### Inactivity Timer Lifecycle

| Payment State | Inactivity Timer Status | Reason |
|---------------|------------------------|---------|
| `idle` | ✅ **Active** | User selecting payment method |
| `processing` | ❌ **Cancelled** | User actively engaged in payment |
| `show_qrcode` | ❌ **Cancelled** | User scanning QR code |
| `insert_tap_card` | ❌ **Cancelled** | User interacting with card reader |
| `success/failed/retry` | ❌ **Cancelled** | Payment completed/failed |
| Return to `idle` | ✅ **Restarted** | Back to payment selection |

### Payment Timer Coordination

**Only one payment timer is active at a time:**

```typescript
// PIX Payment Flow
idle → processing → show_qrcode → success/failed
       [30s API]    [60s QR]

// Card Payment Flow  
idle → processing → insert_tap_card → success/failed
       [30s API]    [180s Card]
```

## Payment Cancellation System

### Automatic Timeout Cancellation

All payment timeouts trigger the same cancellation sequence:

1. **API Cancellation**: `paymentService.cancelPayment()`
   - Sends `DELETE http://localhost:8090/interface/payment`
   - Stops backend payment processing

2. **Service Cleanup**: `paymentService.resetPayment()`
   - Stops status polling
   - Clears internal state

3. **UI State Transition**: Navigate to appropriate error state
   - QR Code timeout → `retry` state
   - Card timeout → `payment_timeout` state

### Manual Cancel Button

The "Cancelar" button performs the same cancellation for active payments:

```typescript
async function cancelPayment() {
  const activePaymentStates = ['processing', 'show_qrcode', 'insert_tap_card', 'wait'];
  if (activePaymentStates.includes(paymentState)) {
    await paymentService.cancelPayment(); // API cancellation
  }
  
  clearQRCodeCountdown();           // Clear QR timer
  clearCardPaymentCountdown();      // Clear card timer
  paymentService.stopPolling();     // Stop status polling
  paymentService.resetPayment();    // Reset service state
  goto('/cart');                    // Return to cart
}
```

## Implementation Details

### Timer Functions

#### Session Timeout
```typescript
// Start: 60s inactivity timer with progress dialog
function startSessionTimeout()

// Reset: Restart timer (user interaction)
function resetSessionTimeout()

// Cancel: Stop timer (payment started)
function cancelSessionTimeout()
```

#### QR Code Timer
```typescript
// Start: 60s countdown with visual indicator
function startQRCodeCountdown()

// Clear: Stop timer and cleanup
function clearQRCodeCountdown()
```

#### Card Payment Timer
```typescript
// Start: 180s countdown with visual indicator  
function startCardPaymentCountdown()

// Clear: Stop timer and cleanup
function clearCardPaymentCountdown()
```

### Visual Countdown Components

Both payment timers display visual feedback:

- **Circular Progress Ring**: SVG-based countdown visualization
- **Numeric Display**: Real-time seconds remaining
- **Status Message**: "Complete o pagamento antes que o tempo expire"

### Error Handling

All timeout scenarios include robust error handling:

```typescript
try {
  await paymentService.cancelPayment();
  console.log('Payment cancelled by timeout/user');
} catch (error) {
  console.error('Error cancelling payment:', error);
  // Continue with cleanup regardless of API success
}
```

## Benefits

### 1. **Resource Management**
- Prevents orphaned payment sessions
- Ensures backend cleanup on timeout
- Stops unnecessary polling and timers

### 2. **User Experience**
- Clear visual feedback on time limits
- Consistent timeout behavior across payment types
- Graceful degradation on errors

### 3. **System Reliability**
- No indefinite payment operations
- Proper state management during transitions
- Comprehensive cleanup on all exit paths

### 4. **Security**
- Prevents session hijacking through abandoned payments
- Enforces time limits on sensitive operations
- Automatic cleanup of payment contexts

## Configuration

### Timer Durations
```typescript
const SESSION_TIMEOUT = 60000;        // 60 seconds - session inactivity
const QR_CODE_TIMEOUT = 60000;        // 60 seconds - PIX payment completion
const CARD_PAYMENT_TIMEOUT = 180000;  // 180 seconds - card payment completion  
const API_TIMEOUT = 30000;            // 30 seconds - QR code generation
```

### State Definitions
```typescript
type PaymentState = 
  | 'idle'              // Payment method selection
  | 'wait'              // Waiting for payment service
  | 'processing'        // Payment being processed
  | 'show_qrcode'       // QR code displayed for PIX
  | 'insert_tap_card'   // Card payment in progress
  | 'success'           // Payment completed successfully
  | 'failed'            // Payment failed permanently
  | 'retry'             // Payment failed, retry allowed
  | 'payment_timeout';  // Payment timed out
```

## Testing

### Manual Testing Scenarios

1. **Inactivity Timeout**
   - Navigate to checkout screen
   - Wait 60 seconds without interaction
   - Verify redirect to home page

2. **QR Code Timeout**
   - Select PIX payment method
   - Wait for QR code display
   - Wait 60 seconds without payment
   - Verify transition to retry screen

3. **Card Payment Timeout**
   - Select card payment method
   - Wait for card insertion screen
   - Wait 180 seconds without completing payment
   - Verify transition to timeout screen

4. **Manual Cancellation**
   - Start any payment type
   - Click "Cancelar" during payment
   - Verify API cancellation request
   - Verify return to cart

### Debug Functions

The system includes debug functions for testing payment states:

```typescript
// Simulate different payment scenarios
simulateQRCodeScreen()      // Test QR code flow
simulateProcessingPayment() // Test processing state
simulateTimeoutScreen()     // Test timeout handling
```

## Maintenance

### Adding New Payment Types

To add a new payment type with timeout:

1. **Add Payment State**: Update `PaymentState` type
2. **Create Timer Functions**: Follow pattern of existing timers
3. **Add State Handling**: Update state change listener
4. **Implement UI**: Create countdown component
5. **Add Cancellation**: Include in `activePaymentStates` array

### Modifying Timeout Durations

Timer durations can be adjusted by changing the constants:

```typescript
// Increase card payment timeout to 5 minutes
const CARD_PAYMENT_TIMEOUT = 300000; // 300 seconds
```

Update both the timer logic and any UI components that reference the duration.

## Troubleshooting

### Common Issues

1. **Timer Not Starting**
   - Check payment state transitions
   - Verify state change listener is active
   - Ensure component is properly mounted

2. **Timer Not Stopping** 
   - Verify cleanup functions are called
   - Check for proper interval clearing
   - Ensure all exit paths call cleanup

3. **API Cancellation Failing**
   - Check network connectivity
   - Verify payment service endpoint
   - Monitor console for error messages

### Debug Logging

Enable debug logging for timer operations:

```typescript
console.log('Timer started:', paymentState, countdownTimer);
console.log('Timer expired:', paymentState);
console.log('Payment cancelled:', result);
```