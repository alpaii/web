/**
 * Cloudinary Upload Utility
 *
 * This module provides functions to upload images to Cloudinary.
 *
 * Setup Instructions:
 * 1. Create a free account at https://cloudinary.com
 * 2. Go to Settings > Upload > Add upload preset
 * 3. Set "Signing Mode" to "Unsigned"
 * 4. Copy your Cloud Name and Upload Preset to .env.local
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload an image file to Cloudinary
 *
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., "classical-albums/composers")
 * @returns Promise resolving to the upload response with secure_url
 * @throws Error if upload fails or configuration is missing
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResponse> {
  // Validate configuration
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local'
    );
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  // Upload to Cloudinary
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload multiple images to Cloudinary
 *
 * @param files - Array of image files to upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise resolving to array of secure URLs
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  const results = await Promise.all(uploadPromises);
  return results.map(result => result.secure_url);
}

/**
 * Get optimized image URL from Cloudinary
 *
 * @param publicId - The public ID of the image in Cloudinary
 * @param transformations - Optional transformations (e.g., width, height, quality)
 * @returns Optimized image URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  }
): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  if (!transformations) {
    return `${baseUrl}/${publicId}`;
  }

  const transforms: string[] = [];

  if (transformations.width) {
    transforms.push(`w_${transformations.width}`);
  }

  if (transformations.height) {
    transforms.push(`h_${transformations.height}`);
  }

  if (transformations.quality) {
    transforms.push(`q_${transformations.quality}`);
  }

  if (transformations.crop) {
    transforms.push(`c_${transformations.crop}`);
  }

  const transformString = transforms.join(',');
  return `${baseUrl}/${transformString}/${publicId}`;
}
