# Use Node.js 20 base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build the application using custom script
RUN node build-scripts.js

# Remove dev dependencies after build to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]