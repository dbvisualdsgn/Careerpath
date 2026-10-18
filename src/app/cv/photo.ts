// Turns an uploaded image into a small, square, grayscale JPEG so it fits the monochrome UI
// and stays light enough to publish (480px, about 40 KB).
const SIZE = 480;

export async function processPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    // Centre crop to a square.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'grayscale(1) contrast(1.06)';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}
