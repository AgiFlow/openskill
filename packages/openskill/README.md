# @agiflowai/openskill

[![npm version](https://img.shields.io/npm/v/@agiflowai/openskill.svg?style=flat-square)](https://www.npmjs.com/package/@agiflowai/openskill)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=flat-square)](https://opensource.org/licenses/AGPL-3.0)
[![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/NsB6q9Vas9?style=flat-square)](https://discord.gg/NsB6q9Vas9)

Model Context Protocol (MCP) server that enables [Anthropic Skills](https://www.anthropic.com/news/skills) to work with any coding agent and client that supports MCP servers. Provides skill management and sandboxed execution capabilities.

## Features

- **Universal Compatibility**: Makes Anthropic Skills work with any MCP-compatible AI coding agent (Cline, Roo Code, Continue, Zed, etc.)
- **Skill Management**: Read and execute skills from `.claude/skills/` directory
- **Sandboxed Execution**: Execute bash commands in isolated Docker containers for security
- **Volume Mounting**: Mount host directories into containers for file access
- **MCP Tools**: `get-skill` and `use-skill` tools for seamless integration
- **CLI Commands**: Direct command-line access to all functionality
- **Custom Images**: Support for custom Docker images tailored to your needs
- **Pre-configured Environment**: Python (uv, pip, poetry, pipenv, Pillow) and Node.js tooling out of the box

## Requirements

- Node.js 20+
- Docker (for use-skill sandbox execution)
- pnpm (for development)

## Installation

```bash
pnpm install
pnpm build
```

## MCP Tools

### get-skill

Retrieves skill information from the skills directory.

**Input:**
- `command` (string): Name of the skill to retrieve

**Example:**
```json
{
  "command": "canvas-design"
}
```

### use-skill

Executes bash commands in a sandboxed Docker environment for a specific skill.

**Input:**
- `skillName` (string): Name of the skill to execute
- `bash` (string): Bash command to execute

**Example:**
```json
{
  "skillName": "canvas-design",
  "bash": "python generate.py output.pdf"
}
```

## CLI Commands

### mcp-serve

Start the MCP server with stdio transport.

```bash
node dist/cli.js mcp-serve [options]
```

**Options:**
- `-t, --type <type>`: Transport type (default: "stdio")
- `--timeout <ms>`: Default timeout for use-skill command (default: 30000)
- `--workdir <path>`: Default working directory in container (default: "/workspace")
- `--mount <path>`: Host path to mount into container /workspace
- `--skills-path <path>`: Path to skills directory (default: ".claude/skills")
- `--container-name <name>`: Custom Docker container name (allows reusing one container for multiple skills)
- `--image <name>`: Custom Docker image name to use instead of building default openskill-http image
- `--disable-tools <tools>`: Comma-separated list of tools to disable
- `--no-prewarm`: Disable Docker image prewarming on server startup

**Example:**
```bash
# Start with custom skills path
node dist/cli.js mcp-serve --skills-path ./my-skills

# Start with custom Docker image
node dist/cli.js mcp-serve --image my-custom-image:latest

# Start with custom container name (reuse same container for all skills)
node dist/cli.js mcp-serve --container-name shared-skill-container
```

### use-skill

Execute a skill directly from the command line.

```bash
node dist/cli.js use-skill <skill-name> <bash-command> [options]
```

**Options:**
- `-t, --timeout <ms>`: Command timeout (default: 30000)
- `-w, --workdir <path>`: Working directory (default: "/workspace")
- `-m, --mount <path>`: Host path to mount into container

**Example:**
```bash
# Execute Python script in canvas-design skill
node dist/cli.js use-skill canvas-design "python generate.py output.pdf" \
  --mount /Users/username/projects
```

### http-serve

Start the HTTP server (used by Docker containers).

```bash
node dist/cli.js http-serve [options]
```

**Options:**
- `-p, --port <port>`: Port to listen on (default: 3000)
- `-h, --host <host>`: Host to bind to (default: "localhost")

## Usage with MCP Clients

OpenSkill can be used with any MCP-compatible client. Below are basic configuration examples for popular tools.

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

### Windsurf

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

### VS Code

```json
"mcp": {
  "servers": {
    "openskill-mcp": {
      "type": "stdio",
      "command": "openskill",
      "args": ["mcp-serve"]
    }
  }
}
```

### Zed

```json
{
  "context_servers": {
    "openskill-mcp": {
      "source": "custom",
      "command": "openskill",
      "args": ["mcp-serve"]
    }
  }
}
```

### Roo Code

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

### Continue

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

**Note:** For advanced configuration options (mount paths, container names, custom Docker images, skills paths, timeouts, etc.), see the [CLI Commands](#cli-commands) section above.

## Docker Environment

The sandbox Docker image includes:

**Node.js/JavaScript:**
- Node.js v20
- npm

**Python:**
- Python 3.12
- pip
- uv (fast package installer)
- poetry (dependency management)
- pipenv (virtual environment manager)
- Pillow (PIL - image processing library)

**System Tools:**
- bash
- git
- curl, wget
- Build tools (gcc, g++, make)

### Building the Docker Image

```bash
cd packages/openskill
docker build -t openskill-http .
```

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Development mode (watch)
pnpm dev
```

## Skill Structure

Skills should be organized in the skills directory (default: `.claude/skills/`):

```
.claude/skills/
├── canvas-design/
│   ├── SKILL.md          # Skill definition with frontmatter
│   ├── generate.py       # Skill implementation
│   └── templates/        # Additional resources
└── another-skill/
    └── SKILL.md
```

**SKILL.md Format:**

```markdown
---
name: canvas-design
description: Create beautiful visual art in .png and .pdf documents
license: user
---

# Canvas Design Skill

Instructions for the AI on how to use this skill...
```

## Architecture

- **src/tools/**: MCP tool implementations (GetSkillTool, UseSkillTool)
- **src/services/**: Business logic (SkillService, SandboxService)
- **src/commands/**: CLI commands (mcp-serve, use-skill, http-serve)
- **src/server/**: MCP server setup and configuration
- **src/transports/**: MCP transport handlers (stdio)
- **Dockerfile**: Docker image with Python and Node.js tooling

## License

MIT
