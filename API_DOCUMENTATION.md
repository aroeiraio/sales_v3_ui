# Sales API Documentation

## Overview
This is a comprehensive REST API for a vending machine/smart locker system that handles products, cart management, payments, delivery, and administrative operations.

**Base URL**: `http://[host]:[port]`  
**Default Port**: Configurable (check application logs)  
**Content-Type**: `application/json`  
**CORS**: Enabled by default (non-blocking)

## CORS Support
The API includes comprehensive CORS support with:
- **Access-Control-Allow-Origin**: `*`
- **Access-Control-Allow-Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Access-Control-Allow-Headers**: `Content-Type, Authorization, X-Requested-With, Accept, Origin`
- **Access-Control-Allow-Credentials**: `true`
- **Access-Control-Max-Age**: `86400` (24 hours)

Preflight OPTIONS requests are automatically handled.

## API Endpoints

### 1. Static Files
Serves media content for the vending machine interface.

#### Get Media File
```http
GET /media/{filename}
```
**Description**: Retrieve static media files (images, videos)  
**Parameters**: 
- `filename` (path): The media file name
**Response**: Binary file content

---

### 2. Management Interface (Syscontrol)
Administrative interface for system management and external notifications.

#### Management Operations
```http
POST /management
GET /management
```
**Description**: Handle system management operations and notifications  
**Request Body**: JSON array with management commands  
**Example**:
```json
[
  {
    "topic": "notify-sale",
    "data": { "orderId": "12345", "status": "completed" }
  }
]
```

**Special Topics**:
- `notify-sale`: Sales notifications
- `notify-payment-started`: Payment start notifications
- Other topics handled by BackofficeController

---

### 3. Delivery Interface (Syscontrol)
Remote delivery operations triggered by the system.

#### Remote Checkout
```http
POST /delivery
```
**Description**: Trigger remote delivery/checkout process  
**Request Body**: JSON document with delivery parameters  
**Response**: Delivery status and confirmation

---

### 4. Webhook Interface
External webhook endpoint for payment and delivery status updates.

#### Webhook Handler
```http
POST /webhook
```
**Description**: Receive external webhook notifications  
**Request Body**: JSON document with webhook payload  
**Response**: Acknowledgment of webhook receipt

---

### 5. Frontend Interface
Main customer-facing API endpoints.

#### System Status
```http
GET /interface/status
```
**Description**: Get general system status and critical settings  
**Response**:
```json
{
  "status": "operational",
  "temperature": "normal",
  "connectivity": "online"
}
```

