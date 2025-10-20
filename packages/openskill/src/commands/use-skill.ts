/**
 * Use Skill Command
 *
 * CLI command to execute skills in Docker sandbox environments.
 * Provides command-line interface equivalent to the use-skill MCP tool.
 *
 * DESIGN PATTERNS:
 * - Commander.js command pattern
 * - Direct tool execution
 *
 * CODING STANDARDS:
 * - Handle errors gracefully
 * - Output results to stdout
 * - Use stderr for logging
 */

import { Command } from 'commander';
import { UseSkillTool } from '../tools/UseSkillTool.js';
import chalk from 'chalk';

export const useSkillCommand = new Command('use-skill')
  .description('Execute a skill in a sandboxed Docker environment')
  .argument('<skill-name>', 'Name of the skill to execute (e.g., "canvas-design")')
  .argument('<bash>', 'Bash command to execute in the skill container')
  .option(
    '-t, --timeout <ms>',
    'Command timeout in milliseconds',
    '30000'
  )
  .option(
    '-w, --workdir <path>',
    'Working directory for command execution',
    '/workspace'
  )
  .option(
    '-m, --mount <path>',
    'Host path to mount into container /workspace'
  )
  .option(
    '-c, --container-name <name>',
    'Custom Docker container name (allows reusing one container for multiple skills)'
  )
  .action(async (skillName: string, bash: string, options) => {
    try {
      const timeout = parseInt(options.timeout, 10);
      const workdir = options.workdir;
      const mountPath = options.mount;
      const containerName = options.containerName;

      // Log configuration
      console.error(chalk.blue('Executing skill...'));
      console.error(chalk.gray(`Skill: ${skillName}`));
      console.error(chalk.gray(`Command: ${bash}`));
      console.error(chalk.gray(`Timeout: ${timeout}ms`));
      console.error(chalk.gray(`Working Directory: ${workdir}`));
      if (mountPath) {
        console.error(chalk.gray(`Mount: ${mountPath} -> ${workdir}`));
      }
      if (containerName) {
        console.error(chalk.gray(`Container: ${containerName}`));
      }
      console.error();

      // Create and execute tool
      const tool = new UseSkillTool({
        timeout,
        workdir,
        mountPath,
        containerName,
      });

      const result = await tool.execute({
        skillName,
        bash,
      });

      // Output result
      if (result.isError) {
        console.error(chalk.red('✗ Execution failed'));
        console.error();
      } else {
        console.error(chalk.green('✓ Execution completed'));
        console.error();
      }

      // Print result content to stdout
      for (const content of result.content) {
        if (content.type === 'text') {
          console.log(content.text);
        }
      }

      // Exit with appropriate code
      process.exit(result.isError ? 1 : 0);
    } catch (error) {
      console.error(
        chalk.red('✗ Error:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });
