/**
 * Step 3: download every Strapi upload and push it to R2 under key
 * "strapi/<hash><ext>". Emits _media-map.json: { [strapi url]: r2Key }.
 *
 * Usage: STRAPI_URL=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=...
 *        R2_ENDPOINT=... R2_BUCKET=... bun scripts/migrate/03-media-to-r2.ts
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env, readJson, writeJson } from "./shared";

interface UploadFile {
  id: number;
  hash: string;
  ext: string;
  url: string;
  mime: string;
  name: string;
}

const s3 = new S3Client({
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  },
  endpoint: env("R2_ENDPOINT"),
  region: "auto",
});
const bucket = env("R2_BUCKET");
const strapiUrl = env("STRAPI_URL");

const files = await readJson<UploadFile[]>("_media-manifest.json");
const mediaMap: Record<string, string> = {};

for (const file of files) {
  const key = `strapi/${file.hash}${file.ext}`;
  const sourceUrl = file.url.startsWith("http")
    ? file.url
    : `${strapiUrl}${file.url}`;

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${res.status}`);
  }
  const body = new Uint8Array(await res.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Body: body,
      Bucket: bucket,
      ContentType: file.mime,
      Key: key,
    })
  );

  mediaMap[file.url] = key;
  console.log(`${file.url} → ${key} (${body.byteLength} bytes)`);
}

await writeJson("_media-map.json", mediaMap);
console.log(`Uploaded ${files.length} files to R2.`);
