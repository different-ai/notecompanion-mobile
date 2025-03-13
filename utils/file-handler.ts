import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_URL, API_CONFIG } from '@/constants/config';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface SharedFile {
  uri: string;
  mimeType?: string;
  name?: string;
  text?: string;
}

export interface UploadResult {
  status: UploadStatus;
  text?: string | { extractedText?: string; visualElements?: any };
  error?: string;
  fileId?: number | string;
  url?: string;
}

export interface UploadResponse {
  success: boolean;
  fileId?: number | string;
  status: string;
  url?: string;
}

/**
 * Prepares a file for upload by normalizing paths and generating appropriate filename and mimetype
 */
export const prepareFile = async (file: SharedFile): Promise<{
  fileName: string;
  mimeType: string;
  fileUri: string;
}> => {
  // Determine filename
  const uriParts = file.uri.split('.');
  const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
  const fileName = file.name || `shared-${Date.now()}.${file.mimeType?.split('/')[1] || fileExtension || 'file'}`;
  
  // Determine mimetype
  let mimeType = file.mimeType;
  if (!mimeType) {
    switch (fileExtension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'heic':
        mimeType = 'image/heic';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
  }

  // Ensure PDF files are correctly identified regardless of case
  if (mimeType.toLowerCase().includes('pdf')) {
    mimeType = 'application/pdf';
  }
  
  // Fix common image mime type issues
  if (file.uri?.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i) && !mimeType.startsWith('image/')) {
    // URI suggests it's an image but mime type doesn't match
    const extension = file.uri.split('.').pop()?.toLowerCase();
    if (extension) {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'heic':
          mimeType = 'image/heic';
          break;
      }
    }
  }

  // Handle platform-specific file URI format
  const fileUri = file.text
    ? `${FileSystem.cacheDirectory}${fileName}`
    : Platform.select({
        ios: file.uri.replace('file://', ''),
        android: file.uri,
        default: file.uri,
      });

  // Write text content to file if needed
  if (file.text) {
    await FileSystem.writeAsStringAsync(fileUri, file.text);
  }

  // Verify file exists on iOS
  if (Platform.OS === 'ios' && !file.text) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
  }

  return {
    fileName,
    mimeType,
    fileUri
  };
};

/**
 * Uploads a file to the server using the server's Vercel Blob integration
 */
