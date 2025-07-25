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

# Build client - use default vite config which outputs to dist/public
RUN echo "Building client with default config..." && npx vite build
RUN echo "Checking vite build output..." && ls -la dist/public/ 2>/dev/null || echo "dist/public not found"
RUN echo "Looking for build files anywhere..." && find . -maxdepth 3 -name "index.html" -type f 2>/dev/null || echo "No index.html found"
RUN echo "Building server..." && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@vitejs/plugin-react --external:@replit/vite-plugin-cartographer --external:@replit/vite-plugin-runtime-error-modal --external:./vite-dev
RUN echo "Checking server build output..." && ls -la dist/

# The serveStatic function expects files in dist/public (relative to import.meta.dirname which is dist/)
# Since we build to dist/public, the structure is already correct!
RUN echo "Verifying build structure matches serveStatic expectations..."
RUN ls -la dist/public/index.html && echo "✓ index.html found in correct location" || echo "✗ index.html missing!"

# Remove dev dependencies after build to reduce image size  
RUN npm ci --only=production && npm cache clean --force

# Final verification
RUN echo "Final check - verifying files exist:" && ls -la dist/public/ && echo "Build complete!"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]