// Client-side photo shrink: ≤1080px JPEG so Storage size rules never bite
// and feeds load fast. Some phones hand over formats the browser cannot
// decode (HEIC on Android) or captures with an empty MIME — callers fall
// back to the original file when compression fails.
export const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1080;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('compress_failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad_image'));
    };
    img.src = url;
  });

export const compressOrOriginal = async (
  file: File,
  maxOriginalBytes: number,
): Promise<{ blob: Blob; contentType: string; ext: string }> => {
  try {
    return { blob: await compressImage(file), contentType: 'image/jpeg', ext: 'jpg' };
  } catch {
    if (file.size > maxOriginalBytes) throw new Error('photo_unsupported');
    const contentType = file.type.split(';')[0] || 'image/jpeg';
    return { blob: file, contentType, ext: contentType.split('/')[1] ?? 'jpg' };
  }
};
