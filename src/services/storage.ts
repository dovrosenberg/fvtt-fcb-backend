import { Storage as GCStorage, Bucket as GCBucket } from '@google-cloud/storage';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Interface for our storage provider
export interface StorageProvider {
  saveFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>;
  getPublicUrl(fileName: string): string;
}

// GCS Storage Provider
class GCSStorageProvider implements StorageProvider {
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
        cacheControl: 'public, max-age=31536000' // Cache for 1 year
      }
    });

    return this.getPublicUrl(fileName);
  }

  getPublicUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
  }
}

// AWS S3 Storage Provider
class AWSS3StorageProvider implements StorageProvider {
  private s3Client: S3;
  private bucketName: string;
  private region: string;

  constructor(bucketName: string, accessKeyId: string, secretAccessKey: string, region: string) {
    this.s3Client = new S3({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    this.bucketName = bucketName;
    this.region = region;
  }

  async saveFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName.trim(),
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000' // Cache for 1 year
      }
    });

    await upload.done();
    return this.getPublicUrl(fileName);
  }

  getPublicUrl(fileName: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
  }
}

// The storage provider that will be used throughout the application
let storageProvider: StorageProvider;

const loadStorage = async function(): Promise<void> {
  if (!storageProvider) {
    // Determine which storage provider to use based on environment variables
    const storageType = process.env.STORAGE_TYPE || 'gcs'; // Default to GCS if not specified

    if (storageType.toLowerCase() === 'aws') {
      // Check for required AWS environment variables
      if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID ||
          !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
        throw new Error('AWS S3 storage selected but missing required environment variables');
      }

      storageProvider = new AWSS3StorageProvider(
        process.env.AWS_BUCKET_NAME,
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
        process.env.AWS_REGION
      );
      console.log(`Connected to AWS S3 bucket: ${process.env.AWS_BUCKET_NAME}`);
    } else {
      // Default to GCS
      if (!process.env.GCP_CERT || !process.env.GCP_PROJECT_ID || !process.env.GCS_BUCKET_NAME) {
        throw new Error('GCS storage selected but missing required environment variables');
      }

      const credentials = JSON.parse(Buffer.from(process.env.GCP_CERT as string, 'base64').toString('utf-8'));
      storageProvider = new GCSStorageProvider(
        process.env.GCS_BUCKET_NAME,
        credentials,
        process.env.GCP_PROJECT_ID
      );
      console.log(`Connected to GCS bucket: ${process.env.GCS_BUCKET_NAME}`);
    }
  }

  if (!storageProvider) {
    throw new Error('Unable to initialize storage provider');
  }
};

export {
  loadStorage,
  storageProvider
};