import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = process.env.GCS_KEY_BASE64
  ? new Storage({
      credentials: JSON.parse(
        Buffer.from(process.env.GCS_KEY_BASE64, 'base64').toString('utf-8')
      ),
      projectId: 'gen-lang-client-0000876410',
    })
  : new Storage({
      keyFilename: path.join(process.cwd(), 'gcs-key.json'),
      projectId: 'gen-lang-client-0000876410',
    });

const bucketName = 'bravos-estampas-geradas';
const bucket = storage.bucket(bucketName);

export async function uploadImageToGCS(
  imageBase64: string,
  fileName: string
): Promise<string> {
  // Remover prefixo data:image/png;base64,
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/png',
    },
    public: false, // Não público
  });

  // Retornar URL assinada (válida por 7 dias)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
  });

  return signedUrl;
}

export async function deleteExpiredImages(): Promise<number> {
  const [files] = await bucket.getFiles();
  const now = Date.now();
  let deleted = 0;

  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const timeCreated = metadata?.timeCreated;
    if (!timeCreated) continue;
    const createdAt = new Date(timeCreated).getTime();
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    if (ageInDays > 7) {
      await file.delete();
      deleted++;
    }
  }

  return deleted;
}
