# Production Deployment Guide

This guide explains how to deploy the Sales V3 UI application in a production environment using Docker containers.

## Prerequisites

- Docker and Docker Compose installed on your production server
- Access to your production API endpoints
- SSL certificates (if using HTTPS)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build and start the application
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop the application
npm run docker:compose:down
```

### 2. Manual Docker Commands

```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

## Production Configuration

### Environment Variables

1. Copy `production.env` to `.env.production`
2. Update the following variables for your production environment:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-production-api.com
VITE_WEBSOCKET_URL=wss://your-production-websocket.com

# Security
VITE_CORS_ORIGIN=https://your-production-domain.com
```

### Docker Compose Configuration

The `docker-compose.yml` file includes:

- **Health checks**: Monitors application health
- **Restart policy**: Automatically restarts on failure
- **Port mapping**: Maps container port 8090 to host port 8090
- **Network isolation**: Uses a dedicated network

### Customizing the Deployment

#### Changing the Port

To run on a different port, modify `docker-compose.yml`:

```yaml
ports:
  - "3000:8090"  # Maps host port 3000 to container port 8090
```

#### Adding Environment Variables

Add environment variables to `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=8090
  - HOST=0.0.0.0
  - VITE_API_BASE_URL=https://your-api.com
```

#### Using External Environment File

Create a `.env` file and reference it in `docker-compose.yml`:

```yaml
env_file:
  - .env
```

## Production Considerations

### Security

1. **Use HTTPS**: Configure your reverse proxy (nginx, Apache) to handle SSL termination
2. **Environment Variables**: Never commit sensitive data to version control
3. **Container Security**: Run containers as non-root user (already configured)

### Performance

1. **Resource Limits**: Add resource limits to `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

2. **Caching**: The application includes PWA caching strategies for optimal performance

### Monitoring

1. **Health Checks**: Built-in health check monitors application status
2. **Logs**: Use `docker-compose logs` to monitor application logs
3. **Metrics**: Consider adding monitoring solutions like Prometheus

### Reverse Proxy Setup (Nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the port mapping in `docker-compose.yml`
2. **Build Failures**: Check that all dependencies are properly installed
3. **Health Check Failures**: Verify the application is running on the correct port

### Debugging

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs -f sales-v3-ui

# Access container shell
docker-compose exec sales-v3-ui sh
```

## Scaling

For high-availability deployments:

1. **Load Balancer**: Use a load balancer to distribute traffic
2. **Multiple Instances**: Run multiple container instances
3. **Database**: Ensure your API backend can handle multiple frontend instances

## Updates

To update the application:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```
