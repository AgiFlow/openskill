/**
 * MCP Serve Command
 *
 * DESIGN PATTERNS:
 * - Command pattern with Commander for CLI argument parsing
 * - Transport abstraction pattern for flexible deployment (stdio, HTTP, SSE)
 * - Factory pattern for creating transport handlers
 * - Graceful shutdown pattern with signal handling
 *
 * CODING STANDARDS:
 * - Use async/await for asynchronous operations
 * - Implement proper error handling with try-catch blocks
 * - Handle process signals for graceful shutdown
 * - Provide clear CLI options and help messages
 *
 * AVOID:
 * - Hardcoded configuration values (use CLI options or environment variables)
 * - Missing error handling for transport startup
 * - Not cleaning up resources on shutdown
 */

import { Command } from 'commander';
import { createServer } from '../server/index.js';
import { StdioTransportHandler } from '../transports/stdio.js';

/**
 * Start MCP server with given transport handler
 */
async function startServer(handler: any) {
  await handler.start();

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await handler.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * MCP Serve command
 */
export const mcpServeCommand = new Command('mcp-serve')
  .description('Start MCP server with specified transport')
  .option('-t, --type <type>', 'Transport type: stdio', 'stdio')
  .option(
    '--timeout <timeout>',
    'Default timeout for use-skill command in milliseconds',
    '30000'
  )
  .option(
    '--mount <path>',
    'Host path to mount into container (enables file access from host)'
  )
  .option(
    '--technologies <technologies>',
    'Comma-separated list of technologies available in the container (e.g., "Ubuntu 22.04, Node.js 20, Python 3.11")',
    'Debian (node:20-slim base), Node.js 20, Python 3, bash, git, curl, wget, npm, pip3, uv, pipenv, poetry, Pillow, build-essential, apt'
  )
  .option(
    '--disable-tools <tools>',
    'Comma-separated list of tool names to disable (e.g., get-skill,use-skill)'
  )
  .option(
    '--skills-path <path>',
    'Path to skills directory',
    '.claude/skills'
  )
  .option(
    '--container-name <name>',
    'Custom Docker container name (allows reusing one container for multiple skills, default: openskill-skill-{skillName})'
  )
  .option(
    '--image <name>',
    'Custom Docker image name to use instead of building default openskill-http image'
  )
  .option(
    '--no-prewarm',
    'Disable Docker image prewarming on server startup'
  )
  .action(async (options) => {
    try {
      const transportType = options.type.toLowerCase();
      const timeout = parseInt(options.timeout, 10);
      const mountPath = options.mount;
      const technologies = options.technologies;
      const skillsPath = options.skillsPath;
      const containerName = options.containerName;
      const imageName = options.image;
      const prewarm = options.noPrewarm !== true;
      const disabledTools = options.disableTools
        ? options.disableTools.split(',').map((t: string) => t.trim())
        : [];

      if (transportType === 'stdio') {
        const { server, cleanup } = createServer({
          useSkillTimeout: timeout,
          useSkillMountPath: mountPath,
          useSkillContainerName: containerName,
          useSkillImageName: imageName,
          useSkillTechnologies: technologies,
          disabledTools,
          skillsPath,
          prewarmDocker: prewarm,
        });
        const handler = new StdioTransportHandler(server, cleanup);
        await startServer(handler);
      } else {
        console.error(`Unknown transport type: ${transportType}. Use: stdio`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  });
