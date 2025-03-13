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
 * Process the file on the server to extract text content and metadata
 */
export const processFile = async (fileId: string, token: string): Promise<void> => {
  try {
    console.log("Processing file with ID:", fileId);
    
    const response = await fetch(`${API_URL}/api/process-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error processing file: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to process file: ${response.statusText}`);
    }

    // Success!
    console.log("File processing request sent successfully");
  } catch (error) {
    console.error('Error in processFile:', error);
    throw error;
  }
};

/**
 * Polls the server for results of file processing
 */
export const pollForResults = async (fileId: string, token: string, maxAttempts = 30): Promise<UploadResult> => {
  let attempts = 0;
  
  // Log the fileId being used for polling
  console.log("Polling for results with fileId:", fileId);

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/api/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error polling for results: ${response.status} ${response.statusText}`, errorText);
        
        // If the file isn't found, we might need to wait a bit longer
        if (response.status === 404) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
          continue;
        }
        
        throw new Error(`Failed to poll for results: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Poll result:", result);

      // If status is completed or error, return the result
      if (result.status === 'completed' || result.status === 'error') {
        return result;
      }

      // Otherwise wait and try again
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    } catch (error) {
      console.error('Error in pollForResults:', error);
      attempts++;
      
      // If we've reached max attempts, throw an error
      if (attempts >= maxAttempts) {
        throw new Error('Max polling attempts reached');
      }
      
      // Otherwise wait and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // If we get here, we've hit max attempts
  return {
    status: 'error',
    error: 'Timed out waiting for processing results'
  };
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
      // Process file - ensure fileId is string
      const fileIdStr = String(uploadData.fileId);
      await processFile(fileIdStr, token);
      
      // Poll for results
      const result = await pollForResults(fileIdStr, token);
      
      // Clean up duplicate image references if text content exists
      if (result.status === 'completed' && result.text) {
        // Get filename safely, ensuring we have a valid string
        const filename = file.name ? (file.name.split('/').pop() || file.name) : '';
        
        if (filename) {
          // Create pattern to match standard markdown image syntax for this file
          const stdMarkdownPattern = new RegExp(`!\\[.*?\\]\\(.*?${escapeRegExp(filename)}.*?\\)`, 'g');
          
          // Create pattern to match Obsidian wiki-style links for this file
          const obsidianWikiPattern = new RegExp(`!\\[\\[.*?${escapeRegExp(filename)}.*?\\]\\]`, 'g');
          
          // Check if Obsidian wiki-style links exist and result.text is a string
          if (typeof result.text === 'string' && obsidianWikiPattern.test(result.text)) {
            // Remove standard markdown image references for the same file
            result.text = result.text.replace(stdMarkdownPattern, '');
            
            // Clean up any double newlines that might have been created
            result.text = result.text.replace(/\n\n\n+/g, '\n\n').trim();
          }
        }
      }
      
      // Add URL from the upload response if available
      if (uploadData.url) {
        result.url = uploadData.url;
      }
      
      // Update final status
      onStatusChange?.(result.status);
      
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

/**
 * Helper function to escape special characters in regex patterns
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}