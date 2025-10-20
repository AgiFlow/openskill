/**
 * Sandbox Server
 *
 * Hono.js server that runs inside Docker container to execute bash commands safely.
 * Provides HTTP API for command execution with timeout and resource limits.
 */

import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Execute bash command endpoint
app.post('/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { command, timeout = 30000, workdir = '/workspace' } = body;

    if (!command) {
      return c.json({ error: 'Command is required' }, 400);
    }

    // Execute command with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workdir,
        signal: controller.signal,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          HOME: '/workspace',
          PATH: '/usr/local/bin:/usr/bin:/bin',
        },
      });

      clearTimeout(timeoutId);

      return c.json({
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it was a timeout
      if (error.killed || error.signal === 'SIGTERM') {
        return c.json({
          success: false,
          error: 'Command execution timeout',
          timeout: true,
          exitCode: error.code || -1,
        }, 408);
      }

      // Command executed but returned non-zero exit code
      return c.json({
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        error: error.message,
        exitCode: error.code || 1,
      }, 200); // Return 200 because the execution itself succeeded
    }
  } catch (error) {
    return c.json({
      success: false,
      error: error.message || 'Unknown error',
    }, 500);
  }
});

// File operations endpoint (optional - for reading/writing files)
app.post('/file/write', async (c) => {
  try {
    const { path, content } = await c.req.json();

    if (!path || content === undefined) {
      return c.json({ error: 'Path and content are required' }, 400);
    }

    const safeCommand = `cat > ${JSON.stringify(path)} << 'EOF'\n${content}\nEOF`;
    const { stdout, stderr } = await execAsync(safeCommand, {
      cwd: '/workspace',
    });

    return c.json({
      success: true,
      path,
      message: 'File written successfully',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

app.post('/file/read', async (c) => {
  try {
    const { path } = await c.req.json();

    if (!path) {
      return c.json({ error: 'Path is required' }, 400);
    }

    const { stdout } = await execAsync(`cat ${JSON.stringify(path)}`, {
      cwd: '/workspace',
    });

    return c.json({
      success: true,
      path,
      content: stdout,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

// Cleanup endpoint (for container shutdown)
app.post('/cleanup', async (c) => {
  try {
    // Clean up temporary files
    await execAsync('rm -rf /workspace/tmp/*', { cwd: '/workspace' });

    return c.json({
      success: true,
      message: 'Cleanup completed',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

const port = process.env.PORT || 3000;

console.log(`Sandbox server starting on port ${port}...`);
export default {
  port,
  fetch: app.fetch,
};
