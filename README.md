# OpenSkill

[![npm version](https://img.shields.io/npm/v/@agiflowai/openskill.svg?style=flat-square)](https://www.npmjs.com/package/@agiflowai/openskill)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=flat-square)](https://opensource.org/licenses/AGPL-3.0)
[![Discord](https://dcbadge.limes.pink/api/server/https://discord.gg/NsB6q9Vas9?style=flat-square)](https://discord.gg/NsB6q9Vas9)

Model Context Protocol (MCP) server that enables [Anthropic Skills](https://www.anthropic.com/news/skills) to work with any coding agent and client that supports MCP servers. Provides skill management and sandboxed execution capabilities.

## Overview

OpenSkill makes Anthropic's Claude Code Skills universally accessible across the AI coding ecosystem. It provides a secure, sandboxed execution environment for skills using Docker containers, enabling any MCP-compatible AI assistant to execute skills safely with full isolation, volume mounting, and customizable Docker images.

**[Watch the demo video](https://youtu.be/_eqdpZCYIJ4)**

### Key Features

- **Universal Compatibility**: Use Anthropic Skills with any MCP-compatible AI coding agent (Cline, Cursor, Windsurf, VS Code, Zed, Roo Code, Continue, etc.)
- **Skill Management**: Read and execute skills from `.claude/skills/` directory
- **Sandboxed Execution**: Execute bash commands in isolated Docker containers for security
- **Volume Mounting**: Mount host directories into containers for file access
- **MCP Tools**: `get-skill` and `use-skill` tools for seamless integration
- **CLI Commands**: Direct command-line access to all functionality
- **Custom Images**: Support for custom Docker images tailored to your needs
- **Pre-configured Environment**: Python (uv, pip, poetry, pipenv, Pillow) and Node.js tooling out of the box
- **Performance**: Docker image prewarming and container reuse

## Installation

### Prerequisites

- Node.js 20+
- Docker (for sandboxed skill execution)

### Install via npm

```bash
npm install -g @agiflowai/openskill
```

After installation, verify with:

```bash
openskill doctor
```

### Download Skills

Download Anthropic's official skills to your project:

```bash
# Clone the skills repository
git clone https://github.com/anthropics/skills.git .claude/skills-temp

# Move skills to .claude/skills directory
mkdir -p .claude/skills
cp -r .claude/skills-temp/skills/* .claude/skills/

# Clean up
rm -rf .claude/skills-temp
```

Or download specific skills manually:

```bash
# Create skills directory
mkdir -p .claude/skills

# Clone and copy specific skill (e.g., canvas-design)
git clone https://github.com/anthropics/skills.git /tmp/skills
cp -r /tmp/skills/skills/canvas-design .claude/skills/
rm -rf /tmp/skills
```

Your skills directory should look like:
```
.claude/skills/
├── canvas-design/
│   └── SKILL.md
├── python-sandbox/
│   └── SKILL.md
└── ... (other skills)
```

## Usage with MCP Clients

OpenSkill works with any MCP-compatible client. Here are quick setup examples:

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

### Gemini CLI

Add to `.gemini/settings.json`:

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

**Note:** For advanced configuration options (mount paths, container names, custom Docker images, skills paths, timeouts, etc.), see the [CLI Commands](#cli-commands) section below.

## MCP Tools

### get-skill

Retrieves skill information from the skills directory. You can use Anthropic's skills from GitHub and put them in `.claude/skills` or your custom skill folder.

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
openskill mcp-serve [options]
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

**Examples:**
```bash
# Start with custom skills path
openskill mcp-serve --skills-path ./my-skills

# Start with custom Docker image
openskill mcp-serve --image my-custom-image:latest

# Start with custom container name (reuse same container for all skills)
openskill mcp-serve --container-name shared-skill-container

# Mount current directory
openskill mcp-serve --mount $(pwd)
```

### use-skill

Execute a skill directly from the command line.

```bash
openskill use-skill <skill-name> <bash-command> [options]
```

**Options:**
- `-t, --timeout <ms>`: Command timeout (default: 30000)
- `-w, --workdir <path>`: Working directory (default: "/workspace")
- `-m, --mount <path>`: Host path to mount into container

**Example:**
```bash
# Execute Python script in canvas-design skill
openskill use-skill canvas-design "python generate.py output.pdf" \
  --mount /Users/username/projects
```

### doctor

Check if Docker is installed and accessible. Validates your environment for running OpenSkill.

```bash
openskill doctor
```

**Checks:**
- Docker installation and version
- Docker daemon status

**Example Output:**
```
Running OpenSkill environment checks...

Checking Docker installation...
✓ Docker is installed: Docker version 28.3.2, build 578ccf6

Checking Docker daemon...
✓ Docker daemon is running

✓ All checks passed!
  Your environment is ready to use OpenSkill.
```

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

## Development

### Project Structure

```
openskill/
├── packages/
│   └── openskill/     # Main MCP server package
├── nx.json            # Nx configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── tsconfig.base.json  # Base TypeScript configuration
```

### Setup

**Prerequisites:**
- Node.js 20+
- Docker (for sandboxed skill execution)
- pnpm (v10.15.1 or later)

**Installation:**

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Development Workflow

```bash
# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Development mode (watch)
pnpm dev
```

### Testing Locally

```bash
# Start the MCP server locally
node packages/openskill/dist/cli.js mcp-serve --mount $(pwd)

# Or use with custom Docker image
node packages/openskill/dist/cli.js mcp-serve --image my-custom-image:latest
```

### Available Scripts

- `pnpm build` - Build all projects
- `pnpm test` - Run tests for all projects
- `pnpm lint` - Lint all projects
- `pnpm typecheck` - Run type checking
- `pnpm dev` - Development mode with watch
- `pnpm graph` - View the project dependency graph
- `pnpm reset` - Reset Nx cache

## License

AGPL-3.0

## Community

Join our Discord community: [https://discord.gg/NsB6q9Vas9](https://discord.gg/NsB6q9Vas9)
