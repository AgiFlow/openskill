/**
 * UseSkillTool
 *
 * MCP tool for executing skills in Docker sandbox environments.
 * Manages Docker containers per skill and executes bash commands safely.
 *
 * DESIGN PATTERNS:
 * - Tool implementation pattern with Tool interface
 * - Delegation to SandboxService for container management
 *
 * CODING STANDARDS:
 * - Use static TOOL_NAME constant
 * - Return CallToolResult with content array
 * - Handle errors gracefully
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Tool, ToolDefinition } from '../types/index.js';
import { SandboxService } from '../services/SandboxService.js';

export interface UseSkillToolInput {
  skillName: string;
  bash: string;
}

export interface UseSkillToolOptions {
  timeout?: number;
  workdir?: string;
  mountPath?: string;
  containerName?: string;
  imageName?: string;
}

export class UseSkillTool implements Tool<UseSkillToolInput> {
  static readonly TOOL_NAME = 'use-skill';

  private sandboxService: SandboxService;
  private timeout: number;
  private workdir: string;
  private mountPath?: string;
  private containerName?: string;
  private imageName?: string;

  constructor(options: UseSkillToolOptions = {}) {
    this.timeout = options.timeout ?? 30000;
    this.workdir = options.workdir ?? '/workspace';
    this.mountPath = options.mountPath;
    this.containerName = options.containerName;
    this.imageName = options.imageName;
    this.sandboxService = new SandboxService(this.mountPath, this.containerName, this.imageName);
  }

  getDefinition(): ToolDefinition {
    return {
      name: UseSkillTool.TOOL_NAME,
      description: `You must execute a skill in a sandboxed Docker environment with bash command execution for safety.
Please use relative path to Working Directory, the container mount uses working directory /workspace.
- Working Directory: ${this.workdir}${this.mountPath ? `\n- Host Mount: ${this.mountPath} -> ${this.workdir}` : ''}
PS: If the script is large, you write a script first to a file and MUST execute it with use-skill tool command to improve safety.`,
      inputSchema: {
        type: 'object',
        properties: {
          skillName: {
            type: 'string',
            description: 'Name of the skill to execute (e.g., "canvas-design", "slack-gif-creator")',
          },
          bash: {
            type: 'string',
            description: 'Bash command to execute in the skill container',
          },
        },
        required: ['skillName', 'bash'],
        additionalProperties: false,
      },
    };
  }

  async execute(input: UseSkillToolInput): Promise<CallToolResult> {
    try {
      const { skillName, bash } = input;

      // Check if Docker is available
      const dockerAvailable = await this.sandboxService.isDockerAvailable();
      if (!dockerAvailable) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Docker is not available. Please install Docker to use this tool.',
            },
          ],
          isError: true,
        };
      }

      // Execute command in skill container using constructor options
      const result = await this.sandboxService.executeCommand(skillName, {
        command: bash,
        timeout: this.timeout,
        workdir: this.workdir,
      });

      // Format output
      let output = '';

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      output += `Exit Code: ${result.exitCode}\n`;

      if (result.timeout) {
        output += `Status: TIMEOUT\n`;
      } else if (result.success) {
        output += `Status: SUCCESS\n`;
      } else {
        output += `Status: FAILED\n`;
      }

      if (result.error) {
        output += `Error: ${result.error}\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing skill: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
