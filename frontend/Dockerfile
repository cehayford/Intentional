FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve locally (not globally)
RUN npm install serve

# Expose port 3000
EXPOSE 3000

# Change to dist directory and serve from there
WORKDIR /app/dist

# Serve the built application using local serve
CMD ["node", "../node_modules/.bin/serve", "-s", ".", "-l", "3000"]
