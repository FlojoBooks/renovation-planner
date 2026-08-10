/**
 * Client-side Beeldcompressie Engine.
 * Converteert en comprimeert geüploade foto's (van bijv. 5MB-15MB) naar extreem compacte,
 * geoptimaliseerde web-formaten (<100KB) met behoud van haarscherpe leesbaarheid voor bonnen en facturen.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.78)
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface CompressedImageResult {
  dataUrl: string;
  thumbnailUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  savedPercentage: number;
  width: number;
  height: number;
  fileName: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Comprimeert een geüpload beeldbestand via HTML5 Canvas.
 */
export async function compressReceiptImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const maxWidth = options.maxWidth || 1280;
  const maxHeight = options.maxHeight || 1280;
  const quality = options.quality !== undefined ? options.quality : 0.78;
  const mimeType = options.mimeType || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Bereken nieuwe schaal met behoud van verhouding
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Hoofd canvas voor gecomprimeerde afbeelding
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context niet beschikbaar'));
          return;
        }

        // Verbeterde schaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Thumbnail canvas (max 160px)
        const thumbCanvas = document.createElement('canvas');
        const thumbRatio = Math.min(160 / width, 160 / height);
        const thumbWidth = Math.round(width * thumbRatio);
        const thumbHeight = Math.round(height * thumbRatio);
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'medium';
          thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);

        // Bereken grootte in bytes van base64 string
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const compressedSizeBytes = Math.round((base64Length * 3) / 4);
        const originalSizeBytes = file.size;

        const savedBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
        const savedPercentage = originalSizeBytes > 0
          ? Math.round((savedBytes / originalSizeBytes) * 100)
          : 0;

        resolve({
          dataUrl,
          thumbnailUrl,
          originalSizeBytes,
          compressedSizeBytes,
          originalSizeFormatted: formatBytes(originalSizeBytes),
          compressedSizeFormatted: formatBytes(compressedSizeBytes),
          savedPercentage,
          width,
          height,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Het beeldbestand kon niet worden ingeladen.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Fout bij het uitlezen van het bestand.'));
    };

    reader.readAsDataURL(file);
  });
}