#### Products
```http
GET /interface/products
GET /interface/products/{categoryId}
```
**Description**: List all products or products by category  
**Parameters**:
- `categoryId` (optional): Filter by category ID
**Response**:
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Coca Cola",
      "price": 2.50,
      "stock": 15,
      "category": "beverages"
    }
  ]
}
```

#### Categories
```http
GET /interface/categories
```
**Description**: List all product categories  
**Response**:
```json
{
  "categories": [
    {
      "id": "beverages",
      "name": "Beverages",
      "icon": "drink.png"
    }
  ]
}
```

#### Cart Management
```http
GET /interface/cart
POST /interface/cart
DELETE /interface/cart
```

**Get Cart**:
```http
GET /interface/cart
```
**Description**: Retrieve current cart contents  
**Response**:
```json
{
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "price": 2.50,
      "total": 5.00
    }
  ],
  "total": 5.00
}
```

**Add to Cart**:
```http
POST /interface/cart
```
**Description**: Add item to cart  
**Request Body**:
```json
{
  "productId": "prod_123",
  "quantity": 1
}
```

**Remove from Cart**:
```http
DELETE /interface/cart
```
**Description**: Remove item from cart  
**Request Body**:
```json
{
  "productId": "prod_123",
  "quantity": 1
}
```

#### Session Management
```http
GET /interface/session
DELETE /interface/session
```

**Open Session**:
```http
GET /interface/session
```
**Description**: Start a new customer session  
**Response**:
```json
{
  "sessionId": "sess_abc123",
  "expiresAt": "2023-12-31T23:59:59Z"
}
```

**Close Session**:
```http
DELETE /interface/session
```
**Description**: End current session and clear cart

#### Digital Signage
```http
GET /interface/digital_signage
```
**Description**: Get digital signage content and configuration  
**Response**:
```json
{
  "content": [
    {
      "type": "image",
      "url": "/media/promo1.jpg",
      "duration": 5000
    }
  ]
}
```

#### Visual Settings
```http
GET /interface/visual_settings
```
**Description**: Get UI visual configuration  
**Response**:
```json
{
  "theme": "default",
  "primaryColor": "#007bff",
  "language": "en"
}
```

#### Coupon Validation
```http
GET /interface/coupon/{couponCode}
```
**Description**: Validate a coupon code  
**Parameters**:
- `couponCode`: The coupon code to validate
**Response**:
```json
{
  "valid": true,
  "discount": 10,
  "type": "percentage"
}
```

#### Checkout
```http
GET /interface/checkout
```
**Description**: Process cart checkout and prepare for payment  
**Response**:
```json
{
  "orderId": "order_123",
  "total": 15.50,
  "items": [...],
  "paymentRequired": true
}
```

#### Extra Data
```http
POST /interface/extradata
```
**Description**: Set additional order data  
**Request Body**:
```json
{
  "customerName": "John Doe",
  "notes": "Leave at door",
  "customField": "value"
}
```

#### Payment Management
```http
GET /interface/payment
GET /interface/payment/status
POST /interface/payment
DELETE /interface/payment
```

**Get Available Payment Methods**:
```http
GET /interface/payment
```
**Description**: List available payment brokers/methods  
**Response**:
```json
{
  "brokers": [
    {
      "id": "mercadopago",
      "name": "MercadoPago",
      "enabled": true
    },
    {
      "id": "vmpay",
      "name": "VMPay",
      "enabled": true
    }
  ]
}
```

**Get Payment Status**:
```http
GET /interface/payment/status
```
**Description**: Get current payment status  
**Response**:
```json
{
  "status": "pending",
  "orderId": "order_123",
  "paymentId": "pay_456"
}
```

**Select Payment Method**:
```http
POST /interface/payment
```
**Description**: Select and initialize payment method  
**Request Body**:
```json
{
  "broker": "mercadopago",
  "method": "qr_code"
}
```

**Cancel Payment**:
```http
DELETE /interface/payment
```
**Description**: Cancel current payment process

#### Delivery Status
```http
GET /interface/delivery
```
**Description**: Get delivery process status  
**Response**:
```json
{
  "status": "dispensing",
  "progress": 75,
  "estimatedCompletion": "2023-12-31T12:35:00Z"
}
```

---

### 6. Dashboard Interface (Admin)
Administrative dashboard endpoints (requires authentication).

#### Authentication
```http
GET /interface/dashboard/login
GET /interface/dashboard/login/renew
POST /interface/dashboard/login
DELETE /interface/dashboard/login
```

**Get Login Status**:
```http
GET /interface/dashboard/login
```

**Renew Session**:
```http
GET /interface/dashboard/login/renew
```

**Login**:
```http
POST /interface/dashboard/login
```
**Request Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**Logout**:
```http
DELETE /interface/dashboard/login
```

#### Stock Management
```http
GET /interface/dashboard/stock
PUT /interface/dashboard/stock
```

**Get Stock Status**:
```http
GET /interface/dashboard/stock
```
**Response**:
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Coca Cola",
      "currentStock": 15,
      "maxCapacity": 20,
      "alerts": []
    }
  ]
}
```

**Update Stock**:
```http
PUT /interface/dashboard/stock
```
**Request Body**:
```json
{
  "productId": "prod_123",
  "quantity": 10,
  "operation": "add"
}
```

#### Network Management
```http
GET /interface/dashboard/network
GET /interface/dashboard/network/wifi
POST /interface/dashboard/network
```

**Get Network Settings**:
```http
GET /interface/dashboard/network
```

**Get WiFi Networks**:
```http
GET /interface/dashboard/network/wifi
```

**Update Network Settings**:
```http
POST /interface/dashboard/network
```

#### Audio Settings
```http
GET /interface/dashboard/audio
POST /interface/dashboard/audio
```

#### General Settings
```http
GET /interface/dashboard/general
POST /interface/dashboard/general
```

#### Setup Configuration
```http
GET /interface/dashboard/setup
POST /interface/dashboard/setup
```

#### Sales History
```http
GET /interface/dashboard/last_sale
```

#### Dispenser Control
```http
GET /interface/dashboard/dispenser
POST /interface/dashboard/dispenser/delivery
POST /interface/dashboard/dispenser/lift
POST /interface/dashboard/dispenser/lock
```

**Get Dispenser Status**:
```http
GET /interface/dashboard/dispenser
```

**Manual Delivery**:
```http
POST /interface/dashboard/dispenser/delivery
```

**Control Lift**:
```http
POST /interface/dashboard/dispenser/lift
```

**Control Lock**:
```http
POST /interface/dashboard/dispenser/lock
```

---

## HTTP Status Codes
- **200 OK**: Successful request
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied (dashboard without login)
- **404 Not Found**: Endpoint not found
- **500 Internal Server Error**: Server error

## Error Response Format
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Authentication
Dashboard endpoints require authentication. Login via `/interface/dashboard/login` to receive a session token.

## Rate Limiting
No explicit rate limiting is currently implemented.

## WebSocket Support
The API includes WebSocket support for real-time updates (separate WebSocket server on configurable port, default 8081).