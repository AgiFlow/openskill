/**
 * @agiflowai/openskill - Public API
 *
 * DESIGN PATTERNS:
 * - Barrel export pattern for clean public API
 * - Named exports only (no default exports)
 * - Organized by module type (server, types, transports)
 *
 * CODING STANDARDS:
 * - Export only public-facing interfaces and classes
 * - Group related exports with comments
 * - Use explicit named exports (no wildcard exports)
 * - Keep in sync with module structure
 *
 * AVOID:
 * - Default exports (use named exports)
 * - Wildcard exports (be explicit)
 * - Exporting internal implementation details
 * - Mixing CLI and library concerns
 */

// Server
export { createServer } from './server/index.js';

// Types
export type * from './types/index.js';

// Transports
export { StdioTransportHandler } from './transports/stdio.js';

// Tools
export { GetSkillTool, UseSkillTool } from './tools/index.js';

// Services
export { SkillService, SandboxService } from './services/index.js';

// Prompts - Add prompt exports here as you create them
// Example: export { MyPrompt } from './prompts/MyPrompt.js';

// Utils - Add utility exports here as you create them
// Example: export { formatHelper } from './utils/formatHelper.js';
