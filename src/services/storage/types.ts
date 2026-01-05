export interface StorageProvider {
  saveFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>;
  getPublicUrl(fileName: string): string;
}
