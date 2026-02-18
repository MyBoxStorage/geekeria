import { Storage } from '@google-cloud/storage';
import path from 'path';

const PROJECT_ID = 'gen-lang-client-0000876410';
const BUCKET_NAME = 'bravos-estampas-geradas';

let storage: Storage | null = null;

if (process.env.GCS_KEY_BASE64) {
  // Preferred: credentials via environment variable (works everywhere)
  storage = new Storage({
    credentials: JSON.parse(
      Buffer.from(process.env.GCS_KEY_BASE64, 'base64').toString('utf-8')
    ),
    projectId: PROJECT_ID,
  });
} else if (process.env.NODE_ENV !== 'production') {
  // DEV-only: fallback to local key file
  storage = new Storage({
    keyFilename: path.join(process.cwd(), 'gcs-key.json'),
    projectId: PROJECT_ID,
  });
}
// In production without GCS_KEY_BASE64: storage stays null (feature unavailable, not a boot failure)

function getBucket() {
  if (!storage) {
    throw new Error('GCS_UNAVAILABLE: GCS_KEY_BASE64 not configured. Stamp upload is disabled.');
  }
  return storage.bucket(BUCKET_NAME);
}

export async function uploadImageToGCS(
  imageBase64: string,
  fileName: string
): Promise<string> {
  const bucket = getBucket();

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
  const bucket = getBucket();
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
