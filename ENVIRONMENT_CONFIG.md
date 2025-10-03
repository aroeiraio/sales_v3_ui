# Environment Configuration Guide

This guide explains how to configure API endpoints and environment variables for different deployment environments.

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE_URL` | Base URL for API endpoints | `http://localhost:8090/interface` | `https://api.yourdomain.com/interface` |
| `VITE_MEDIA_BASE_URL` | Base URL for media files | `http://localhost:8090` | `https://api.yourdomain.com` |
| `VITE_WEBSOCKET_URL` | WebSocket URL for real-time features | Not set | `wss://ws.yourdomain.com` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_APP_NAME` | Application name | `InoBag Sales V3` | `My POS System` |
| `VITE_APP_SHORT_NAME` | Short application name | `InoBag` | `POS` |
| `VITE_CORS_ORIGIN` | CORS origin for security | Not set | `https://yourdomain.com` |

## Configuration Files

### 1. Development Environment

Create `.env.local` for local development:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8090/interface
VITE_MEDIA_BASE_URL=http://localhost:8090
VITE_WEBSOCKET_URL=ws://localhost:8090
```

### 2. Production Environment

Use `production.env` as template:

```bash
# production.env
NODE_ENV=production
PORT=8090
HOST=0.0.0.0

# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/interface
VITE_MEDIA_BASE_URL=https://your-api-domain.com
VITE_WEBSOCKET_URL=wss://your-websocket-domain.com

# Security
VITE_CORS_ORIGIN=https://your-domain.com
```

### 3. Docker Environment

For Docker deployments, set environment variables in `docker-compose.yml`:

```yaml
services:
  sales-v3-ui:
    environment:
      - VITE_API_BASE_URL=https://api.yourdomain.com/interface
      - VITE_MEDIA_BASE_URL=https://api.yourdomain.com
      - VITE_WEBSOCKET_URL=wss://ws.yourdomain.com
```

## API Endpoint Configuration

### Centralized Configuration

All API endpoints are configured in `src/lib/utils/constants.ts`:

```typescript
// Uses environment variables with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/interface';
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8090';

export const ENDPOINTS = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/interface',
  visual_settings: '/visual_settings',
  digital_signage: '/digital_signage',
  session: '/session',
  categories: '/categories',
  products: '/products',
  cart: '/cart',
  checkout: '/checkout',
  payment: '/payment',
  delivery: '/sales/v1/delivery',
  media: '/media'
} as const;
```

### Service Files Updated

The following service files now use centralized configuration:

- ✅ `src/lib/services/api.ts` - Main API client
- ✅ `src/lib/services/cart.ts` - Cart operations
- ✅ `src/lib/services/payment.ts` - Payment processing
- ✅ `src/lib/services/delivery.ts` - Delivery status
- ✅ `src/lib/components/payment/PixDisplay.svelte` - PIX QR codes
- ✅ `src/lib/components/checkout/payments/PixQrCodePayment.svelte` - PIX checkout

## Deployment Examples

### 1. Local Development

```bash
# Copy production template
cp production.env .env.local

# Edit for local development
VITE_API_BASE_URL=http://localhost:8090/interface
VITE_MEDIA_BASE_URL=http://localhost:8090

# Start development server
npm run dev
```

### 2. Production with Docker

```bash
# Build with environment variables
docker build -t sales-v3-ui .

# Run with custom API URL
docker run -p 8090:8090 \
  -e VITE_API_BASE_URL=https://api.yourdomain.com/interface \
  -e VITE_MEDIA_BASE_URL=https://api.yourdomain.com \
  sales-v3-ui
```

### 3. Docker Compose

```yaml
version: '3.8'
services:
  sales-v3-ui:
    build: .
    environment:
      - VITE_API_BASE_URL=https://api.yourdomain.com/interface
      - VITE_MEDIA_BASE_URL=https://api.yourdomain.com
    ports:
      - "8090:8090"
```

## Testing Configuration

### HTML Test Files

The `test_dashboard.html` file now supports dynamic URL configuration:

```javascript
// Set environment variables before loading
window.ENV = {
  devServerUrl: 'https://yourdomain.com/',
  apiBaseUrl: 'https://api.yourdomain.com/interface/dashboard'
};
```

### Environment Validation

Add this to your build process to validate environment variables:

```bash
#!/bin/bash
# validate-env.sh

required_vars=("VITE_API_BASE_URL" "VITE_MEDIA_BASE_URL")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  else
    echo "✅ $var is set to: ${!var}"
  fi
done

echo "✅ All required environment variables are set"
```

## Troubleshooting

### Common Issues

1. **API calls failing**: Check that `VITE_API_BASE_URL` is correctly set
2. **Images not loading**: Verify `VITE_MEDIA_BASE_URL` points to correct media server
3. **CORS errors**: Ensure `VITE_CORS_ORIGIN` matches your domain
4. **WebSocket connection failed**: Check `VITE_WEBSOCKET_URL` is correct

### Debug Mode

Enable debug logging by setting:

```bash
VITE_DEBUG=true
```

This will log all API calls and environment variables to the console.

## Migration from Hardcoded URLs

If you have existing hardcoded URLs in your codebase:

1. **Find hardcoded URLs**:
   ```bash
   grep -r "localhost:8090" src/
   grep -r "http://" src/
   ```

2. **Replace with constants**:
   ```typescript
   // Before
   const response = await fetch('http://localhost:8090/interface/cart/');
   
   // After
   import { API_BASE_URL } from '../utils/constants';
   const response = await fetch(`${API_BASE_URL}/cart/`);
   ```

3. **Test the changes**:
   ```bash
   npm run build
   npm run preview
   ```

## Security Considerations

- Never commit `.env.local` or `.env.production` files
- Use HTTPS in production environments
- Validate all environment variables before deployment
- Consider using a secrets management system for production
