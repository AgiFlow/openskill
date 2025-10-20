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

export interface ServerOptions {
  useSkillTimeout?: number;
  useSkillWorkdir?: string;
  useSkillMountPath?: string;
  disabledTools?: string[];
  skillsPath?: string;
}

export function createServer(options: ServerOptions = {}): Server {
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

  // Initialize tools
  const getSkillTool = new GetSkillTool({
    skillsPath: options.skillsPath,
  });
  const useSkillToolOptions: UseSkillToolOptions = {
    timeout: options.useSkillTimeout,
    workdir: options.useSkillWorkdir,
    mountPath: options.useSkillMountPath,
  };
  const useSkillTool = new UseSkillTool(useSkillToolOptions);

  // Filter out disabled tools
  const disabledTools = options.disabledTools || [];
  const availableTools: ToolDefinition[] = [];

  if (!disabledTools.includes(GetSkillTool.TOOL_NAME)) {
    availableTools.push(getSkillTool.getDefinition());
  }

  if (!disabledTools.includes(UseSkillTool.TOOL_NAME)) {
    availableTools.push(useSkillTool.getDefinition());
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: availableTools,
  }));

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
      return await useSkillTool.execute(args as any);
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}
