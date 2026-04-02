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

# Production stage - copy built files to root for Railway static serving
FROM scratch AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /dist

# Railway will automatically serve static files from /dist
