/**
 * MCP Server Setup
 *
 * DESIGN PATTERNS:
 * - Factory pattern for server creation
 * - Tool registration pattern
 *
 * CODING STANDARDS:
 * - Register all tools, resources, and prompts here
 * - Keep server setup modular and extensible
 * - Import tools from ../tools/ and register them in the handlers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { GetSkillTool, UseSkillTool } from '../tools/index.js';
import type { UseSkillToolOptions } from '../tools/UseSkillTool.js';
import type { ToolDefinition } from '../types/index.js';
import { SandboxService } from '../services/SandboxService.js';

export interface ServerOptions {
  useSkillTimeout?: number;
  useSkillWorkdir?: string;
  useSkillMountPath?: string;
  useSkillContainerName?: string;
  useSkillImageName?: string;
  disabledTools?: string[];
  skillsPath?: string;
  prewarmDocker?: boolean;
}

export interface ServerInstance {
  server: Server;
  cleanup: () => Promise<void>;
}

export function createServer(options: ServerOptions = {}): ServerInstance {
  const server = new Server(
    {
      name: '@agiflowai/openskill',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Track containers started in this session
  const startedContainers = new Set<string>();

  // Initialize tools
  const getSkillTool = new GetSkillTool({
    skillsPath: options.skillsPath,
  });
  const useSkillToolOptions: UseSkillToolOptions = {
    timeout: options.useSkillTimeout,
    workdir: options.useSkillWorkdir,
    mountPath: options.useSkillMountPath,
    containerName: options.useSkillContainerName,
    imageName: options.useSkillImageName,
  };
  const useSkillTool = new UseSkillTool(useSkillToolOptions);

  // Create sandbox service for cleanup
  const sandboxService = new SandboxService(
    options.useSkillMountPath,
    options.useSkillContainerName,
    options.useSkillImageName
  );

  // Filter out disabled tools
  const disabledTools = options.disabledTools || [];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Build available tools list (handle both sync and async getDefinition)
    const toolPromises: Promise<ToolDefinition>[] = [];

    if (!disabledTools.includes(GetSkillTool.TOOL_NAME)) {
      toolPromises.push(Promise.resolve(getSkillTool.getDefinition()));
    }

    if (!disabledTools.includes(UseSkillTool.TOOL_NAME)) {
      toolPromises.push(Promise.resolve(useSkillTool.getDefinition()));
    }

    const availableTools = await Promise.all(toolPromises);

    return { tools: availableTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Check if tool is disabled
    if (disabledTools.includes(name)) {
      throw new Error(`Tool '${name}' is disabled`);
    }

    // Execute tools
    if (name === GetSkillTool.TOOL_NAME) {
      return await getSkillTool.execute(args as any);
    }

    if (name === UseSkillTool.TOOL_NAME) {
      const result = await useSkillTool.execute(args as any);

      // Track the container used by this skill
      const skillInput = args as { skillName: string };
      if (skillInput.skillName) {
        startedContainers.add(skillInput.skillName);
      }

      return result;
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  if (options.prewarmDocker) {
    // Run prewarm in background, don't block server startup
    sandboxService.prewarm().catch((error: any) => {
      console.error('Prewarm failed:', error);
    });
  }

  // Cleanup method to stop and remove containers started in this session
  const cleanup = async (): Promise<void> => {
    if (startedContainers.size === 0) {
      console.error('No containers to clean up');
      return;
    }

    console.error(`Cleaning up ${startedContainers.size} container(s)...`);

    const cleanupPromises = Array.from(startedContainers).map(async (skillName) => {
      try {
        await sandboxService.stopContainer(skillName);
        await sandboxService.removeContainer(skillName);
        console.error(`Cleaned up container for skill: ${skillName}`);
      } catch (error) {
        console.error(
          `Failed to clean up container for skill ${skillName}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    });

    await Promise.all(cleanupPromises);
    console.error('Container cleanup complete');
  };

  return { server, cleanup };
}
