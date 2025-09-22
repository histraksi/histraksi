import { Area } from 'react-easy-crop';
import { ImageFile } from '../types';

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/png');
}

/**
 * Resizes and crops an image to fill a target aspect ratio.
 * This function performs a center-crop to ensure the output image has no padding or empty space.
 * @param imageFile The original image file.
 * @param targetAspectRatio The desired aspect ratio as a string (e.g., '16:9').
 * @returns A new image file cropped and resized to the target aspect ratio.
 */
export const formatImageAspectRatio = async (
  imageFile: ImageFile,
  targetAspectRatio: string
): Promise<ImageFile> => {
    const image = await createImage(`data:${imageFile.type};base64,${imageFile.base64}`);
    const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
    const targetRatio = targetW / targetH;

    const imageRatio = image.width / image.height;

    let sx, sy, sWidth, sHeight;

    // Determine crop area (source rectangle) from the original image
    if (imageRatio > targetRatio) {
        // Image is wider than the target aspect ratio, so we crop the sides.
        sHeight = image.height;
        sWidth = image.height * targetRatio;
        sx = (image.width - sWidth) / 2;
        sy = 0;
    } else {
        // Image is taller than or equal to the target aspect ratio, so we crop the top and bottom.
        sWidth = image.width;
        sHeight = image.width / targetRatio;
        sx = 0;
        sy = (image.height - sHeight) / 2;
    }

    // Determine output canvas dimensions, capping the longest side at 1024px for performance.
    let canvasWidth, canvasHeight;
    const maxDimension = 1024;
    if (targetRatio >= 1) { // Landscape or square
        canvasWidth = maxDimension;
        canvasHeight = maxDimension / targetRatio;
    } else { // Portrait
        canvasHeight = maxDimension;
        canvasWidth = maxDimension * targetRatio;
    }
    
    canvasWidth = Math.round(canvasWidth);
    canvasHeight = Math.round(canvasHeight);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get 2D context from canvas');
    }

    // Draw the cropped portion of the image onto the canvas, filling it completely.
    ctx.drawImage(
        image,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
    );

    const base64 = canvas.toDataURL('image/png').split(',')[1];

    return {
        name: `formatted_${imageFile.name.replace(/\.[^/.]+$/, "")}.png`,
        type: 'image/png',
        base64,
    };
};
