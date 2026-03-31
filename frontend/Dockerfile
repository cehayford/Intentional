# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application with environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ENABLE_ANALYTICS
ARG REACT_APP_ENABLE_DEBUG
ARG REACT_APP_ENV

ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_ENABLE_ANALYTICS=${REACT_APP_ENABLE_ANALYTICS}
ENV REACT_APP_ENABLE_DEBUG=${REACT_APP_ENABLE_DEBUG}
ENV REACT_APP_ENV=${REACT_APP_ENV}

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

# Test nginx configuration and start
RUN nginx -t

# Expose port
EXPOSE 3000

# Start nginx immediately - no Docker health check
CMD ["nginx", "-g", "daemon off;"]
