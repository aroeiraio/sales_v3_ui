# Payment Flow Documentation

## Overview
This document describes the complete payment flow for the SvelteKit sales application, including all payment methods, timers, state transitions, and success/failure scenarios.

---

## Payment Methods Supported

### 1. PIX Payment (`pix`)
- **Broker**: `MERCADOPAGO`
- **Method**: `pix`
- **UI Flow**: QR Code display

### 2. Credit Card Payment (`credit`)
- **Broker**: `MERCADOPAGO_PINPAD`
- **Method**: `credit`
- **UI Flow**: Card insertion/tap

### 3. Debit Card Payment (`debit`)
- **Broker**: `MERCADOPAGO_PINPAD`
- **Method**: `debit`
- **UI Flow**: Card insertion/tap

---

## Complete Payment Flow

## Initial State: `idle`
- **Description**: Payment system ready to accept new payment
- **Active Components**: PaymentMethodSelection
- **Timers**: None
- **Actions**: User selects payment method

---

## PIX Payment Flow

### State 1: `processing`
**Entry Point**: User selects PIX payment method
**Duration**: ~2 seconds
**Active Components**: PaymentProcessing
**Timers Started**: 
- ⏱️ **30-second QR Generation Timeout** (payment.ts:startWaitTimeout)
  - Purpose: Cancel if QR code not generated within 30s
  - Location: `paymentService.startWaitTimeout()`
  - Cleanup: Cleared when QR code is ready

**API Calls**: 
- POST `/interface/payment` with `{broker: 'MERCADOPAGO', method: 'pix'}`
- Starts status polling every 1 second

**Success Path**: → `wait` state
**Failure Path**: → `failed` state

### State 2: `wait` 
**Entry Point**: From `processing` when API call succeeds
**Duration**: Variable (waiting for QR generation)
**Active Components**: PaymentProcessing (loading state)
**Timers Active**:
- ⏱️ **30-second QR Generation Timeout** (continues from processing)

**Status Polling**: Receives `action: 'WAIT'` from API
**Success Path**: → `show_qrcode` state
**Failure Path**: → `payment_timeout` state (if 30s timeout expires)

### State 3: `show_qrcode`
**Entry Point**: From `wait` when QR code is generated
**Duration**: 60 seconds (user payment window)
**Active Components**: PixQrCodePayment
**Timers Started**:
- ⏱️ **60-second User Payment Timer** (PixQrCodePayment component)
  - Purpose: Give user time to complete PIX payment
  - Location: `PixQrCodePayment.svelte:startCountdown()`
  - Display: Countdown circle showing remaining seconds
**Timers Cleared**:
- ✅ **30-second QR Generation Timeout** (cleared when QR is ready)

**Status Polling**: Continues, waiting for `action: 'RELEASE'` with `status: 'PAYMENT_APPROVED'`
**Success Path**: → `success` state
**Failure Paths**: 
- → `payment_timeout` state (if 60s expires)
- → `retry` state (if payment refused)

---

## Card Payment Flow (Credit/Debit)

### State 1: `processing`
**Entry Point**: User selects credit or debit payment
**Duration**: ~2 seconds  
**Active Components**: PaymentProcessing
**Timers**: None (no timeout for card payments)

**API Calls**: 
- POST `/interface/payment` with `{broker: 'MERCADOPAGO_PINPAD', method: 'credit|debit'}`
- Starts status polling every 1 second

**Success Path**: → `insert_tap_card` state
**Failure Path**: → `failed` state

### State 2: `insert_tap_card`
**Entry Point**: From `processing` when API accepts card payment
**Duration**: 180 seconds (3 minutes)
**Active Components**: CardPayment
**Timers Started**:
- ⏱️ **180-second Card Payment Timer** (checkout/+page.svelte:startCardPaymentCountdown)
  - Purpose: Timeout if user doesn't insert card
  - Location: Parent component
  - Display: Countdown in CardPayment component

**Status Polling**: Waiting for card insertion/tap
**Success Path**: → `success` state (when card processed)
**Failure Paths**: 
- → `payment_timeout` state (if 180s expires)
- → `retry` state (if card refused)

---

## Success States

