import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileStore } from '@khata-saathi/core';

export class LocalDiskFileStore implements FileStore {
  readonly providerName = 'local-disk';
  readonly isStub = false;

  constructor(private readonly baseDir: string) {}

  private resolveSafe(key: string): string {
    const clean = key.replace(/[^a-zA-Z0-9._/-]/g, '_');
    return path.join(this.baseDir, clean);
  }

  async saveFile(key: string, content: Uint8Array | string): Promise<{ key: string; location: string }> {
    const fullPath = this.resolveSafe(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return { key, location: fullPath };
  }

  async readFile(key: string): Promise<Uint8Array | null> {
    try {
      return await fs.readFile(this.resolveSafe(key));
    } catch {
      return null;
    }
  }
}
