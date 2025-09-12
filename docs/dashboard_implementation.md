# Dashboard Implementation

## Overview

A minimal dashboard screen implementation following SOLID principles for a vending machine management interface.

## Features

### 🏁 Start Screen
- Long press (10 seconds) activation to prevent accidental access
- Visual progress indicator with circular progress ring
- Smooth animations and user feedback

### 🔐 Login Screen
- Username and password authentication
- 60-second inactivity timeout
- Form validation and error handling
- Responsive design for different screen sizes

### 📊 Dashboard Screen
- **Top bar** with logged-in username and logout button
- **Action cards** for machine control:
  - Open Door
  - Lock/Unlock Hatch
  - Test Motor
  - Stock Management
- **Session management** with automatic renewal every 5 minutes
- **Error handling** with non-blocking toast notifications

### 📦 Stock Management
- Sortable table with stock items
- Position display (shelf + coil = A1, B3, etc.)
- Current amount vs capacity tracking
- Expiration date monitoring
- **Restock functionality** with validation:
  - Amount must not exceed capacity
  - Expiration date must be today or later
  - Modal dialog interface

## Architecture

### SOLID Principles Implementation

#### Single Responsibility Principle (SRP)
- Each service has one responsibility
- Components are focused on single UI concerns
- Clear separation of business logic and presentation

#### Open/Closed Principle (OCP)
- Services implement interfaces, making them extendable
- New actions can be added without modifying existing code
- Component props allow customization without changes

#### Liskov Substitution Principle (LSP)
- Service implementations can be swapped via interfaces
- Mock services can replace real ones for testing

#### Interface Segregation Principle (ISP)
- Services expose only methods relevant to their domain
- Interfaces are focused and cohesive

#### Dependency Inversion Principle (DIP)
- Components depend on service interfaces, not concrete implementations
- Easy to test and mock dependencies

### Service Layer

```typescript
// Core Services
- AuthService      // Authentication operations
- StockService     // Inventory management
- DispenserService // Machine control operations
- ErrorHandler     // Centralized error management
- SessionManager   // Session lifecycle and renewal
- APIClient        // HTTP communication layer
```

### UI Components

```
dashboard/
├── FormInput.svelte      // Reusable form input with validation
├── ActionButton.svelte   // Button with loading states and variants
├── TopBar.svelte        // Navigation header with user info
├── StockTable.svelte    // Data table for inventory
├── RestockDialog.svelte // Modal for stock updates
└── ErrorBanner.svelte   // Toast notifications for errors
```

### API Endpoints

All endpoints use `http://localhost:8090/interface/dashboard` as base URL:

- `POST /login/` - User authentication
- `DELETE /login/` - Logout user
- `GET /login/renew` - Renew session
- `POST /dispenser/open-door` - Open machine door
- `POST /dispenser/handle-hatch` - Lock/unlock hatch
- `POST /dispenser/delivery/` - Test slot motor
- `GET /stock/` - Get inventory data
- `PUT /stock/` - Update stock item

## Usage

### Development
```bash
npm run dev
```

### Access Dashboard
1. Navigate to `/dashboard`
2. Long press the button for 10 seconds
3. Login with credentials (username: "repositor", password: "1234")
4. Use the dashboard to control the machine

### Testing
```bash
npm test
```

## File Structure

```
src/
├── lib/
│   ├── types/
│   │   └── dashboard.ts          # TypeScript interfaces
│   ├── services/
│   │   ├── api.ts               # HTTP client
│   │   ├── authService.ts       # Authentication
│   │   ├── stockService.ts      # Inventory
│   │   ├── dispenserService.ts  # Machine control
│   │   ├── errorHandler.ts      # Error management
│   │   └── sessionManager.ts    # Session handling
│   └── components/dashboard/
│       ├── FormInput.svelte     # Form component
│       ├── ActionButton.svelte  # Button component
│       ├── TopBar.svelte        # Header component
│       ├── StockTable.svelte    # Table component
│       ├── RestockDialog.svelte # Modal component
│       └── ErrorBanner.svelte   # Notification component
└── routes/dashboard/
    ├── +page.svelte            # Main dashboard route
    ├── LoginView.svelte        # Login screen
    └── DashboardView.svelte    # Dashboard interface
```

## Security Features

- **Session management** with automatic renewal
- **Inactivity timeout** on login screen
- **Input validation** for all forms
- **Error boundaries** to handle API failures gracefully

## Extensibility

### Adding New Actions
1. Add method to appropriate service interface
2. Implement in service class
3. Add action card to DashboardView.svelte
4. Handle loading states and errors

### Adding New Stock Columns
1. Update `StockItem` interface in types
2. Modify `StockTable.svelte` component
3. Update API response handling

### Customizing UI
- All components accept props for customization
- CSS custom properties for theming
- Responsive design with mobile-first approach

## Performance

- **Code splitting** with dynamic imports
- **Lazy loading** of dashboard components
- **Background API calls** for better UX
- **Optimistic updates** where appropriate

## Browser Support

- Modern browsers with ES2020+ support
- Mobile responsive design
- Touch-friendly interactions