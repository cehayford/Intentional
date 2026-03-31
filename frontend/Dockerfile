# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage optimized for Railway
FROM nginx:alpine AS production

# Install curl for health checks and npm fallback for Railway run commands
RUN apk add --no-cache curl nodejs npm

WORKDIR /app

# Default port for local runs; Railway overrides this at runtime.
ENV PORT=3000

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy package.json so `npm start` works if platform command overrides CMD
COPY package.json ./package.json

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
