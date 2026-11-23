import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { deleteUploadedImage, deleteUploadedImages } from '@/lib/uploads';
import { writeFile, mkdir, rm, stat } from 'fs/promises';
import path from 'path';

describe('Uploads Cleaner Utility (Issue 7)', () => {
  const testUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const dummyFilename1 = 'test-file-1.png';
  const dummyFilename2 = 'test-file-2.jpg';
  const dummyPath1 = path.join(testUploadsDir, dummyFilename1);
  const dummyPath2 = path.join(testUploadsDir, dummyFilename2);

  beforeEach(async () => {
    await mkdir(testUploadsDir, { recursive: true });
    await writeFile(dummyPath1, 'fake-image-bytes-1');
    await writeFile(dummyPath2, 'fake-image-bytes-2');
  });

  afterEach(async () => {
    await rm(dummyPath1, { force: true }).catch(() => {});
    await rm(dummyPath2, { force: true }).catch(() => {});
  });

  it('safely handles null, undefined, and non-string inputs', async () => {
    await expect(deleteUploadedImage(null)).resolves.toBeUndefined();
    await expect(deleteUploadedImage(undefined)).resolves.toBeUndefined();
    await expect(deleteUploadedImage('')).resolves.toBeUndefined();
    // @ts-expect-error testing invalid type
    await expect(deleteUploadedImage(12345)).resolves.toBeUndefined();
  });

  it('ignores external URLs and static public images', async () => {
    await deleteUploadedImage('https://example.com/uploads/flower.png');
    await deleteUploadedImage('/images/lettuce.jpg');

    // Both test files must remain intact
    const file1 = await stat(dummyPath1).catch(() => null);
    expect(file1).not.toBeNull();
  });

  it('prevents path traversal outside of public/uploads', async () => {
    // Attempting traversal to public directory or root
    await deleteUploadedImage('/uploads/../outside.txt');
    await deleteUploadedImage('/uploads/../../package.json');

    // package.json in project root must still exist
    const pkg = await stat(path.join(process.cwd(), 'package.json')).catch(() => null);
    expect(pkg).not.toBeNull();

    // Encoded traversal attempt (%2e%2e)
    await deleteUploadedImage('/uploads/%2e%2e/package.json');
    const pkgAfter = await stat(path.join(process.cwd(), 'package.json')).catch(() => null);
    expect(pkgAfter).not.toBeNull();
  });

  it('strips query parameters and hash fragments before deleting', async () => {
    const fileBefore = await stat(dummyPath1).catch(() => null);
    expect(fileBefore).not.toBeNull();

    await deleteUploadedImage(`/uploads/${dummyFilename1}?v=12345&cache=none#preview`);

    const fileAfter = await stat(dummyPath1).catch(() => null);
    expect(fileAfter).toBeNull();
  });

  it('handles URL-encoded filenames and leading/trailing whitespace', async () => {
    const spaceFile = 'test image space.png';
    const spacePath = path.join(testUploadsDir, spaceFile);
    await writeFile(spacePath, 'space-bytes');

    expect(await stat(spacePath).catch(() => null)).not.toBeNull();

    // Pass encoded URL with surrounding whitespace
    await deleteUploadedImage(`   /uploads/test%20image%20space.png   `);

    expect(await stat(spacePath).catch(() => null)).toBeNull();
  });

  it('safely handles malformed percent encoding without throwing', async () => {
    await expect(deleteUploadedImage('/uploads/%zz-invalid.png')).resolves.toBeUndefined();
  });

  it('does not crash when deleting a nonexistent file', async () => {
    await expect(
      deleteUploadedImage('/uploads/nonexistent-file-999.png')
    ).resolves.toBeUndefined();
  });

  it('deletes an existing file in public/uploads', async () => {
    const fileBefore = await stat(dummyPath1).catch(() => null);
    expect(fileBefore).not.toBeNull();

    await deleteUploadedImage(`/uploads/${dummyFilename1}`);

    const fileAfter = await stat(dummyPath1).catch(() => null);
    expect(fileAfter).toBeNull();
  });

  it('deleteUploadedImages deletes multiple files in parallel and ignores nulls', async () => {
    const file1Before = await stat(dummyPath1).catch(() => null);
    const file2Before = await stat(dummyPath2).catch(() => null);
    expect(file1Before).not.toBeNull();
    expect(file2Before).not.toBeNull();

    await deleteUploadedImages([
      `/uploads/${dummyFilename1}`,
      null,
      undefined,
      '/images/tomato.jpg',
      `/uploads/${dummyFilename2}`,
    ]);

    const file1After = await stat(dummyPath1).catch(() => null);
    const file2After = await stat(dummyPath2).catch(() => null);
    expect(file1After).toBeNull();
    expect(file2After).toBeNull();
  });
});
