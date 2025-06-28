

import { loadStorage, storageProvider } from '@/services/storage';

// Mock the cloud storage libraries
jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockImplementation(() => ({
      file: jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined),
      })),
      name: 'test-gcs-bucket',
    })),
  })),
}));

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue(undefined),
  })),
}));

// A simple base64 encoded JSON for GCP credentials
const GCS_CERT = Buffer.from(JSON.stringify({ client_email: 'test@test.com', private_key: 'private_key' })).toString('base64');

describe('Storage Service', () => {
  beforeEach(() => {
    // Reset environment variables and mocks
    delete process.env.STORAGE_TYPE;
    delete process.env.GCS_BUCKET_NAME;
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCP_CERT;
    delete process.env.AWS_BUCKET_NAME;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;
    jest.clearAllMocks();

    // Reset the storageProvider singleton by dynamically re-importing the module
    // This ensures each test gets a fresh state
    jest.resetModules();
  });

  describe('loadStorage', () => {
    it('should initialize GCS provider by default', async () => {
        const { loadStorage } = await import('@/services/storage');
        process.env.GCS_BUCKET_NAME = 'test-gcs-bucket';
        process.env.GCP_PROJECT_ID = 'test-gcp-project';
        process.env.GCP_CERT = GCS_CERT;
        await loadStorage();
        const { Storage: GCStorage } = await import('@google-cloud/storage');
        expect(GCStorage).toHaveBeenCalled();
    });

    it('should initialize AWS provider when specified', async () => {
        const { loadStorage } = await import('@/services/storage');
        process.env.STORAGE_TYPE = 'aws';
        process.env.AWS_BUCKET_NAME = 'test-aws-bucket';
        process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
        process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
        process.env.AWS_REGION = 'us-east-1';
        await loadStorage();
        const { S3 } = await import('@aws-sdk/client-s3');
        expect(S3).toHaveBeenCalled();
    });

    it('should throw an error if GCS env vars are missing', async () => {
        const { loadStorage } = await import('@/services/storage');
        await expect(loadStorage()).rejects.toThrow();
    });

    it('should throw an error if AWS env vars are missing', async () => {
        const { loadStorage } = await import('@/services/storage');
        process.env.STORAGE_TYPE = 'aws';
        await expect(loadStorage()).rejects.toThrow();
    });
  });

  describe('Storage Providers', () => {
    it('GCS provider should save a file', async () => {
      const storage = await import('@/services/storage');
      process.env.GCS_BUCKET_NAME = 'test-gcs-bucket';
      process.env.GCP_PROJECT_ID = 'test-gcp-project';
      process.env.GCP_CERT = GCS_CERT;
      await storage.loadStorage();

      const url = await storage.storageProvider.saveFile('test.txt', Buffer.from('test'), 'text/plain');
      expect(url).toBe('https://storage.googleapis.com/test-gcs-bucket/test.txt');
    });

    it('AWS provider should save a file', async () => {
        const storage = await import('@/services/storage');
        process.env.STORAGE_TYPE = 'aws';
        process.env.AWS_BUCKET_NAME = 'test-aws-bucket';
        process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
        process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
        process.env.AWS_REGION = 'us-east-1';
        await storage.loadStorage();
  
        const { Upload } = await import('@aws-sdk/lib-storage');
        const url = await storage.storageProvider.saveFile('test.txt', Buffer.from('test'), 'text/plain');
        expect(Upload).toHaveBeenCalled();
        expect(url).toBe('https://test-aws-bucket.s3.us-east-1.amazonaws.com/test.txt');
      });
  });
});
