/**
 * Get Skill Command
 *
 * CLI command to retrieve skill information from .claude/skills/ directory.
 * Provides command-line interface equivalent to the get-skill MCP tool.
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
import { GetSkillTool } from '../tools/GetSkillTool.js';
import chalk from 'chalk';

export const getSkillCommand = new Command('get-skill')
  .description('Retrieve skill information from .claude/skills/ directory')
  .argument('<skill-name>', 'Name of the skill to retrieve (e.g., "canvas-design", "pdf")')
  .option(
    '-p, --skills-path <path>',
    'Path to skills directory',
    '.claude/skills'
  )
  .option(
    '-l, --list',
    'List all available skills instead of retrieving a specific one'
  )
  .action(async (skillName: string, options) => {
    try {
      const skillsPath = options.skillsPath;

      // Log configuration
      console.error(chalk.blue('Getting skill information...'));
      console.error(chalk.gray(`Skills path: ${skillsPath}`));
      console.error();

      // Create and execute tool
      const tool = new GetSkillTool({
        skillsPath,
      });

      const result = await tool.execute({
        command: skillName,
      });

      // Output result
      if (result.isError) {
        console.error(chalk.red('✗ Failed to retrieve skill'));
        console.error();
      } else {
        console.error(chalk.green('✓ Skill retrieved successfully'));
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
