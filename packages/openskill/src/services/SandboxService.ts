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
 *
 * USAGE:
 * - Pass mountPath to specify volume mount location
 * - Pass containerName to use custom container naming
 * - Pass imageName to use a pre-built Docker image instead of default
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync } from 'fs';

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
  private imageName = 'agiflowai/openskill:latest';
  private containerPort = 3000;
  private dockerfilePath: string;
  private mountPath: string;
  private customContainerName?: string;
  private repoPrefix: string;
  private isCustomImage: boolean;

  constructor(mountPath?: string, containerName?: string, imageName?: string) {
    const cwd = process.cwd();

    // Use custom image name if provided, otherwise use default
    if (imageName) {
      this.imageName = imageName;
      this.isCustomImage = true;
    } else {
      this.isCustomImage = false;
    }

    // Resolve Dockerfile path - check if we're already in openskill package or need to navigate to it
    const currentDirDockerfile = path.join(cwd, 'Dockerfile');
    const packageDirDockerfile = path.join(cwd, 'packages/openskill');

    // Check if Dockerfile exists in current directory (already in packages/openskill)
    if (existsSync(currentDirDockerfile)) {
      this.dockerfilePath = cwd;
    } else {
      // Try packages/openskill path (running from repo root)
      this.dockerfilePath = packageDirDockerfile;
    }

    // Default to mounting current working directory if no mount path specified
    this.mountPath = mountPath || cwd;
    this.customContainerName = containerName;

    // Get repo directory name for container prefix
    // This allows same skill to have different containers per repo
    this.repoPrefix = path.basename(cwd).toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Get container name for a skill
   * If custom container name is provided, prefix it with repo directory name
   * Otherwise, use repo-prefixed skill-specific container name
   * This ensures different repos get different containers for the same skill
   */
  private getContainerName(skillName: string): string {
    if (this.customContainerName) {
      return `${this.repoPrefix}-${this.customContainerName}`;
    }
    return `${this.repoPrefix}-openskill-skill-${skillName}`;
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
   * Pull Docker image from registry
   */
  async pullImage(): Promise<boolean> {
    try {
      console.error(`Pulling Docker image ${this.imageName}...`);
      await execAsync(`docker pull ${this.imageName}`);
      console.error(`Docker image ${this.imageName} pulled successfully`);
      return true;
    } catch (error) {
      console.error(
        `Failed to pull Docker image: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Build Docker image
   * Note: If a custom image name was provided to constructor, this will still
   * attempt to build using the Dockerfile. To use a pre-built image, ensure
   * the image exists before calling methods that depend on it.
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
   * Get the actual port a container is using
   */
  private async getContainerPort(containerName: string): Promise<number | null> {
    try {
      const { stdout } = await execAsync(
        `docker port ${containerName} ${this.containerPort}`
      );
      // Output format: "0.0.0.0:3218" or "[::]:3218"
      const match = stdout.match(/:(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Start a skill-specific container
   */
  async startContainer(skillName: string): Promise<ContainerInfo> {
    try {
      const containerName = this.getContainerName(skillName);

      // Check if container already exists and is running
      const isRunning = await this.isContainerRunning(skillName);

      if (isRunning) {
        // Get the actual port the running container is using
        const actualPort = await this.getContainerPort(containerName);
        const hostPort = actualPort || await this.getAvailablePort(skillName);

        return {
          containerId: containerName,
          port: hostPort,
          status: 'running',
          url: `http://localhost:${hostPort}`,
        };
      }

      // Get port for new container
      const hostPort = await this.getAvailablePort(skillName);

      // Ensure image is available
      const imageBuilt = await this.isImageBuilt();
      if (!imageBuilt) {
        // If using default image (not custom), try to pull from Docker Hub first
        if (!this.isCustomImage) {
          console.error('Image not found locally, attempting to pull from Docker Hub...');
          const pulled = await this.pullImage();

          // If pull fails, fall back to building
          if (!pulled) {
            console.error('Pull failed, falling back to local build...');
            await this.buildImage();
          }
        } else {
          // For custom images, try to pull first, then build as fallback
          const pulled = await this.pullImage();
          if (!pulled) {
            console.error('Pull failed, attempting to build...');
            await this.buildImage();
          }
        }
      }

      // Check if container exists but is stopped
      const { stdout: existingContainer } = await execAsync(
        `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`
      );

      let actualHostPort = hostPort;

      if (existingContainer.trim() === containerName) {
        // Start existing container and get its actual port
        console.error(`Starting existing container ${containerName}...`);
        await execAsync(`docker start ${containerName}`);

        // Get the port the existing container was using
        const existingPort = await this.getContainerPort(containerName);
        if (existingPort) {
          actualHostPort = existingPort;
        }
      } else {
        // Start new container
        console.error(`Starting new container ${containerName}...`);

        // Build docker run command with optional volume mount
        let dockerRunCmd = `docker run -d --name ${containerName} -p ${hostPort}:${this.containerPort}`;

        if (this.mountPath) {
          // Mount host path to the same path in container to avoid confusion
          dockerRunCmd += ` -v "${this.mountPath}:${this.mountPath}"`;
          console.error(`Mounting ${this.mountPath} to ${this.mountPath}`);
        }

        dockerRunCmd += ` ${this.imageName}`;

        await execAsync(dockerRunCmd);
      }

      // Wait for container to be healthy
      await this.waitForContainer(actualHostPort);

      return {
        containerId: containerName,
        port: actualHostPort,
        status: 'running',
        url: `http://localhost:${actualHostPort}`,
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
            cwd: options.workdir || this.mountPath,
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
   * Write file to container workspace using bash command
   */
  async writeFile(skillName: string, filePath: string, content: string): Promise<void> {
    try {
      // Escape content for safe shell usage
      const escapedContent = content.replace(/'/g, "'\\''");
      const command = `cat > '${filePath}' << 'EOF'\n${escapedContent}\nEOF`;

      const result = await this.executeCommand(skillName, { command });

      if (!result.success) {
        throw new Error(result.error || result.stderr || 'Failed to write file');
      }
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Read file from container workspace using bash command
   */
  async readFile(skillName: string, filePath: string): Promise<string> {
    try {
      const result = await this.executeCommand(skillName, {
        command: `cat '${filePath}'`
      });

      if (!result.success) {
        throw new Error(result.error || result.stderr || 'Failed to read file');
      }

      return result.stdout;
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Prewarm Docker environment
   * This pulls the image from Docker Hub if needed and optionally starts a default container
   * to reduce cold start time when skills are first used
   */
  async prewarm(): Promise<void> {
    try {
      console.error('Prewarming Docker environment...');

      // Check if Docker is available
      const dockerAvailable = await this.isDockerAvailable();
      if (!dockerAvailable) {
        console.error('Docker is not available, skipping prewarm');
        return;
      }

      // Check if image exists locally
      const imageBuilt = await this.isImageBuilt();
      if (!imageBuilt) {
        // If using default image (not custom), pull from Docker Hub
        if (!this.isCustomImage) {
          console.error('Docker image not found, pulling from Docker Hub...');
          const pulled = await this.pullImage();

          // If pull fails, fall back to building
          if (!pulled) {
            console.error('Pull failed, falling back to local build...');
            await this.buildImage();
          }
        } else {
          // For custom images, try to pull first, then build as fallback
          const pulled = await this.pullImage();
          if (!pulled) {
            console.error('Pull failed, attempting to build...');
            await this.buildImage();
          }
        }
        console.error('Docker image prewarmed successfully');
      } else {
        console.error('Docker image already exists');
      }
    } catch (error) {
      // Don't fail startup if prewarming fails, just log the error
      console.error(
        `Warning: Failed to prewarm Docker environment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
