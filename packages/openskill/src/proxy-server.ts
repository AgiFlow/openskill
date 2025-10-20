/**
 * Hono.js HTTP Server
 *
 * Simple HTTP server with bash command execution endpoint.
 * Streams command output back to client in real-time.
 *
 * DESIGN PATTERNS:
 * - HTTP streaming for real-time output
 * - Command execution with spawn for streaming
 *
 * CODING STANDARDS:
 * - Stream stdout/stderr as they arrive
 * - Handle errors gracefully
 * - Support command timeout
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { spawn } from 'child_process';

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'openskill-server'
  });
});

// Bash command execution with streaming response
app.post('/bash', (c) => {
  return stream(c, async (stream) => {
    try {
      const body = await c.req.json();
      const { command, timeout = 30000, cwd = process.cwd() } = body;

      if (!command) {
        await stream.write(
          JSON.stringify({
            type: 'error',
            message: 'Command is required'
          }) + '\n'
        );
        return;
      }

      // Send start event
      await stream.write(
        JSON.stringify({
          type: 'start',
          command,
          timestamp: new Date().toISOString()
        }) + '\n'
      );

      // Spawn process for streaming output
      const proc = spawn('sh', ['-c', command], {
        cwd,
        env: {
          ...process.env,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        },
      });

      let killed = false;
      let exitCode: number | null = null;

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!killed && proc.exitCode === null) {
          killed = true;
          proc.kill('SIGTERM');
          stream.write(
            JSON.stringify({
              type: 'timeout',
              message: 'Command execution timeout'
            }) + '\n'
          );
        }
      }, timeout);

      // Stream stdout
      proc.stdout.on('data', async (data) => {
        const output = data.toString();
        await stream.write(
          JSON.stringify({
            type: 'stdout',
            data: output
          }) + '\n'
        );
      });

      // Stream stderr
      proc.stderr.on('data', async (data) => {
        const output = data.toString();
        await stream.write(
          JSON.stringify({
            type: 'stderr',
            data: output
          }) + '\n'
        );
      });

      // Handle process exit
      proc.on('exit', async (code, signal) => {
        clearTimeout(timeoutId);
        exitCode = code;

        const exitMessage = killed
          ? 'Command execution timed out and was terminated'
          : code !== 0 && signal
          ? `Command terminated by signal: ${signal}`
          : code !== 0
          ? `Command failed with exit code: ${code}`
          : 'Command completed successfully';

        await stream.write(
          JSON.stringify({
            type: 'exit',
            exitCode: code,
            signal,
            killed,
            message: exitMessage,
            timestamp: new Date().toISOString()
          }) + '\n'
        );
      });

      // Handle errors
      proc.on('error', async (error) => {
        clearTimeout(timeoutId);
        const errorMessage = error.message.includes('ENOENT')
          ? `Command not found or executable missing: ${command.split(' ')[0]}`
          : error.message.includes('EACCES')
          ? `Permission denied executing: ${command.split(' ')[0]}`
          : `Failed to execute command: ${error.message}`;

        await stream.write(
          JSON.stringify({
            type: 'error',
            message: errorMessage,
            command,
            originalError: error.message
          }) + '\n'
        );
      });

      // Wait for process to complete
      await new Promise<void>((resolve) => {
        proc.on('close', () => {
          resolve();
        });
      });

    } catch (error) {
      await stream.write(
        JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : String(error)
        }) + '\n'
      );
    }
  });
});

// Non-streaming bash endpoint (returns complete result)
app.post('/bash/exec', async (c) => {
  try {
    const body = await c.req.json();
    const { command, timeout = 30000, cwd = process.cwd() } = body;

    if (!command) {
      return c.json({
        success: false,
        error: 'Command is required'
      }, 400);
    }

    return new Promise<Response>((resolve) => {
      const proc = spawn('sh', ['-c', command], {
        cwd,
        env: {
          ...process.env,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        },
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!killed && proc.exitCode === null) {
          killed = true;
          proc.kill('SIGTERM');
        }
      }, timeout);

      // Collect stdout
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collect stderr
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process exit
      proc.on('exit', (code) => {
        clearTimeout(timeoutId);

        const message = killed
          ? 'Command execution timed out and was terminated'
          : code !== 0
          ? `Command failed with exit code: ${code}`
          : 'Command completed successfully';

        const response = c.json({
          success: code === 0 && !killed,
          stdout,
          stderr,
          exitCode: code,
          killed,
          timeout: killed,
          message,
        });
        resolve(response);
      });

      // Handle errors
      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        const errorMessage = error.message.includes('ENOENT')
          ? `Command not found or executable missing: ${command.split(' ')[0]}`
          : error.message.includes('EACCES')
          ? `Permission denied executing: ${command.split(' ')[0]}`
          : `Failed to execute command: ${error.message}`;

        const response = c.json({
          success: false,
          error: errorMessage,
          command,
          originalError: error.message,
          exitCode: 1,
        });
        resolve(response);
      });
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default app;
