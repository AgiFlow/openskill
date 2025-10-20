# OpenSkill HTTP Server Docker Image
# Runs the pre-built Hono.js HTTP server for bash command execution
# Includes advanced Python (uv, pip), Node.js, and npm tooling

FROM node:20-slim

# Install system dependencies and build tools
RUN apt-get update && apt-get install -y \
    bash \
    git \
    curl \
    wget \
    python3 \
    python3-dev \
    python3-pip \
    python3-venv \
    build-essential \
    libffi-dev \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Remove Python externally-managed restriction (safe in Docker containers)
RUN rm -f /usr/lib/python*/EXTERNALLY-MANAGED

# Install uv (fast Python package installer)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Install common Python tools using pip (now unrestricted)
RUN pip3 install --no-cache-dir pipenv poetry

# Verify installations
RUN echo "=== Verifying installations ===" && \
    node --version && \
    npm --version && \
    python3 --version && \
    pip3 --version && \
    uv --version && \
    pipenv --version && \
    poetry --version && \
    git --version && \
    bash --version | head -n 1

WORKDIR /app

# Copy built files (all dependencies are bundled - no package.json needed)
COPY dist ./dist

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
