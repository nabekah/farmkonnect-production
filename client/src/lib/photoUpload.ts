/**
 * Photo upload utility for field worker activity logging
 * Handles image compression, S3 upload, and metadata management
 */

export interface UploadedPhoto {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

/**
 * Compress image file to reduce size for mobile networks
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', quality);
      };
    };
  });
}

/**
 * Upload photo to S3 via tRPC
 */
export async function uploadPhotoToS3(
  file: File,
  farmId: number,
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }
): Promise<UploadedPhoto> {
  try {
    // Compress the image
    const compressedBlob = await compressImage(file);
    const compressedFile = new File([compressedBlob], file.name, {
      type: 'image/jpeg',
    });

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('farmId', farmId.toString());
    if (gpsData) {
      formData.append('gpsData', JSON.stringify(gpsData));
    }

    // Upload via tRPC endpoint
    const response = await fetch('/api/trpc/fieldWorker.uploadPhoto', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      url: data.url,
      key: data.key,
      fileName: compressedFile.name,
      fileSize: compressedFile.size,
      uploadedAt: new Date(),
      gpsData,
    };
  } catch (error) {
    console.error('Photo upload failed:', error);
    throw error;
  }
}

/**
 * Batch upload multiple photos
 */
export async function uploadPhotosToS3(
  files: File[],
  farmId: number,
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }
): Promise<UploadedPhoto[]> {
  const uploadPromises = files.map((file) =>
    uploadPhotoToS3(file, farmId, gpsData).catch((error) => {
      console.error(`Failed to upload ${file.name}:`, error);
      return null;
    })
  );

  const results = await Promise.all(uploadPromises);
  return results.filter((result): result is UploadedPhoto => result !== null);
}

/**
 * Generate unique file key for S3 storage
 */
export function generatePhotoKey(farmId: number, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop() || 'jpg';
  return `farms/${farmId}/photos/${timestamp}-${random}.${extension}`;
}

/**
 * Validate photo file before upload
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: JPEG, PNG, WebP, HEIC`,
    };
  }

  return { valid: true };
}
