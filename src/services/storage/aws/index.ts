import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { StorageProvider } from '../types';

export class AWSS3StorageProvider implements StorageProvider {
  private s3Client: S3;
  private bucketName: string;
  private region: string;

  constructor(bucketName: string, accessKeyId: string, secretAccessKey: string, region: string) {
    this.s3Client = new S3({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName.trim();
    this.region = region;
  }

  async saveFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    await upload.done();
    return this.getPublicUrl(fileName);
  }

  getPublicUrl(fileName: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
  }
}
