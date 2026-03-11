FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY backend/package.json backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm install

# Copy backend application code
WORKDIR /app
COPY backend/ ./backend/

# Expose Node.js (Express) port
EXPOSE 8000

# Start Node Server
WORKDIR /app/backend
CMD ["npm", "start"]
