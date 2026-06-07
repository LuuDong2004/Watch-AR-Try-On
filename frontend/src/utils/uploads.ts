export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const IMAGE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES): string | null {
  const type = file.type.toLowerCase();

  if (!type || !ALLOWED_IMAGE_TYPES.has(type) || !ALLOWED_IMAGE_EXTENSIONS.test(file.name)) {
    return 'Chỉ nhận ảnh JPG, PNG hoặc WebP.';
  }
  if (file.size <= 0) {
    return 'File ảnh đang rỗng.';
  }
  if (file.size > maxBytes) {
    return `Ảnh không được vượt quá ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  }

  return null;
}

export function assertImageFile(file: File, maxBytes = MAX_IMAGE_BYTES) {
  const error = validateImageFile(file, maxBytes);
  if (error) {
    throw new Error(error);
  }
}
