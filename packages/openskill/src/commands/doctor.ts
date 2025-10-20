/**
 * Doctor Command
 *
 * CLI command to check if Docker is installed and accessible.
 * Validates the environment for running OpenSkill.
 *
 * DESIGN PATTERNS:
 * - Commander.js command pattern
 * - Health check pattern
 *
 * CODING STANDARDS:
 * - Handle errors gracefully
 * - Output results to stdout
 * - Use stderr for logging
 * - Exit with appropriate codes
 */

import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export const doctorCommand = new Command('doctor')
  .description('Check if Docker is installed and accessible')
  .action(async () => {
    console.log(chalk.blue('Running OpenSkill environment checks...'));
    console.log();

    let hasErrors = false;

    // Check Docker installation
    try {
      console.log(chalk.gray('Checking Docker installation...'));
      const { stdout } = await execAsync('docker --version');
      const version = stdout.trim();
      console.log(chalk.green('✓ Docker is installed:'), version);
    } catch (error) {
      hasErrors = true;
      console.error(chalk.red('✗ Docker is not installed'));
      console.error();
      console.error(chalk.yellow('To install Docker:'));
      console.error(chalk.gray('  Visit https://docs.docker.com/get-docker/'));
      console.error(chalk.gray('  Or use your package manager:'));
      console.error(chalk.gray('    macOS: brew install --cask docker'));
      console.error(chalk.gray('    Linux: apt-get install docker.io (Ubuntu/Debian)'));
      console.error(chalk.gray('            yum install docker (CentOS/RHEL)'));
    }

    console.log();

    // Check Docker daemon
    try {
      console.log(chalk.gray('Checking Docker daemon...'));
      await execAsync('docker info');
      console.log(chalk.green('✓ Docker daemon is running'));
    } catch (error) {
      hasErrors = true;
      console.error(chalk.red('✗ Docker daemon is not running'));
      console.error();
      console.error(chalk.yellow('To start Docker:'));
      console.error(chalk.gray('  macOS: Start Docker Desktop application'));
      console.error(chalk.gray('  Linux: sudo systemctl start docker'));
    }

    console.log();

    // Final summary
    if (hasErrors) {
      console.error(
        chalk.red('✗ Environment check failed:'),
        'Please install and start Docker to use OpenSkill'
      );
      process.exit(1);
    } else {
      console.log(chalk.green('✓ All checks passed!'));
      console.log(chalk.gray('  Your environment is ready to use OpenSkill.'));
      process.exit(0);
    }
  });
