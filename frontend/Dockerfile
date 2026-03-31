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

# Production stage
FROM nginx:alpine AS production

# Install gettext for envsubst
RUN apk add --no-cache gettext

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration as template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Start script that substitutes PORT and starts nginx
CMD ["/bin/sh", "-c", "envsubst '$$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]