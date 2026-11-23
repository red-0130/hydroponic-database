import { unlink } from 'fs/promises';
import path from 'path';

/**
 * Deletes a locally uploaded image file from disk if the imageUrl points to /uploads/.
 * Safely ignores external URLs or missing paths, and prevents directory traversal attacks.
 * Handles query strings, hash fragments, URL-encoding, and whitespace.
 */
export async function deleteUploadedImage(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return;
  }

  let cleanUrl = imageUrl.trim().split('?')[0].split('#')[0];
  try {
    cleanUrl = decodeURIComponent(cleanUrl);
  } catch {
    // Keep raw cleanUrl if percent encoding is malformed
  }

  if (!cleanUrl.startsWith('/uploads/')) {
    return;
  }

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(process.cwd(), 'public', cleanUrl.replace(/^\/+/, ''));

  // Ensure target file is strictly inside public/uploads
  if (filePath.startsWith(uploadsDir + path.sep)) {
    await unlink(filePath).catch(() => {});
  }
}

/**
 * Helper to delete multiple uploaded image files concurrently, deduplicating paths.
 */
export async function deleteUploadedImages(
  imageUrls: (string | null | undefined)[]
): Promise<void> {
  const uniqueUrls = Array.from(
    new Set(
      imageUrls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter(Boolean)
    )
  );
  await Promise.all(uniqueUrls.map((url) => deleteUploadedImage(url)));
}

