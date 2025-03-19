import { Storage, Bucket } from '@google-cloud/storage';

let bucket: Bucket;

const loadStorage = async function(): Promise<void> {
  if (!bucket) {
    const storage = new Storage({
      credentials: JSON.parse(Buffer.from(process.env.GCP_CERT as string, 'base64').toString('utf-8')),
      projectId: process.env.GCP_PROJECT_ID,
    });

    bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);
  }
};

export { 
  loadStorage, 
  bucket,
};