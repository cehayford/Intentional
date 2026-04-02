FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install http-server globally to serve static files
RUN npm install -g http-server

# Expose port
EXPOSE $PORT

# Serve the /dist directory on the PORT provided by Railway
CMD ["sh", "-c", "npx http-server dist -p $PORT --cors"]