export const uploadFile = async (
  file: SharedFile, 
  token: string
): Promise<UploadResponse> => {
  try {
    // Add detailed logging about the file being processed
    console.log('== FILE UPLOAD DEBUG ==');
    console.log('Input file properties:', {
      uri: file.uri,
      mimeType: file.mimeType,
      name: file.name,
      hasTextContent: !!file.text,
      uriStartsWith: file.uri?.substring(0, 20) + '...',
    });
    
    const { fileName, mimeType, fileUri } = await prepareFile(file);
    
    // Log the prepared file properties
    console.log('Prepared file properties:', {
      fileName,
      mimeType,
      fileUri: fileUri?.substring(0, 20) + '...',
      platform: Platform.OS,
    });
    
    // Skip trying to process text content through OCR
    if (mimeType === 'text/markdown' || mimeType === 'text/plain') {
      console.log('Text content detected, sending directly without OCR processing');
      // For text content, we'll handle it differently
      if (file.text) {
        // Return a simulated successful response for text content
        return {
          success: true,
          fileId: `text-${Date.now()}`,
          status: 'processed',
          text: file.text
        } as any;
      }
    }
    
    // For React Native environment, we'll use a different approach than browser File objects
    const fileContent = await FileSystem.readAsStringAsync(
      fileUri,
      { encoding: FileSystem.EncodingType.Base64 }
    );
    
    console.log('File content base64 stats:', {
      contentLength: fileContent?.length,
      contentPrefix: fileContent?.substring(0, 30) + '...',
      isValidBase64: /^[A-Za-z0-9+/=]+$/.test(fileContent?.substring(0, 100) || ''),
    });
    
    // Send to our API endpoint which will handle the Vercel Blob upload
    const uploadResponse = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: fileName,
        type: mimeType,
        base64: fileContent,
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse
        .json()
        .catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Upload failed');
    }

    const responseData = await uploadResponse.json();
    console.log('Upload response:', responseData);
    return {
      success: responseData.success,
      fileId: responseData.fileId,
      status: responseData.status,
      url: responseData.url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Processes a file with retry logic
 */
export const processFile = async (fileId: number | string, token: string): Promise<void> => {
  let retryCount = 0;
  let processResponse;

  console.log('Starting file processing for fileId:', fileId);
  
  while (retryCount < API_CONFIG.maxRetries) {
    try {
      processResponse = await fetch(`${API_URL}/api/process-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (processResponse.ok) {
        return;
      }

      // Check if we should retry based on status code
      if (processResponse.status >= 500 || processResponse.status === 429) {
        // Server error or rate limit - retry
        retryCount++;
        if (retryCount < API_CONFIG.maxRetries) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Retrying process request (${retryCount}/${API_CONFIG.maxRetries}) after ${delay}ms. Status: ${processResponse.status}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Not retryable status code or max retries reached
      const errorData = await processResponse
        .json()
        .catch(() => ({ error: 'Processing failed' }));
      throw new Error(errorData.error || 'Processing failed');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out');
      }
      
      retryCount++;
      if (retryCount < API_CONFIG.maxRetries) {
        const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1);
        console.log(`Retrying after error (${retryCount}/${API_CONFIG.maxRetries}) after ${delay}ms:`, 
          error instanceof Error ? error.message : 'Unknown error');
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Processing failed after maximum retry attempts');
};

/**
 * Polls for file processing results
 */
export const pollForResults = async (
  fileId: number | string,
  token: string
): Promise<UploadResult> => {
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  console.log('Starting to poll for results for fileId:', fileId);
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${API_URL}/api/file-status?fileId=${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to check file status' }));
        return { 
          status: 'error', 
          error: errorData.error || 'Failed to check file status' 
        };
      }
      
      const data = await response.json();

      if (data.error) return { status: 'error', error: data.error, fileId };
      if (data.status === 'completed') return { 
        status: 'completed', 
        text: data.text, 
        fileId,
        url: data.url
      };
      if (data.status === 'error') return { status: 'error', error: data.error, fileId };

      console.log(`Poll attempt ${attempts}/${maxAttempts}:`, {
        status: data.status,
        hasText: !!data.text,
        textPreview: data.text ? 
          (typeof data.text === 'string' ? 
            data.text.substring(0, 50) : 
            JSON.stringify(data.text).substring(0, 50)) + '...' : 
          null,
        hasError: !!data.error,
        hasUrl: !!data.url
      });
      
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to check file status',
        fileId
      };
    }
  }

  return { status: 'error', error: 'Processing timeout', fileId };
};

/**
 * Handles the entire file processing workflow: upload, process, and poll for results
 */
export const handleFileProcess = async (
  file: SharedFile,
  token: string,
  onStatusChange?: (status: UploadStatus) => void,
): Promise<UploadResult> => {
  try {
    // Update status to uploading
    onStatusChange?.('uploading');
    
    // Upload file
    const uploadData = await uploadFile(file, token);
    
    // Update status to processing
    onStatusChange?.('processing');
    
    // Only process if we have a valid fileId
    if (uploadData.fileId) {
      // Process file
      await processFile(uploadData.fileId, token);
      
      // Poll for results
      const result = await pollForResults(uploadData.fileId, token);
      
      // Update final status
      onStatusChange?.(result.status);
      
      // Add URL from the upload response if available
      if (uploadData.url) {
        result.url = uploadData.url;
      }
      
      return result;
    } else {
      // Handle case where fileId is undefined
      const errorResult: UploadResult = {
        status: 'error',
        error: 'No file ID returned from upload'
      };
      onStatusChange?.('error');
      return errorResult;
    }
  } catch (error) {
    console.error('File processing error:', error);
    const errorResult: UploadResult = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to process file'
    };
    onStatusChange?.('error');
    return errorResult;
  }
};