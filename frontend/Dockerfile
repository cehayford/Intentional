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

# Install curl for health checks
RUN apk add --no-cache curl

# Default port for local runs; Railway overrides this at runtime.
ENV PORT=3000

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template (expanded by nginx entrypoint with env vars)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
