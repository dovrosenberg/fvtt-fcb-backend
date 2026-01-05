import { StorageProvider } from './types';
import { LocalStorageProvider } from './local';
import { AWSS3StorageProvider } from './aws';
import { GCSStorageProvider } from './gcs';

let storageProvider: StorageProvider | null = null;

const loadStorage = async (): Promise<void> => {
  if (storageProvider) return;

  const storageType = (process.env.STORAGE_TYPE || 'gcs').toLowerCase();

  switch (storageType) {
    case 'local': {
      const rootDir = process.env.STORAGE_LOCAL_DIR;
      if (!rootDir) {
        throw new Error('Local storage selected but STORAGE_LOCAL_DIR is not set');
      }

      const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;
      storageProvider = new LocalStorageProvider(rootDir, publicBaseUrl);

      console.log(`Using local storage at: ${rootDir}`);
      if (publicBaseUrl) {
        console.log(`Local storage public base URL: ${publicBaseUrl}`);
      }
      break;
    }

    case 'aws': {
      const bucket = process.env.AWS_BUCKET_NAME;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION;

      if (!bucket || !accessKeyId || !secretAccessKey || !region) {
        throw new Error('AWS S3 storage selected but missing required environment variables');
      }

      storageProvider = new AWSS3StorageProvider(
        bucket,
        accessKeyId,
        secretAccessKey,
        region,
      );

      console.log(`Connected to AWS S3 bucket: ${bucket}`);
      break;
    }

    case 'gcs':
    default: {
      const cert = process.env.GCP_CERT;
      const projectId = process.env.GCP_PROJECT_ID;
      const bucket = process.env.GCS_BUCKET_NAME;

      if (!cert || !projectId || !bucket) {
        throw new Error('GCS storage selected but missing required environment variables');
      }

      const credentialsJson = Buffer.from(cert, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsJson);

      storageProvider = new GCSStorageProvider(bucket, credentials, projectId);

      console.log(`Connected to GCS bucket: ${bucket}`);
      break;
    }
  }
};

const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    throw new Error('Storage provider not initialized. Call loadStorage() first.');
  }
  return storageProvider;
};

export {
  loadStorage,
  storageProvider,   // keep this for backwards compatibility if other code imports it
  getStorageProvider,
};
