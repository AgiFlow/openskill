/**
 * GetSkillTool
 *
 * MCP tool for retrieving Claude Code skills from .claude/skills/ directory.
 * Mimics Claude's Skill tool by reading SKILL.md files and returning skill content.
 *
 * DESIGN PATTERNS:
 * - Tool implementation pattern with Tool interface
 * - Delegation to SkillService for business logic
 *
 * CODING STANDARDS:
 * - Use static TOOL_NAME constant
 * - Return CallToolResult with content array
 * - Handle errors gracefully
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Tool, ToolDefinition } from '../types/index.js';
import { SkillService } from '../services/SkillService.js';

export interface GetSkillToolInput {
  command: string;
}

export interface GetSkillToolOptions {
  skillsPath?: string;
}

export class GetSkillTool implements Tool<GetSkillToolInput> {
  static readonly TOOL_NAME = 'get-skill';

  private skillService: SkillService;

  constructor(options: GetSkillToolOptions = {}) {
    this.skillService = new SkillService(options.skillsPath);
  }

  getDefinition(): ToolDefinition {
    return {
      name: GetSkillTool.TOOL_NAME,
      description: `Execute a skill within the main conversation

<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see <command-message>The "{name}" skill is loading</command-message>
- The skill's prompt will expand and provide detailed instructions on how to complete the task

Important:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
</skills_instructions>`,
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The skill name (no arguments). E.g., "pdf" or "xlsx"',
          },
        },
        required: ['command'],
        additionalProperties: false,
      },
    };
  }

  async execute(input: GetSkillToolInput): Promise<CallToolResult> {
    try {
      const { command } = input;

      // Get the requested skill
      const skill = await this.skillService.getSkill(command);

      if (!skill) {
        // If skill not found, list available skills
        const skills = await this.skillService.getSkills();

        const availableSkills = skills
          .map(
            (s) => `<skill>
<name>
${s.name}
</name>
<description>
${s.description} (${s.location})
</description>
<location>
${s.location}
</location>
</skill>`
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Skill "${command}" not found. Available skills:\n\n<available_skills>\n${availableSkills}\n</available_skills>`,
            },
          ],
          isError: true,
        };
      }

      // Return the skill content in the format expected by Claude
      return {
        content: [
          {
            type: 'text',
            text: `Launching skill: ${skill.name}`,
          },
          {
            type: 'text',
            text: `<command-message>The "${skill.name}" skill is running</command-message>\n<command-name>${skill.name}</command-name>`,
          },
          {
            type: 'text',
            text: `Base directory for this skill: ${skill.basePath}\n\n${skill.content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving skill: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
