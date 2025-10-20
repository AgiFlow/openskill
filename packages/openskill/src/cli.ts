#!/usr/bin/env node
/**
 * MCP Server Entry Point
 *
 * DESIGN PATTERNS:
 * - CLI pattern with Commander for argument parsing
 * - Command pattern for organizing CLI commands
 * - Transport abstraction for multiple communication methods
 *
 * CODING STANDARDS:
 * - Use async/await for asynchronous operations
 * - Handle errors gracefully with try-catch
 * - Log important events for debugging
 * - Register all commands in main entry point
 *
 * AVOID:
 * - Hardcoding command logic in index.ts (use separate command files)
 * - Missing error handling for command execution
 */
import { Command } from 'commander';
import { mcpServeCommand } from './commands/mcp-serve.js';
import { httpServeCommand } from './commands/http-serve.js';
import { useSkillCommand } from './commands/use-skill.js';
import { getSkillCommand } from './commands/get-skill.js';
import { doctorCommand } from './commands/doctor.js';
import packageJson from '../package.json' assert { type: 'json' };

/**
 * Main entry point
 */
async function main() {
  const program = new Command();

  program
    .name('openskill')
    .description('Model Context Protocol server for OpenSkill rating system integration')
    .version(packageJson.version);

  // Add all commands
  program.addCommand(mcpServeCommand);
  program.addCommand(httpServeCommand);
  program.addCommand(useSkillCommand);
  program.addCommand(getSkillCommand);
  program.addCommand(doctorCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main();
