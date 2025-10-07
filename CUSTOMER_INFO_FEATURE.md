# Feature Flags Configuration

This document explains how to enable or disable various features in the InoBag Sales application.

## 🔧 Available Feature Flags

### **1. Customer Info Collection (`VITE_ENABLE_CUSTOMER_INFO`)**

Controls the CPF/Email collection screen that appears between cart and payment.

#### **To Enable:**
```bash
VITE_ENABLE_CUSTOMER_INFO=true
```

#### **To Disable:**
```bash
VITE_ENABLE_CUSTOMER_INFO=false
```
or simply remove the variable (it defaults to `false`)

### **2. System Status Check (`VITE_ENABLE_SYSTEM_STATUS_CHECK`)**

Controls whether the system checks machine availability before allowing shopping.

#### **To Enable (Production Mode):**
```bash
VITE_ENABLE_SYSTEM_STATUS_CHECK=true
```

#### **To Disable (Testing Mode):**
```bash
VITE_ENABLE_SYSTEM_STATUS_CHECK=false
```
or simply remove the variable (it defaults to `true`)

### **Environment Files**

The feature flag is configured in these files:

- **Development:** `development.env`
- **Production:** `production.env`
- **Docker:** `docker.env`

### **Current Configuration**

- **Development:** 
  - Customer Info: ✅ **ENABLED** (`VITE_ENABLE_CUSTOMER_INFO=true`)
  - System Status Check: ❌ **DISABLED** (`VITE_ENABLE_SYSTEM_STATUS_CHECK=false`) - *For testing*
- **Production:** 
  - Customer Info: ✅ **ENABLED** (`VITE_ENABLE_CUSTOMER_INFO=true`)
  - System Status Check: ✅ **ENABLED** (`VITE_ENABLE_SYSTEM_STATUS_CHECK=true`)

## 🔄 **How It Works**

### **Customer Info Collection Flow:**

#### **When ENABLED:**
1. User adds items to cart
2. User clicks "Finalizar Pedido"
3. **→ Customer Info Screen appears** (CPF/Email collection)
4. User can provide data or skip
5. User proceeds to payment method selection

#### **When DISABLED:**
1. User adds items to cart
2. User clicks "Finalizar Pedido"
3. **→ Directly goes to payment method selection** (skips customer info)

### **System Status Check Flow:**

#### **When ENABLED (Production Mode):**
1. User clicks "Começar Compra" on initial screen
2. **→ System checks machine availability** (dispenser, internet, doors, etc.)
3. If system is blocked → Redirects to out-of-service page
4. If system is ready → Proceeds to products screen

#### **When DISABLED (Testing Mode):**
1. User clicks "Começar Compra" on initial screen
2. **→ Skips all system checks**
3. **→ Directly proceeds to products screen**

## 🛠 **Implementation Details**

The feature flags are implemented in:

- **Constants:** `src/lib/utils/constants.ts`
  ```typescript
  export const FEATURES = {
    CUSTOMER_INFO_COLLECTION: import.meta.env.VITE_ENABLE_CUSTOMER_INFO === 'true' || false,
    SYSTEM_STATUS_CHECK: import.meta.env.VITE_ENABLE_SYSTEM_STATUS_CHECK === 'true' || true
  } as const;
  ```

- **Cart Navigation:** `src/routes/cart/+page.svelte`
  ```typescript
  function goToCheckout() {
    if (FEATURES.CUSTOMER_INFO_COLLECTION) {
      window.location.href = '/checkout/customer-info';
    } else {
      window.location.href = '/payment/method-selection';
    }
  }
  ```

- **Initial Screen:** `src/routes/+page.svelte`
  ```typescript
  async function startShopping() {
    // Check system status only if feature is enabled
    if (FEATURES.SYSTEM_STATUS_CHECK) {
      const { isBlocked, reasons } = await systemStatusService.checkSystemBlocking();
      if (isBlocked) {
        // Redirect to out-of-service page
        return;
      }
    }
    // Proceed to products screen
    await sessionService.startSession();
    window.location.href = '/products';
  }
  ```

## 📝 **Quick Commands**

### **Customer Info Collection:**

#### **Enable for Development:**
```bash
# Edit development.env
echo "VITE_ENABLE_CUSTOMER_INFO=true" >> development.env
```

#### **Disable for Development:**
```bash
# Edit development.env
echo "VITE_ENABLE_CUSTOMER_INFO=false" >> development.env
```

### **System Status Check:**

#### **Enable for Testing (Development):**
```bash
# Edit development.env
echo "VITE_ENABLE_SYSTEM_STATUS_CHECK=true" >> development.env
```

#### **Disable for Testing (Development):**
```bash
# Edit development.env
echo "VITE_ENABLE_SYSTEM_STATUS_CHECK=false" >> development.env
```

### **Production Configuration:**
```bash
# Edit production.env
echo "VITE_ENABLE_CUSTOMER_INFO=true" >> production.env
echo "VITE_ENABLE_SYSTEM_STATUS_CHECK=true" >> production.env
```

## 🔄 **After Changing the Setting**

1. **Restart the development server:**
   ```bash
   npm run dev
   ```

2. **For production builds:**
   ```bash
   npm run build
   ```

## 📋 **Feature Details**

### **Customer Info Collection Screen:**
When enabled, provides:
- **Title:** "Para emissão de nota fiscal, por gentileza, insira um CPF e seu e-mail."
- **CPF Input:** With Brazilian format validation (XXX.XXX.XXX-XX)
- **Email Input:** With email format validation
- **Two Actions:**
  - "Continuar sem nota fiscal" (Skip invoice)
  - "Prosseguir" (Continue with invoice data)
- **API Integration:** Sends data to `/interface/extradata`
- **Same Styling:** Matches cart page appearance
- **Inactivity Timeout:** Same 60-second timeout as other screens

### **System Status Check:**
When enabled, checks:
- **Dispenser Controller:** Communication with hardware controller
- **Internet Connectivity:** Network connection status
- **Out of Service:** Maintenance mode status
- **Door Status:** Door opened/closed state
- **Drawer Status:** Drawers unlocked/locked state
- **Hatch Status:** Hatch opened/closed state

## 🚀 **Deployment Notes**

- The feature flag is read at build time
- Changes require rebuilding the application
- Environment variables must be set before building
- No runtime configuration changes possible
