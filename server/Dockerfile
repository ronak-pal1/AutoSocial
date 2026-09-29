# ==========================================
# AutoSocial Server Dockerfile
# Production-ready Node.js 22 with Chromium,
# Xvfb, fonts, and stealth browser dependencies
# ==========================================

FROM node:22-bookworm-slim AS base

# Install Chromium, Xvfb, fonts, and all required system libraries for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    xvfb \
    dumb-init \
    procps \
    ca-certificates \
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-kacst \
    fonts-freefont-ttf \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
    DISPLAY=:99 \
    NODE_ENV=production

WORKDIR /app

# Copy server package definitions and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy TypeScript config and server source code
COPY tsconfig.json ./
COPY src ./src

# Build server TypeScript into dist/
RUN npm run build

# Create storage directories
RUN mkdir -p /app/storage/images \
             /app/storage/screenshots \
             /app/storage/profiles

EXPOSE 5001

# Entrypoint script: start Xvfb in background if enabled, then run node
COPY <<-"EOF" /app/entrypoint.sh
#!/bin/bash
set -e

# Start Xvfb virtual frame buffer for headful stealth support on display :99
if [ -n "$ENABLE_XVFB" ] && [ "$ENABLE_XVFB" = "true" ]; then
    echo "Starting Xvfb on display :99..."
    Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &
    export DISPLAY=:99
fi

exec dumb-init node dist/index.js
EOF

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
