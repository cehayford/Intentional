FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install http-server globally to serve static files
RUN npm install -g http-server

# Expose port 3000
EXPOSE 3000

# Serve the /dist directory on port 3000
CMD ["http-server", "dist", "-p", "3000", "--cors"]
