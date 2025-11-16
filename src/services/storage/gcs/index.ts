import { Storage as GCStorage, Bucket as GCBucket } from '@google-cloud/storage';
import { StorageProvider } from '../types';

export class GCSStorageProvider implements StorageProvider {
  private bucket: GCBucket;

  constructor(bucketName: string, credentials: any, projectId: string) {
    const storage = new GCStorage({
      credentials,
      projectId,
    });

    this.bucket = storage.bucket(bucketName);
  }

  async saveFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const file = this.bucket.file(fileName);

    await file.save(fileBuffer, {
      contentType,
      public: true,
      metadata: {
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    return this.getPublicUrl(fileName);
  }

  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
  }
}
