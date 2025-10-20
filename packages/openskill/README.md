# @agiflowai/openskill

Model Context Protocol (MCP) server providing skill management and sandboxed execution capabilities.

## Features

- **Skill Management**: Read and execute Claude Code skills from `.claude/skills/` directory
- **Sandboxed Execution**: Execute bash commands in isolated Docker containers
- **Volume Mounting**: Mount host directories into containers for file access
- **MCP Tools**: `get-skill` and `use-skill` tools for Claude Code integration
- **CLI Commands**: Direct command-line access to all functionality
- **Docker Image**: Pre-configured environment with Python (uv, pip, poetry, pipenv) and Node.js

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
- `--disable-tools <tools>`: Comma-separated list of tools to disable

**Example:**
```bash
# Start MCP server with custom mount
node dist/cli.js mcp-serve --mount /Users/username/projects

# Start with custom skills path
node dist/cli.js mcp-serve --skills-path ./my-skills
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

## Usage with Claude Code

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "openskill": {
      "command": "node",
      "args": [
        "/path/to/openskill/dist/cli.js",
        "mcp-serve",
        "--mount",
        "/Users/username/workspace"
      ]
    }
  }
}
```

With custom skills path:

```json
{
  "mcpServers": {
    "openskill": {
      "command": "node",
      "args": [
        "/path/to/openskill/dist/cli.js",
        "mcp-serve",
        "--mount",
        "/Users/username/workspace",
        "--skills-path",
        "./custom-skills"
      ]
    }
  }
}
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