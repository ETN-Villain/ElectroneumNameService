import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  return cachedClient;
}

/**
 * Uploads a PNG buffer to R2 and returns its public URL.
 * Intended to be called fire-and-forget (not awaited by the
 * request handler that responds to the frontend) — callers should
 * attach a .catch() to log failures, since nothing else will.
 */
export async function uploadNftToR2(buffer, filename) {
  const BUCKET_NAME = process.env.R2_BUCKET_NAME;
  const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

  if (!BUCKET_NAME || !PUBLIC_URL_BASE) {
    throw new Error("R2 env vars not configured (R2_BUCKET_NAME / R2_PUBLIC_URL)");
  }

  const r2 = getClient();

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicUrl = `${PUBLIC_URL_BASE.replace(/\/$/, "")}/${filename}`;

  console.log(`✅ Uploaded to R2: ${publicUrl}`);

  return publicUrl;
}