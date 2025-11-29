/**
 * Resizes an image (URL or File) to a maximum dimension and returns the Base64 string (no prefix).
 * This prevents 'Payload Too Large' errors and network timeouts.
 */
export const resizeImage = async (source: string | File, maxDimension: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle CORS for external images
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with 0.6 quality (60%) to drastically reduce payload size
      // This is critical for preventing Vercel 413 and 504 errors.
      const dataUrl = canvas.toDataURL('image/jpeg', 0.60);
      
      // Remove prefix "data:image/jpeg;base64,"
      resolve(dataUrl.split(',')[1]);
    };

    img.onerror = (err) => {
      console.error("Image loading error", err);
      reject(new Error("Failed to load image for resizing."));
    };

    // Handle source type
    if (source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
};

/**
 * Returns the full data URL for display if we have a raw base64 string
 */
export const getDisplayUrl = (base64OrUrl: string): string => {
  if (!base64OrUrl) return '';
  if (base64OrUrl.startsWith('http') || base64OrUrl.startsWith('blob:') || base64OrUrl.startsWith('data:')) {
    return base64OrUrl;
  }
  return `data:image/jpeg;base64,${base64OrUrl}`;
};