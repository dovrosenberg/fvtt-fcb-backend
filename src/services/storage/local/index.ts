import fs from 'fs';
import path from 'path';
import { StorageProvider } from '../types';

export class LocalStorageProvider implements StorageProvider {
  private rootDir: string;
  private publicBaseUrl?: string;

  constructor(rootDir: string, publicBaseUrl?: string) {
    this.rootDir = rootDir;
    this.publicBaseUrl = publicBaseUrl;

    // Ensure base directory exists
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  async saveFile(fileName: string, fileBuffer: Buffer, _contentType: string): Promise<string> {
    // We ignore contentType here; you can store it in metadata later if needed.
    const targetPath = path.join(this.rootDir, fileName);

    // Ensure subdirectories exist if fileName contains folders
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    await fs.promises.writeFile(targetPath, fileBuffer);

    return this.getPublicUrl(fileName);
  }

  getPublicUrl(fileName: string): string {
    if (this.publicBaseUrl) {
      // Ensure no double slashes
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${fileName.replace(/^\/+/, '')}`;
    }

    // Fallback: relative path (e.g. if Express serves /files from STORAGE_LOCAL_DIR)
    return `/files/${fileName.replace(/^\/+/, '')}`;
  }
}
