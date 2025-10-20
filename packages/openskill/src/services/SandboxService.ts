/**
 * SandboxService
 *
 * Service for managing Docker sandbox containers and executing commands safely.
 * Handles container lifecycle, command execution, and resource cleanup.
 *
 * DESIGN PATTERNS:
 * - Service layer pattern for business logic
 * - Resource management with cleanup
 *
 * CODING STANDARDS:
 * - Handle Docker errors gracefully
 * - Implement timeout and resource limits
 * - Clean up containers after use
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface SandboxExecuteOptions {
  command: string;
  timeout?: number;
  workdir?: string;
}

export interface SandboxExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
  timeout?: boolean;
}

export interface ContainerInfo {
  containerId: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  url: string;
}

export class SandboxService {
  private imageName = 'openskill-http';
  private containerPort = 3000;
  private dockerfilePath: string;
  private mountPath?: string;

  constructor(mountPath?: string) {
    // Resolve Dockerfile path relative to the project root
    this.dockerfilePath = path.resolve(
      process.cwd(),
      'packages/openskill'
    );
    this.mountPath = mountPath;
  }

  /**
   * Get container name for a skill
   */
  private getContainerName(skillName: string): string {
    return `openskill-skill-${skillName}`;
  }

  /**
   * Get available port for a new container
   */
  private async getAvailablePort(skillName: string): Promise<number> {
    // Use a hash of skill name to get consistent port
    const hash = skillName.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    // Port range: 3000-3999
    return 3000 + (Math.abs(hash) % 1000);
  }

  /**
   * Check if Docker is available
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Docker image exists
   */
  async isImageBuilt(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker images -q ${this.imageName}`
      );
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build Docker image
   */
  async buildImage(): Promise<void> {
    try {
      console.error(`Building Docker image ${this.imageName}...`);
      await execAsync(
        `docker build -t ${this.imageName} .`,
        { cwd: this.dockerfilePath }
      );
      console.error(`Docker image ${this.imageName} built successfully`);
    } catch (error) {
      throw new Error(
        `Failed to build Docker image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if skill container is running
   */
  async isContainerRunning(skillName: string): Promise<boolean> {
    try {
      const containerName = this.getContainerName(skillName);
      const { stdout } = await execAsync(
        `docker ps --filter "name=${containerName}" --format "{{.Names}}"`
      );
      return stdout.trim() === containerName;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start a skill-specific container
   */
  async startContainer(skillName: string): Promise<ContainerInfo> {
    try {
      const containerName = this.getContainerName(skillName);
      const hostPort = await this.getAvailablePort(skillName);

      // Check if container already exists and is running
      const isRunning = await this.isContainerRunning(skillName);

      if (isRunning) {
        return {
          containerId: containerName,
          port: hostPort,
          status: 'running',
          url: `http://localhost:${hostPort}`,
        };
      }

      // Check if image is built, if not build it
      const imageBuilt = await this.isImageBuilt();
      if (!imageBuilt) {
        await this.buildImage();
      }

      // Check if container exists but is stopped
      const { stdout: existingContainer } = await execAsync(
        `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`
      );

      if (existingContainer.trim() === containerName) {
        // Start existing container
        console.error(`Starting existing container ${containerName}...`);
        await execAsync(`docker start ${containerName}`);
      } else {
        // Start new container
        console.error(`Starting new container ${containerName}...`);

        // Build docker run command with optional volume mount
        let dockerRunCmd = `docker run -d --name ${containerName} -p ${hostPort}:${this.containerPort}`;

        if (this.mountPath) {
          // Mount host path to /workspace in container
          dockerRunCmd += ` -v "${this.mountPath}:/workspace"`;
          console.error(`Mounting ${this.mountPath} to /workspace`);
        }

        dockerRunCmd += ` ${this.imageName}`;

        await execAsync(dockerRunCmd);
      }

      // Wait for container to be healthy
      await this.waitForContainer(hostPort);

      return {
        containerId: containerName,
        port: hostPort,
        status: 'running',
        url: `http://localhost:${hostPort}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to start container for skill ${skillName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Wait for container to be healthy
   */
  private async waitForContainer(port: number, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(
          `http://localhost:${port}/health`
        );
        if (response.ok) {
          console.error('Container is ready');
          return;
        }
      } catch (error) {
        // Container not ready yet
      }

      // Wait 1 second before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Container failed to become healthy');
  }

  /**
   * Execute a command in a skill container
   */
  async executeCommand(
    skillName: string,
    options: SandboxExecuteOptions
  ): Promise<SandboxExecuteResult> {
    try {
      // Ensure container is running
      const containerInfo = await this.startContainer(skillName);

      // Execute command via HTTP API
      const response = await fetch(
        `${containerInfo.url}/bash/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command: options.command,
            timeout: options.timeout || 30000,
            cwd: options.workdir || '/workspace',
          }),
        }
      );

      const result = (await response.json()) as {
        success?: boolean;
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        error?: string;
        timeout?: boolean;
      };

      return {
        success: result.success ?? false,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode ?? 1,
        error: result.error,
        timeout: result.timeout,
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Stop a skill container
   */
  async stopContainer(skillName: string): Promise<void> {
    try {
      const containerName = this.getContainerName(skillName);
      const isRunning = await this.isContainerRunning(skillName);

      if (isRunning) {
        await execAsync(`docker stop ${containerName}`);
        console.error(`Container ${containerName} stopped`);
      }
    } catch (error) {
      throw new Error(
        `Failed to stop container: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove a skill container
   */
  async removeContainer(skillName: string): Promise<void> {
    try {
      const containerName = this.getContainerName(skillName);

      // Stop container first
      await this.stopContainer(skillName);

      // Remove container
      await execAsync(`docker rm ${containerName}`);
      console.error(`Container ${containerName} removed`);
    } catch (error) {
      throw new Error(
        `Failed to remove container: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(skillName: string, tail = 100): Promise<string> {
    try {
      const containerName = this.getContainerName(skillName);
      const { stdout } = await execAsync(
        `docker logs --tail ${tail} ${containerName}`
      );
      return stdout;
    } catch (error) {
      throw new Error(
        `Failed to get container logs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Write file to container workspace
   */
  async writeFile(skillName: string, filePath: string, content: string): Promise<void> {
    try {
      const containerInfo = await this.startContainer(skillName);

      const response = await fetch(
        `${containerInfo.url}/file/write`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: filePath,
            content,
          }),
        }
      );

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to write file');
      }
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Read file from container workspace
   */
  async readFile(skillName: string, filePath: string): Promise<string> {
    try {
      const containerInfo = await this.startContainer(skillName);

      const response = await fetch(
        `${containerInfo.url}/file/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: filePath,
          }),
        }
      );

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        content?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to read file');
      }

      return result.content || '';
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
