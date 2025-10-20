# openskill-test

An Nx monorepo using pnpm workspace.

## Structure

```
openskill-test/
├── apps/          # Application projects
├── packages/      # Shared libraries and packages
├── nx.json        # Nx configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── tsconfig.base.json   # Base TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- pnpm (v10.15.1 or later)

### Installation

```bash
pnpm install
```

### Available Scripts

- `pnpm build` - Build all projects
- `pnpm test` - Run tests for all projects
- `pnpm lint` - Lint all projects
- `pnpm graph` - View the project dependency graph
- `pnpm reset` - Reset Nx cache

## Adding Projects

### Add an Application

```bash
pnpm exec nx generate @nx/node:application my-app --directory=apps/my-app
```

### Add a Library

```bash
pnpm exec nx generate @nx/node:library my-lib --directory=packages/my-lib
```

## Nx and pnpm Workspace

This monorepo uses:
- **pnpm workspace** for package management and dependency hoisting
- **Nx** for task orchestration, caching, and dependency graph management

The combination provides:
- Fast installs with pnpm's efficient dependency management
- Smart task caching and parallel execution with Nx
- Scalable monorepo architecture
