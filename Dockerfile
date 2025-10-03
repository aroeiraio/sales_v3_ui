# Stage 1: Build the SvelteKit application
FROM node:20-slim AS builder
WORKDIR /app

# Build arguments for API configuration
ARG VITE_API_BASE_URL=http://localhost:8090/interface
ARG VITE_MEDIA_BASE_URL=http://localhost:8090
ARG VITE_WEBSOCKET_URL=ws://localhost:9010

# Set as environment variables for the build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MEDIA_BASE_URL=${VITE_MEDIA_BASE_URL}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}

# Debug: Print environment variables
RUN echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"
RUN echo "VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL"
RUN echo "VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL"

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build
COPY . .
# Copy docker.env as .env for build process
COPY docker.env .env

# Debug: Show environment variables before build
RUN echo "Environment variables before build:"
RUN echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"
RUN echo "VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL"
RUN echo "VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL"

# Build the application
RUN npm run build

# Stage 2: Serve the static assets with lighttpd
FROM sebp/lighttpd:latest
WORKDIR /var/www/html

# Copy the built static files from the builder stage
COPY --from=builder /app/build/ .

# Copy the lighttpd configuration file
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf

EXPOSE 8080

CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]
