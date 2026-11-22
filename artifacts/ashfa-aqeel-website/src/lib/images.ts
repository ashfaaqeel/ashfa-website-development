const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export const IMAGE_ACCEPT = ACCEPTED.join(',');

async function downscale(file: File): Promise<Blob> {
  // Animated GIFs would lose their frames; small images do not need work.
  if (file.type === 'image/gif') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const largest = Math.max(bitmap.width, bitmap.height);
  if (largest <= MAX_DIMENSION && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, MAX_DIMENSION / largest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
  // Keep whichever is smaller; toBlob may fall back to PNG on browsers without WebP encoding.
  return blob && ACCEPTED.includes(blob.type) && blob.size < file.size ? blob : file;
}

/** Uploads an image to persistent storage and resolves with its permanent URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF image.');
  const body = await downscale(file);
  if (body.size > MAX_BYTES) throw new Error('That image is over 4 MB even after resizing. Try a smaller one.');
  const response = await fetch('/api/admin/images', {
    method: 'POST',
    headers: { 'Content-Type': body.type },
    body,
    credentials: 'same-origin',
  });
  let data: { url?: string; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON error body */
  }
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? (response.status === 401 ? 'Your session has ended. Sign in again.' : 'The image could not be uploaded.'));
  }
  return data.url;
}
