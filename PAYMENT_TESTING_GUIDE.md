# Payment Testing Guide

This guide explains how to test and evaluate different payment scenarios in the checkout system.

## 🔧 Payment Screen Testing Methods

### 1. Using Debug Buttons (Recommended)

The checkout screen includes debug buttons that simulate different payment states without requiring actual API calls:

**Location**: `/checkout` - Look for the "🧪 Debug - Testar Estados" section (yellow dashed border)

**Available Test Scenarios**:
- **⏳ Processando (Cartão)** - Simulates card processing state
- **🔄 Preparando PIX** - Simulates PIX preparation phase  
- **📊 Escaneie QR Code** - Simulates PIX QR code display
- **⏰ Timeout PIX** - Simulates PIX timeout scenario
- **✅ Simular Aprovado** - Simulates successful payment
- **❌ Simular Recusado** - Simulates payment refusal
- **🏁 Ver Tela Final** - Navigate to end screen

### 2. URL Testing (Quick Access)

Direct navigation to specific screens:
- **Checkout**: `http://localhost:8092/checkout`
- **Cart**: `http://localhost:8092/cart` 
- **Products**: `http://localhost:8092/products`
- **End Screen**: `http://localhost:8092/end`

### 3. Browser Console Testing

Use browser console to directly manipulate payment states:

```javascript
// Simulate PIX QR Code state
paymentState = 'show_qrcode';
paymentResult = {
  transactionId: 'test-qr-123',
  status: 'processing', 
  message: 'QR Code ready for scanning',
  qrcode_source: '/media/customer/sample_qr_code.png'
};

// Simulate successful payment
paymentState = 'success';
paymentResult = {
  transactionId: 'test-success-123',
  status: 'success',
  message: 'Pagamento aprovado com sucesso!'
};

// Simulate payment failure
paymentState = 'failed';
paymentResult = {
  transactionId: 'test-failed-123', 
  status: 'failed',
  message: 'Pagamento recusado'
};
```

## ⏱️ Timeout Testing

### PIX Payment Timeouts

**Two-tier timeout system**:
1. **QR Code Generation**: 30 seconds (payment service)
2. **Payment Completion**: 60 seconds (UI countdown)

**Test scenarios**:
- Normal flow: QR code appears within 30s, payment completes within 60s
- QR timeout: QR code doesn't appear within 30s → automatic cancellation
- Payment timeout: QR code appears but payment not completed within 60s → retry option

### Card Payment Timeouts

Card payments follow the same 30-second generation timeout but don't have the 60-second UI countdown.

## 🚀 End-to-End Testing Flow

### Complete PIX Payment Test:
1. Add items to cart: `/products` → select items
2. Proceed to checkout: `/cart` → "Finalizar Pedido"  
3. Select PIX payment method
4. Observe processing → QR code → timeout/success states
5. Complete flow to end screen

### Complete Card Payment Test:
1. Same setup as PIX
2. Select "Cartão de Crédito" or "Cartão de Débito"
3. Observe "Insira ou aproxime seu cartão" state
4. Use debug buttons to simulate approval/refusal

## 🐛 Common Issues & Debugging

### Issue: Timeout Running Too Fast
**Symptom**: 60-second timer completes in ~15 seconds
**Cause**: Multiple timeout mechanisms conflicting
**Solution**: Check console for timeout messages, ensure only one timer is active

### Issue: Payment Icons Not Showing  
**Symptom**: Empty spaces where payment method icons should be
**Solution**: Verify Lucide icons are loaded (should be fixed in latest version)

### Issue: Cart Empty Error
**Symptom**: Redirected to cart when accessing checkout
**Solution**: Add items to cart first via products screen

## 📊 Monitoring & Debugging

### Console Logging
The system provides detailed console logs for:
- Payment method mapping: `Payment method mapping: {...}`
- API requests: `Starting payment with: {...}`  
- Status updates: `Payment status update: {...}`
- Timeout events: `PIX payment QR code generation timeout reached`

### Key Console Commands
```javascript
// Check current payment state
console.log('Payment State:', paymentState);

// Check available payment methods  
console.log('Available Methods:', availablePaymentMethods);

// Force state change
paymentState = 'show_qrcode';

// Check countdown timer
console.log('Countdown:', countdownTimer);
```

## 🔄 Reset Testing Environment

To reset between tests:
1. **Clear cart**: Use debug or navigate to `/products`
2. **Reset payment state**: Refresh `/checkout` page
3. **Clear browser storage**: Dev Tools → Application → Clear Storage

## 📋 Test Checklist

### Visual Tests ✅
- [ ] Payment method icons display correctly
- [ ] PIX shows QR code icon
- [ ] Card methods show appropriate icons
- [ ] Selected state highlighting works
- [ ] Countdown timer displays and updates

### Functional Tests ✅
- [ ] PIX payment initiates correctly
- [ ] Card payment initiates correctly  
- [ ] Timeout mechanisms work as expected
- [ ] Success/failure states display properly
- [ ] Navigation between states works
- [ ] Debug buttons function correctly

### Error Handling Tests ✅
- [ ] Empty cart handled gracefully
- [ ] API errors show appropriate messages
- [ ] Timeout scenarios display retry options
- [ ] Invalid payment methods rejected

## 🎯 Performance Testing

Monitor these metrics during testing:
- **QR Code Generation Time**: Should be < 5 seconds
- **Payment Processing Time**: Varies by method
- **UI Responsiveness**: No blocking during API calls
- **Memory Usage**: Check for timer leaks

Use browser Dev Tools → Performance tab to profile payment flows.