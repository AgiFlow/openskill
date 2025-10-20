# OpenSkill HTTP Server Docker Image
# Runs the pre-built Hono.js HTTP server for bash command execution
# Includes advanced Python (uv, pip), Node.js, and npm tooling

FROM node:20-alpine

# Install system dependencies and build tools
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    python3 \
    python3-dev \
    py3-pip \
    py3-virtualenv \
    build-base \
    libffi-dev \
    openssl-dev \
    && rm -rf /var/cache/apk/*

# Install uv (fast Python package installer)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Upgrade pip and install common Python tools
# Using --break-system-packages is safe in Docker containers
RUN python3 -m pip install --break-system-packages --upgrade pip setuptools wheel && \
    python3 -m pip install --break-system-packages --no-cache-dir \
    pipenv \
    poetry

# Verify installations
RUN echo "=== Verifying installations ===" && \
    node --version && \
    npm --version && \
    python3 --version && \
    pip3 --version && \
    uv --version && \
    git --version && \
    bash --version | head -n 1

WORKDIR /app

# Copy built files
COPY dist ./dist
COPY package.json ./

# Install only production runtime dependencies
RUN npm install --omit=dev

# Create workspace directory for command execution
RUN mkdir -p /workspace && chmod 777 /workspace

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONUNBUFFERED=1

# Expose port
EXPOSE 3000

# Start the HTTP server using the built CLI
CMD ["node", "dist/cli.js", "http-serve", "--port", "3000", "--host", "0.0.0.0"]
