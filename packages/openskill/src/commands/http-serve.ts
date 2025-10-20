/**
 * HTTP Serve Command
 *
 * CLI command to start the HTTP server with bash execution endpoint.
 * Provides HTTP API for executing bash commands with streaming support.
 *
 * DESIGN PATTERNS:
 * - Commander.js command pattern
 * - HTTP server lifecycle management
 *
 * CODING STANDARDS:
 * - Handle server startup/shutdown gracefully
 * - Log server status to stderr
 * - Support port configuration
 */

import { Command } from 'commander';
import { serve } from '@hono/node-server';
import app from '../server.js';
import chalk from 'chalk';

export const httpServeCommand = new Command('http-serve')
  .description('Start HTTP server with bash execution endpoint')
  .option('-p, --port <port>', 'Port to run server on', '3000')
  .option(
    '-h, --host <host>',
    'Host to bind server to',
    '0.0.0.0'
  )
  .action(async (options) => {
    try {
      const port = parseInt(options.port, 10);
      const host = options.host;

      console.error(chalk.blue('Starting OpenSkill HTTP server...'));
      console.error(
        chalk.gray(`Host: ${host}`)
      );
      console.error(chalk.gray(`Port: ${port}`));
      console.error();

      serve(
        {
          fetch: app.fetch,
          port,
          hostname: host,
        },
        (info) => {
          console.error(
            chalk.green('✓ OpenSkill HTTP server running')
          );
          console.error();
          console.error(chalk.bold('Endpoints:'));
          console.error(
            chalk.cyan(`  POST http://${info.address}:${info.port}/bash`)
          );
          console.error(
            chalk.gray('    Execute bash command with streaming output')
          );
          console.error(
            chalk.cyan(`  POST http://${info.address}:${info.port}/bash/exec`)
          );
          console.error(
            chalk.gray('    Execute bash command and return complete result')
          );
          console.error(
            chalk.cyan(`  GET  http://${info.address}:${info.port}/health`)
          );
          console.error(chalk.gray('    Health check endpoint'));
          console.error();
          console.error(
            chalk.yellow('Press Ctrl+C to stop the server')
          );
        }
      );

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.error();
        console.error(chalk.yellow('Shutting down server...'));
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.error();
        console.error(chalk.yellow('Shutting down server...'));
        process.exit(0);
      });
    } catch (error) {
      console.error(
        chalk.red('✗ Failed to start server:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });
