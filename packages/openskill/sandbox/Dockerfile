# Sandbox Docker Container
# Provides isolated environment for executing skill commands safely

FROM node:20-alpine

# Install common tools that skills might need
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    python3 \
    py3-pip \
    imagemagick \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Install Python packages commonly needed by skills
RUN pip3 install --no-cache-dir \
    pillow \
    imageio \
    numpy \
    requests

# Create workspace directory
RUN mkdir -p /workspace /app
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy server code
COPY server.js ./

# Set workspace as default working directory for commands
WORKDIR /workspace

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "/app/server.js"]
