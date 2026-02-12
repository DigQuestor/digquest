interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxOutputBytes?: number;
}

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = objectUrl;
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
};

export const optimizeImageForUpload = async (
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    maxOutputBytes = 2.5 * 1024 * 1024,
  } = options;

  const image = await loadImageFromFile(file);

  const widthRatio = maxWidth / image.width;
  const heightRatio = maxHeight / image.height;
  const scaleRatio = Math.min(1, widthRatio, heightRatio);

  const targetWidth = Math.round(image.width * scaleRatio);
  const targetHeight = Math.round(image.height * scaleRatio);

  if (scaleRatio === 1 && file.size <= maxOutputBytes) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
  let outputBlob = await canvasToBlob(canvas, targetType, quality);

  if (!outputBlob) {
    return file;
  }

  if (targetType === "image/jpeg" && outputBlob.size > maxOutputBytes) {
    let adjustedQuality = quality;
    while (outputBlob.size > maxOutputBytes && adjustedQuality > 0.55) {
      adjustedQuality -= 0.08;
      const adjustedBlob = await canvasToBlob(canvas, targetType, adjustedQuality);
      if (!adjustedBlob) {
        break;
      }
      outputBlob = adjustedBlob;
    }
  }

  if (outputBlob.size >= file.size) {
    return file;
  }

  const extension = targetType === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([outputBlob], `${baseName}-optimized.${extension}`, {
    type: targetType,
    lastModified: Date.now(),
  });
};
