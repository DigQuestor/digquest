# Use Node.js 18 LTS
FROM node:18-alpine
# Set working directory
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy source code
COPY . .
# Build the application
RUN cp index.html ./entry.html && sed -i 's|./src/main.tsx|./client/src/main.tsx|g' entry.html && npx vite build --config vite.config.minimal.ts --outDir dist/client && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
# Clean up dev dependencies after build
RUN npm ci --only=production && npm cache clean --force
# Expose port
EXPOSE 5000
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1
# Start the application
CMD ["node", "dist/index.js"]
