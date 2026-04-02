FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install serve for static file serving
RUN npm install serve

# Railway will use startCommand from railway.toml
