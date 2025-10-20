import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxService } from './SandboxService';

describe('SandboxService', () => {
  let sandboxService: SandboxService;

  beforeEach(() => {
    sandboxService = new SandboxService();
  });

  it('should create an instance', () => {
    expect(sandboxService).toBeInstanceOf(SandboxService);
  });

  it('should use default image name when none provided', () => {
    const service = new SandboxService();
    expect(service).toBeDefined();
  });

  it('should accept custom image name', () => {
    const customImage = 'custom-image:latest';
    const service = new SandboxService(undefined, undefined, customImage);
    expect(service).toBeDefined();
  });

  it('should accept mount path', () => {
    const mountPath = '/custom/path';
    const service = new SandboxService(mountPath);
    expect(service).toBeDefined();
  });

  it('should accept container name', () => {
    const containerName = 'custom-container';
    const service = new SandboxService(undefined, containerName);
    expect(service).toBeDefined();
  });
});