### State: `success`
**Entry Point**: From any payment method when `status: 'PAYMENT_APPROVED'`
**Duration**: Indefinite (until user action)
**Active Components**: PaymentSuccess
**Timers**: None
**Side Effects**: 
- Cart is cleared automatically
- Payment polling stops
- Transaction ID stored

**Actions Available**:
- Return to home
- Print receipt (if available)

---

## Failure States

### State: `failed`
**Entry Point**: From any payment method on API errors or connection failures
**Duration**: Indefinite (until user action)
**Active Components**: PaymentFailure
**Timers**: None

**Actions Available**:
- Return to home
- Cancel transaction

### State: `retry`
**Entry Point**: When payment is refused (`status: 'PAYMENT_REFUSED'`)
**Duration**: 60 seconds with auto-redirect
**Active Components**: PaymentFailure (with retry options)
**Timers Started**:
- ⏱️ **60-second Auto-redirect Timer** (PaymentFailure component)
  - Purpose: Auto-return to home if user doesn't act
  - Display: Countdown circle in component
  - Stops: When user takes action

**Actions Available**:
- Retry payment (if under retry limit)
- Cancel transaction
- Auto-redirect to home (after 60s)

### State: `payment_timeout`
**Entry Point**: When any timer expires without user action
**Duration**: 30 seconds with auto-redirect
**Active Components**: PaymentTimeout
**Timers Started**:
- ⏱️ **30-second Auto-redirect Timer** (PaymentTimeout component)
  - Purpose: Auto-return to home after timeout
  - Display: Countdown circle in component
  - Stops: When user takes action

**Actions Available**:
- Try again (returns to payment method selection)
- Cancel (returns to home)
- Auto-redirect to home (after 30s)

---

## Timer Summary

| Timer | Duration | Purpose | Component | Started When | Cleared When |
|-------|----------|---------|-----------|--------------|--------------|
| QR Generation Timeout | 30s | Ensure QR code generates | payment.ts | PIX processing starts | QR code ready |
| User PIX Payment | 60s | User payment window | PixQrCodePayment | QR code displayed | Payment complete/timeout |
| Card Payment | 180s | Card insertion window | CardPayment | Card flow starts | Payment complete/timeout |
| Retry Auto-redirect | 60s | Return home if no action | PaymentFailure | Payment refused | User action |
| Timeout Auto-redirect | 30s | Return home after timeout | PaymentTimeout | Timeout state entered | User action |

---

## State Transition Diagram

```
[idle] 
  ↓ (user selects payment)
[processing] 
  ↓ (API success)
[wait/insert_tap_card] 
  ↓ (QR ready/card ready)
[show_qrcode/insert_tap_card] 
  ↓ 
┌─[success]─────────────────┐
│                           │
├─[retry]───────────────────┤
│  ↓ (retry limit exceeded) │
├─[failed]──────────────────┤
│                           │
└─[payment_timeout]─────────┘
  ↓ (all paths)
[idle] (return to start)
```

---

## Current Timer Issue (PIX 60s Countdown)

### Problem
The 60-second countdown timer in `PixQrCodePayment` component is not updating in the UI despite:
- ✅ Timer logic working correctly (logs show countdown)
- ✅ setInterval running every second
- ✅ Component state being updated
- ❌ UI not reflecting the countdown changes

### Implementation Location
- **File**: `src/lib/components/checkout/payments/PixQrCodePayment.svelte`
- **Timer Variable**: `let countdownTimer = initialCountdown`
- **Update Logic**: `countdownTimer = countdownTimer - 1`
- **Display**: Line 101: `<div class="countdown-text">{countdownTimer}s</div>`

### Investigation Needed
1. Check if Svelte reactivity is working for the countdown display
2. Verify if the countdown-text div is actually in the DOM
3. Check for CSS issues hiding the countdown text
4. Verify setInterval is updating the correct variable
5. Check for potential component re-rendering issues

---

## Session Management

### Session Timeout
- **Duration**: 60 seconds
- **Purpose**: End session if user inactive
- **Components**: All checkout components
- **Timer**: Parent component session management
- **Display**: Progress bar in final 11 seconds

### Session Extension
- **Trigger**: Any user interaction
- **Effect**: Resets 60-second session timer
- **Components**: All interactive elements extend session

---

This documentation covers the complete payment flow with all timers, states, and transitions. The current issue with the PIX 60-second countdown requires further investigation into Svelte reactivity or DOM rendering issues.