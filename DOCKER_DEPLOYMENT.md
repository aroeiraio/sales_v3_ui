# Docker Deployment Guide

This guide explains how to deploy the Sales V3 UI with a separate API server container.

## Architecture Overview

```
┌─────────────────┐    Container Network    ┌─────────────────┐
│   sales-v3-ui   │ ───────────────────────► │   sales_api     │
│   (Frontend)    │                          │   (API Server)  │
│   Port: 8092    │                          │   Port: 8090    │
└─────────────────┘                          └─────────────────┘
         ▲                                           ▲
         │                                           │
         │ User Access                               │
         ▼                                           ▼
┌─────────────────┐                          ┌─────────────────┐
│   Users         │                          │   Database      │
│   (Browser)      │                          │   (External)    │
└─────────────────┘                          └─────────────────┘
```

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Your API server image available
- Network access between containers

### 2. Configure Your API Server

Update `docker-compose.yml` with your actual API server image:

```yaml
services:
  sales_api:
    image: your-registry/sales-api:latest  # Replace with your actual image
    # OR if building from source:
    # build:
    #   context: ../sales-api  # Path to your API server source
    #   dockerfile: Dockerfile
```

### 3. Start the Services

```bash
# Start both frontend and API server
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **API Server**: http://localhost:8090 (internal container communication)

## Configuration Files

### Environment Variables

The `docker.env` file contains all necessary environment variables:

```bash
# API Configuration for container-to-container communication
VITE_API_BASE_URL=http://sales_api:8090/interface
VITE_MEDIA_BASE_URL=http://sales_api:8090
VITE_WEBSOCKET_URL=ws://sales_api:8090
```

### Container Communication

- **Frontend → API**: Uses Docker service name `sales_api:8090`
- **External Access**: Frontend on port 8080, API on port 8090
- **Internal Network**: Both containers share `sales-network`

## Customization

### Different API Server Port

If your API server runs on a different port (e.g., 3000):

```yaml
# docker-compose.yml
services:
  sales_api:
    ports:
      - "8090:3000"  # Map external 8090 to internal 3000
    # ... rest of configuration

# docker.env
VITE_API_BASE_URL=http://sales_api:3000/interface
VITE_MEDIA_BASE_URL=http://sales_api:3000
```

### Different API Server Name

If your API server has a different name:

```yaml
# docker-compose.yml
services:
  my-api-server:  # Different service name
    # ... configuration

# docker.env
VITE_API_BASE_URL=http://my-api-server:8090/interface
VITE_MEDIA_BASE_URL=http://my-api-server:8090
```

### External API Server

If your API server runs outside Docker:

```yaml
# docker-compose.yml
services:
  sales_frontend:
    environment:
      - VITE_API_BASE_URL=http://host.docker.internal:8090/interface
      - VITE_MEDIA_BASE_URL=http://host.docker.internal:8090
```

## Production Deployment

### 1. Environment-Specific Configuration

Create production-specific environment file:

```bash
# production-docker.env
NODE_ENV=production
VITE_API_BASE_URL=http://sales_api:8090/interface
VITE_MEDIA_BASE_URL=http://sales_api:8090
VITE_WEBSOCKET_URL=ws://sales_api:8090
VITE_CORS_ORIGIN=https://yourdomain.com
```

### 2. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  sales_api:
    image: your-registry/sales-api:latest
    container_name: sales_api_prod
    ports:
      - "8090:8090"
    environment:
      - NODE_ENV=production
    restart: always
    networks:
      - sales-network

  sales_frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sales_frontend_prod
    ports:
      - "8080:8090"
    env_file:
      - production-docker.env
    restart: always
    depends_on:
      - sales_api
    networks:
      - sales-network

networks:
  sales-network:
    driver: bridge
```

### 3. Deploy to Production

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale if needed
docker-compose -f docker-compose.prod.yml up -d --scale sales-v3-ui=2
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   ```bash
   # Check if API container is running
   docker-compose ps sales_api
   
   # Check API container logs
   docker-compose logs sales_api
   
   # Test API connectivity from frontend container
   docker-compose exec sales-v3-ui wget -qO- http://sales_api:8090/health
   ```

2. **Frontend Can't Connect to API**
   ```bash
   # Check network connectivity
   docker-compose exec sales-v3-ui ping sales_api
   
   # Check if environment variables are set
   docker-compose exec sales-v3-ui env | grep VITE_API
   ```

3. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :8090
   netstat -tulpn | grep :8092
   
   # Change ports in docker-compose.yml if needed
   ```

### Debug Commands

```bash
# View all container logs
docker-compose logs -f

# Access frontend container shell
docker-compose exec sales_frontend sh

# Access API container shell
docker-compose exec sales_api sh

# Check container network
docker network ls
docker network inspect sales_v3_ui_sales-network

# Test API endpoints
curl http://localhost:8090/interface/health
curl http://localhost:8080/
```

## Monitoring

### Health Checks

Both containers include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8090/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging

```bash
# View real-time logs
docker-compose logs -f sales_frontend
docker-compose logs -f sales_api

# View specific service logs
docker-compose logs --tail=100 sales_api
```

## Scaling

### Horizontal Scaling

```bash
# Scale frontend containers
docker-compose up -d --scale sales_frontend=3

# Use load balancer (nginx) for multiple frontend instances
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream frontend {
    server sales_frontend_1:8090;
    server sales_frontend_2:8090;
    server sales_frontend_3:8090;
}

server {
    listen 80;
    location / {
        proxy_pass http://frontend;
    }
}
```

## Security Considerations

1. **Network Isolation**: Containers communicate through private network
2. **Environment Variables**: Sensitive data in environment files
3. **Health Checks**: Automatic restart on failure
4. **Resource Limits**: Add resource constraints in production

```yaml
services:
  sales-v3-ui:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Backup and Recovery

```bash
# Backup container data
docker-compose down
docker save sales_frontend:latest > sales_frontend-backup.tar
docker save sales_api:latest > sales_api-backup.tar

# Restore from backup
docker load < sales_frontend-backup.tar
docker load < sales_api-backup.tar
docker-compose up -d
```
