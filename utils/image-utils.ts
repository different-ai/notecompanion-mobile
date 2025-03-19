import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type ImageResult = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
  fileName?: string;
};

/**
 * Function to handle image picking from gallery
 * Returns a properly formatted JPEG image
 */
export const pickImage = async (): Promise<ImageResult | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    exif: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    // Convert to JPEG if needed
    const processedImageUri = await ensureJpegFormat(result.assets[0].uri);
    
    // Get file info for the processed image
    const fileInfo = await FileSystem.getInfoAsync(processedImageUri);
    
    // Extract filename from URI
    const uriParts = processedImageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    return {
      uri: processedImageUri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      mimeType: 'image/jpeg', // Always JPEG after processing
      fileName: fileName,
    };
  }
  
  return null;
};

/**
 * Function to handle camera capture
 * Returns a properly formatted JPEG image
 */
export const takePhoto = async (): Promise<ImageResult | null> => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  
  if (cameraPermission.status !== 'granted') {
    console.warn('Camera permission is required');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    exif: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    // Convert to JPEG if needed
    const processedImageUri = await ensureJpegFormat(result.assets[0].uri);
    
    // Get file info for the processed image
    const fileInfo = await FileSystem.getInfoAsync(processedImageUri);
    
    // Extract filename from URI
    const uriParts = processedImageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    return {
      uri: processedImageUri,
      width: result.assets[0].width,
      height: result.assets[0].height,
      mimeType: 'image/jpeg', // Always JPEG after processing
      fileName: fileName,
    };
  }
  
  return null;
};

/**
 * Function to ensure JPEG format (converts HEIC/HEIF if needed)
 * @param uri The URI of the image to process
 * @returns The URI of the processed JPEG image
 */
export const ensureJpegFormat = async (uri: string): Promise<string> => {
  // Check file extension
  const fileExtension = uri.split('.').pop()?.toLowerCase();
  
  // If it's already a JPEG, just return the URI
  if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
    return uri;
  }
  
  // Special handling for HEIC/HEIF formats which are common on iOS
  const isHeicFormat = fileExtension === 'heic' || fileExtension === 'heif';
  
  // On iOS, need to convert HEIC files
  if (Platform.OS === 'ios' && isHeicFormat) {
    console.log('Converting HEIC/HEIF image to JPEG');
  }
  
  // Convert to JPEG using image manipulator
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to a reasonable dimension
      { format: SaveFormat.JPEG, compress: 0.8 }
    );
    
    console.log('Image successfully converted to JPEG');
    return manipResult.uri;
  } catch (error) {
    console.error('Error converting image to JPEG:', error);
    // If conversion fails, return original URI
    return uri;
  }
};

/**
 * Helper function to prepare an image for upload
 * Converts to JPEG if needed and returns a properly formatted object
 */
export const prepareImageForUpload = async (imageUri: string): Promise<{
  uri: string;
  mimeType: string;
  name: string;
}> => {
  // Ensure image is in JPEG format
  const jpegUri = await ensureJpegFormat(imageUri);
  
  // Extract filename from URI
  const uriParts = jpegUri.split('/');
  const fileName = uriParts[uriParts.length - 1];
  
  return {
    uri: jpegUri,
    mimeType: 'image/jpeg',
    name: fileName || `image-${Date.now()}.jpg`,
  };
};
