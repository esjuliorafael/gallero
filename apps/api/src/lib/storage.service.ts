import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

class StorageService {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Sube un comprobante de pago con un nombre determinista basado en el Ticket ID.
   * Si el usuario resube el archivo, se sobrescribe en R2.
   */
  async uploadPaymentProof(ticketId: string, buffer: Buffer, mimetype: string): Promise<string> {
    const extension = mimetype.split('/')[1];
    const fileName = `comprobantes/${ticketId}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: mimetype,
      })
    );

    // Retorna la URL pública
    return `${env.R2_PUBLIC_DOMAIN}/${fileName}`;
  }
}

export const storageService = new StorageService();
