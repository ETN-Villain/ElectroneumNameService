import fs from "fs";
import path from "path";

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";

/**
 * Uploads a generated image file and returns its public URL.
 * Swappable backend based on STORAGE_TYPE env var.
 *
 * @param {string} filePath - absolute path to the local PNG file
 * @param {string} filename - just the filename (no path), used as the object key
 * @returns {Promise<string>} - public URL where the image can be fetched
 */
export async function uploadImage(filePath, filename) {
  switch (STORAGE_TYPE) {
    case "local":
      return uploadLocal(filePath, filename);
    case "s3":
      return uploadS3(filePath, filename);
    default:
      throw new Error(`Unknown STORAGE_TYPE: ${STORAGE_TYPE}`);
  }
}

// ─────────────────────────────────────────────
//  Local storage — serves the file from this same Render service
// ─────────────────────────────────────────────

function uploadLocal(filePath, filename) {
  // File is already saved by imageGenerator.js into the /generated directory,
  // which index.js serves statically at /images. Just return the public URL.
  const baseUrl = process.env.LOCAL_BASE_URL;
  if (!baseUrl) {
    throw new Error("LOCAL_BASE_URL must be set in .env when STORAGE_TYPE=local");
  }
  return `${baseUrl.replace(/\/$/, "")}/images/${filename}`;
}

// ─────────────────────────────────────────────
//  S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, etc.)
// ─────────────────────────────────────────────

let s3Client = null;

async function getS3Client() {
  if (s3Client) return s3Client;

  // Lazy import so the 'canvas'-only local setup doesn't require this
  // package to be installed if you're not using S3.
  const { S3Client } = await import("@aws-sdk/client-s3");

  s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

async function uploadS3(filePath, filename) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3Client();

  const fileBuffer = fs.readFileSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `nft-images/${filename}`,
      Body: fileBuffer,
      ContentType: "image/png",
      ACL: "public-read",
    })
  );

  const baseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("S3_PUBLIC_BASE_URL must be set in .env when STORAGE_TYPE=s3");
  }
  return `${baseUrl.replace(/\/$/, "")}/nft-images/${filename}`;
}
