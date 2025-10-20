# OpenSkill

[![npm version](https://img.shields.io/npm/v/@agiflowai/openskill.svg?style=flat-square)](https://www.npmjs.com/package/@agiflowai/openskill)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=flat-square)](https://opensource.org/licenses/AGPL-3.0)
[![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/NsB6q9Vas9?style=flat-square)](https://discord.gg/NsB6q9Vas9)

Model Context Protocol (MCP) server that enables [Anthropic Skills](https://www.anthropic.com/news/skills) to work with any coding agent and client that supports MCP servers. Provides sandboxed skill execution with Docker containers.

## Overview

OpenSkill makes Anthropic's Claude Code Skills universally accessible across the AI coding ecosystem. It provides a secure, sandboxed execution environment for skills using Docker containers, enabling any MCP-compatible AI assistant to execute skills safely with full isolation, volume mounting, and customizable Docker images.

### Key Features

- **Universal Compatibility**: Use Anthropic Skills with any MCP-compatible AI coding agent
- **Sandboxed Execution**: Run skills in isolated Docker containers for security
- **Pre-configured Environment**: Python (uv, pip, poetry, pipenv, Pillow) + Node.js tooling
- **Customizable**: Support for custom Docker images and container configurations
- **MCP Integration**: Seamless integration via Model Context Protocol
- **Volume Mounting**: Access host files within containers
- **Performance**: Docker image prewarming and container reuse

## Usage with MCP Clients

OpenSkill works with any MCP-compatible client. Here are quick setup examples:

### Cline

```json
{
  "mcpServers": {
    "openskill-mcp": {
      "disabled": false,
      "command": "openskill",
      "args": ["mcp-serve"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "openskill-mcp": {
      "command": "openskill",
      "args": ["mcp-serve"]
    }
  }
}
```

### Claude Code

```json
{
  "mcpServers": {
    "openskill-mcp": {
      "command": "openskill",
      "args": ["mcp-serve", "--disable-tools", "get-skill"]
    }
  }
}
```

### Other MCP Clients

For Windsurf, VS Code, Zed, Roo Code, Continue, and more, see the [detailed configuration guide](packages/openskill/README.md#usage-with-mcp-clients).

## Documentation

For detailed documentation, see [packages/openskill/README.md](packages/openskill/README.md)

## Development

```
openskill/
├── packages/
│   └── openskill/     # Main MCP server package
├── nx.json            # Nx configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── tsconfig.base.json  # Base TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for sandboxed skill execution)
- pnpm (v10.15.1 or later)

### Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Quick Start

```bash
# Start the MCP server
node packages/openskill/dist/cli.js mcp-serve --mount $(pwd)

# Or use with custom Docker image
node packages/openskill/dist/cli.js mcp-serve --image my-custom-image:latest
```

### Available Scripts

- `pnpm build` - Build all projects
- `pnpm test` - Run tests for all projects
- `pnpm lint` - Lint all projects
- `pnpm graph` - View the project dependency graph
- `pnpm reset` - Reset Nx cache

## License

AGPL-3.0

## Community

Join our Discord community: [https://discord.gg/NsB6q9Vas9](https://discord.gg/NsB6q9Vas9)
