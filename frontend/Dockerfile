FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install serve for static file serving
RUN npm install serve

# Runtime defaults for Docker-based deploy targets (Render/Railway)
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx serve -s dist -l ${PORT}"]
