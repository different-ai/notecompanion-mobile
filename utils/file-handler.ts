import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_URL, API_CONFIG } from '@/constants/config';

// Basic content moderation function to screen uploads
const moderateContent = async (text: string | undefined): Promise<{ 
  isAppropriate: boolean;
  reason?: string;
}> => {
  if (!text) return { isAppropriate: true };
  
  // Basic profanity/content check - would use a proper service in production
  const checkTerms = [
    'explicit', 'inappropriate', 'offensive', 'banned'
  ];
  
  // Check for any problematic terms
  for (const term of checkTerms) {
    if (text.toLowerCase().includes(term)) {
      return { 
        isAppropriate: false, 
        reason: `Content contains potentially inappropriate material (${term})` 
      };
    }
  }
  
  return { isAppropriate: true };
};

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface SharedFile {
  uri?: string;
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
  text?: string;
}

/**
 * Prepares a file for upload by normalizing paths and generating appropriate filename
 * and mimetype.
 */
export const prepareFile = async (
  file: SharedFile
): Promise<{
  fileName: string;
  mimeType: string;
  fileUri: string | null;
}> => {
  // Determine filename
  let fileName: string;
  let fileExtension: string | undefined;
  
  if (file.uri) {
    const uriParts = file.uri.split('.');
    fileExtension = uriParts[uriParts.length - 1].toLowerCase();
  }
  
  fileName = file.name || `shared-${Date.now()}.${file.mimeType?.split('/')[1] || fileExtension || 'file'}`;
  
  // Determine mimetype
  let mimeType: string;
  
  // If file has explicit MIME type, use it
  if (file.mimeType) {
    mimeType = file.mimeType;
  } 
  // Otherwise, try to determine from extension
  else if (fileExtension) {
    switch (fileExtension) {
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
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'md':
        mimeType = 'text/markdown';
        break;
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'doc':
      case 'docx':
        mimeType = 'application/msword';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
  } 
  // Default to octet-stream if we can't determine
  else {
    mimeType = 'application/octet-stream';
  }
  
  // Process paths based on platform
  // For text content, we just want a cache file path that will work
  let fileUri: string | null = null;
  
  if (file.text) {
    // For text content, create a temporary file in the cache directory
    fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Write the text to the file
    await FileSystem.writeAsStringAsync(fileUri, file.text);
  } 
  // For file content, normalize URI based on platform
  else if (file.uri) {
    fileUri = Platform.select({
      ios: file.uri.replace('file://', ''),
      android: file.uri,
      default: file.uri,
    });
  }
  
  return {
    fileName,
    mimeType,
    fileUri,
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
    console.log('Input file properties:', {
      hasTextContent: !!file.text,
      mimeType: file.mimeType,
      name: file.name,
      uri: file.uri ? (file.uri.substring(0, 20) + '...') : undefined,
    });
    
    const { fileName, mimeType, fileUri } = await prepareFile(file);
    
    // Log the prepared file properties
    console.log('Prepared file properties:', {
      fileName,
      mimeType,
      fileUri: fileUri ? (fileUri.substring(0, 20) + '...') : undefined,
      platform: Platform.OS,
    });
    
    // For text content, implement a more robust handling strategy
    if ((mimeType === 'text/markdown' || mimeType === 'text/plain') && file.text) {
      console.log('Text content detected, handling locally');
      
      // Run content moderation check
      const moderationResult = await moderateContent(file.text);
      
      // If content doesn't pass moderation, reject it
      if (!moderationResult.isAppropriate) {
        console.log('Content moderation failed:', moderationResult.reason);
        return {
          success: false,
          status: 'error',
          error: 'Content failed moderation check. Please review and resubmit.'
        };
      }
      
      try {
        // Try to upload to server first
        const textUploadResponse = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: fileName,
            type: mimeType,
            content: file.text,
            contentType: 'text',
            isPlainText: true
          }),
          // Add a timeout to prevent hanging if server is unavailable
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (textUploadResponse.ok) {
          const textUploadResult = await textUploadResponse.json();
          console.log('Text upload result:', textUploadResult);
          
          return {
            success: true,
            fileId: textUploadResult.fileId,
            status: 'completed',
            text: file.text,
            url: textUploadResult.url
          };
        }
        
        // If server upload failed, fall back to local handling
        console.log('Server upload failed, using local text handling');
      } catch (error) {
        // Server upload failed or timed out, fall back to local handling
        console.log('Server communication error, using local text handling:', error);
      }
      
      // Fall back to local handling with a local ID
      // This ID won't be used for server operations, just for local tracking
      const localId = `local-text-${Date.now()}`;
      
      // For text content, we can return immediately with the text content
      // since there's no need for OCR processing
      return {
        success: true,
        fileId: localId,
        status: 'completed',
        text: file.text
      };
    }
    
    // For non-text content, continue with regular file upload
    // Ensure we have a valid fileUri before proceeding
    if (!fileUri) {
      throw new Error('No valid file URI available for upload');
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
        contentType: 'base64'
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse
        .json()
        .catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await uploadResponse.json();
    console.log('Upload result:', result);

    return {
      success: true,
      fileId: result.fileId,
      status: result.status || 'uploaded',
      url: result.url
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
};

/**
 * Process the file on the server to extract text content and metadata
 */
export const processFile = async (fileId: string, token: string): Promise<void> => {
  try {
    console.log("Processing file with ID:", fileId);
    
    // If it's a local text ID, we don't need server processing
    if (fileId.startsWith('local-text-')) {
      console.log('Local text ID detected, skipping server processing');
      return;
    }
    
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
  // If it's a local text ID, we don't need to poll
  if (fileId.startsWith('local-text-')) {
    console.log('Local text ID detected, returning completed status without polling');
    // For local text, we don't need to poll, since the text is already available
    return {
      status: 'completed',
      // We don't have the text here, but the caller (handleFileProcess) 
      // should already have it from the upload function
      fileId
    };
  }
  
  let attempts = 0;
  
  // Log the fileId being used for polling
  console.log("Polling for results with fileId:", fileId);

  // Define possible endpoints to try
  const endpoints = [
    // Try POST to /api/files/[id] first (since the logs show this is what was attempted)
    { url: `${API_URL}/api/files/${fileId}`, method: 'POST' },
    // Try GET with the same endpoint
    { url: `${API_URL}/api/files/${fileId}`, method: 'GET' },
    // Try the file-status endpoint with query parameter
    { url: `${API_URL}/api/file-status?fileId=${fileId}`, method: 'GET' },
    // Try file status with POST
    { url: `${API_URL}/api/file-status`, method: 'POST', body: { fileId } }
  ];
  
  while (attempts < maxAttempts) {
    let endpointIndex = attempts % endpoints.length;
    const endpoint = endpoints[endpointIndex];
    
    try {
      console.log(`Trying endpoint (${attempts + 1}/${maxAttempts}):`, endpoint.url, endpoint.method);
      
      // Configure fetch options based on the method
      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Add body for POST requests
      if (endpoint.method === 'POST' && endpoint.body) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json'
        };
        fetchOptions.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error polling for results: ${response.status} ${response.statusText}`, errorText);
        
        // If not found or method not allowed, try the next endpoint
        if (response.status === 404 || response.status === 405) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter wait between endpoint attempts
          continue;
        }
        
        // For other errors, wait longer and try again
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const result = await response.json();
      console.log("Poll result:", result);

      // If we got a successful response, save this endpoint for future attempts
      // to avoid trying other endpoints
      if (result) {
        // Keep using this successful endpoint for future polling
        endpoints.splice(0, endpoints.length, endpoint);
      }

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
    
    // Check if this is a local text file that's already been processed
    const fileIdStr = String(uploadData.fileId || '');
    if (fileIdStr.startsWith('local-text-') && uploadData.text) {
      // For local text files, we already have the text content and don't need server processing
      console.log('Local text file already processed, skipping server steps');
      onStatusChange?.('completed');
      return {
        status: 'completed',
        text: uploadData.text,
        fileId: uploadData.fileId
      };
    }
    
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

// Directory for storing pending uploads
const PENDING_UPLOADS_DIR = `${FileSystem.documentDirectory}pending_uploads/`;
const SYNC_QUEUE_FILE = `${FileSystem.documentDirectory}sync_queue.json`;

/**
 * Ensure the pending uploads directory exists
 */
export const ensurePendingUploadsDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(PENDING_UPLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PENDING_UPLOADS_DIR, { intermediates: true });
  }
};

/**
 * Save a file to local storage for later syncing
 */
export const saveFileLocally = async (file: SharedFile): Promise<{ 
  localId: string;
  preview: {
    previewText?: string;
    thumbnailUri?: string;
    previewType: 'text' | 'image' | 'other';
  }
}> => {
  await ensurePendingUploadsDir();
  
  // Create a unique local ID
  const localId = `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // Create a directory for this file
  const fileDir = `${PENDING_UPLOADS_DIR}${localId}/`;
  await FileSystem.makeDirectoryAsync(fileDir);
  
  // Generate a preview/thumbnail
  const preview = await generatePreview(file, localId);
  
  // Save the file metadata
  const metadata = {
    name: file.name,
    mimeType: file.mimeType,
    // Don't store the full text in metadata, just a preview
    textPreview: preview.previewText,
    thumbnailUri: preview.thumbnailUri,
    previewType: preview.previewType,
    localId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  
  await FileSystem.writeAsStringAsync(
    `${fileDir}metadata.json`, 
    JSON.stringify(metadata)
  );
  
  // If it's a text file, save the text content
  if (file.text) {
    await FileSystem.writeAsStringAsync(
      `${fileDir}content.txt`,
      file.text
    );
  } 
  // Otherwise, if it has a URI, copy the file
  else if (file.uri) {
    const { fileName } = await prepareFile(file);
    const destPath = `${fileDir}${fileName}`;
    await FileSystem.copyAsync({
      from: file.uri,
      to: destPath
    });
  }
  
  // Add to sync queue
  await addToSyncQueue(localId);
  
  return { 
    localId,
    preview
  };
};

/**
 * Add a file to the sync queue
 */
export const addToSyncQueue = async (localId: string): Promise<void> => {
  try {
    // Read current queue
    let queue: string[] = [];
    try {
      const queueInfoExists = await FileSystem.getInfoAsync(SYNC_QUEUE_FILE);
      if (queueInfoExists.exists) {
        const queueData = await FileSystem.readAsStringAsync(SYNC_QUEUE_FILE);
        queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.log('Error reading sync queue, starting new queue', error);
      queue = [];
    }
    
    // Add to queue if not already present
    if (!queue.includes(localId)) {
      queue.push(localId);
      await FileSystem.writeAsStringAsync(
        SYNC_QUEUE_FILE,
        JSON.stringify(queue)
      );
    }
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

/**
 * Process the next item in the sync queue
 */
export const processSyncQueue = async (token: string): Promise<boolean> => {
  try {
    // Check if queue file exists
    const queueInfoExists = await FileSystem.getInfoAsync(SYNC_QUEUE_FILE);
    if (!queueInfoExists.exists) {
      return false; // No queue exists yet
    }
    
    // Read queue
    const queueData = await FileSystem.readAsStringAsync(SYNC_QUEUE_FILE);
    let queue: string[] = JSON.parse(queueData);
    
    if (queue.length === 0) {
      return false; // Queue is empty
    }
    
    // Get the next item
    const localId = queue[0];
    const fileDir = `${PENDING_UPLOADS_DIR}${localId}/`;
    
    // Check if the file directory exists
    const dirInfo = await FileSystem.getInfoAsync(fileDir);
    if (!dirInfo.exists) {
      // Remove from queue and skip
      queue.shift();
      await FileSystem.writeAsStringAsync(SYNC_QUEUE_FILE, JSON.stringify(queue));
      return queue.length > 0; // Return true if there are more items
    }
    
    // Read metadata
    const metadataRaw = await FileSystem.readAsStringAsync(`${fileDir}metadata.json`);
    const metadata = JSON.parse(metadataRaw);
    
    // Create a SharedFile object
    let sharedFile: SharedFile = {
      name: metadata.name,
      mimeType: metadata.mimeType,
    };
    
    // If it's text content, read from content.txt
    const contentPath = `${fileDir}content.txt`;
    const contentExists = await FileSystem.getInfoAsync(contentPath);
    if (contentExists.exists) {
      sharedFile.text = await FileSystem.readAsStringAsync(contentPath);
    } else {
      // Find the file in the directory (first file that's not metadata.json)
      const dirContents = await FileSystem.readDirectoryAsync(fileDir);
      const fileNames = dirContents.filter(name => name !== 'metadata.json' && name !== 'content.txt');
      
      if (fileNames.length > 0) {
        sharedFile.uri = `${fileDir}${fileNames[0]}`;
      } else {
        // No file found, remove from queue and skip
        queue.shift();
        await FileSystem.writeAsStringAsync(SYNC_QUEUE_FILE, JSON.stringify(queue));
        return queue.length > 0;
      }
    }
    
    // Try to process the file with the server
    try {
      console.log(`Processing queued file ${localId}`);
      const result = await handleFileProcess(sharedFile, token);
      
      // If successful, remove from queue
      if (result.status === 'completed') {
        // Save the result in the metadata
        metadata.status = 'completed';
        metadata.serverFileId = result.fileId;
        metadata.text = result.text;
        metadata.processedAt = new Date().toISOString();
        
        await FileSystem.writeAsStringAsync(
          `${fileDir}metadata.json`,
          JSON.stringify(metadata)
        );
        
        // Remove from queue
        queue.shift();
        await FileSystem.writeAsStringAsync(SYNC_QUEUE_FILE, JSON.stringify(queue));
        console.log(`Successfully processed queued file ${localId}`);
      } else if (result.status === 'error') {
        // Save the error in the metadata
        metadata.status = 'error';
        metadata.error = result.error;
        metadata.lastAttempt = new Date().toISOString();
        
        await FileSystem.writeAsStringAsync(
          `${fileDir}metadata.json`,
          JSON.stringify(metadata)
        );
        
        // Move to the end of the queue to try again later
        queue.shift();
        queue.push(localId);
        await FileSystem.writeAsStringAsync(SYNC_QUEUE_FILE, JSON.stringify(queue));
        console.log(`Error processing queued file ${localId}, will retry later:`, result.error);
      }
    } catch (error) {
      console.error(`Error processing queued file ${localId}:`, error);
      
      // Save the error in the metadata
      metadata.status = 'error';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      metadata.lastAttempt = new Date().toISOString();
      
      await FileSystem.writeAsStringAsync(
        `${fileDir}metadata.json`,
        JSON.stringify(metadata)
      );
      
      // Move to the end of the queue to try again later
      queue.shift();
      queue.push(localId);
      await FileSystem.writeAsStringAsync(SYNC_QUEUE_FILE, JSON.stringify(queue));
    }
    
    return queue.length > 0; // Return true if there are more items
  } catch (error) {
    console.error('Error processing sync queue:', error);
    return false;
  }
};

/**
 * Start processing the sync queue in the background
 */
export const startBackgroundSync = async (token: string): Promise<void> => {
  let isProcessing = false;
  
  // Process one item at a time with a delay between items
  const processNextItem = async () => {
    if (isProcessing) return;
    
    isProcessing = true;
    try {
      const hasMoreItems = await processSyncQueue(token);
      if (hasMoreItems) {
        // Schedule next item with a delay
        setTimeout(processNextItem, 5000);
      }
    } catch (error) {
      console.error('Error in background sync:', error);
    } finally {
      isProcessing = false;
    }
  };
  
  // Start processing
  processNextItem();
};

/**
 * Handles a shared file locally first, then queues for background processing
 */
export const handleSharedFile = async (
  file: SharedFile,
  onLocalSaveComplete?: (preview: {
    previewText?: string;
    thumbnailUri?: string;
    previewType: 'text' | 'image' | 'other';
  }) => void
): Promise<string> => {
  try {
    // Save locally first
    const { localId, preview } = await saveFileLocally(file);
    
    // Notify that local save is complete, with preview data
    onLocalSaveComplete?.(preview);
    
    return localId;
  } catch (error) {
    console.error('Error handling shared file:', error);
    throw error;
  }
};

/**
 * Generate a text preview/snippet from full text
 */
export const generateTextPreview = (text: string, maxLength: number = 150): string => {
  if (!text || text.length <= maxLength) return text;
  
  // Try to find a good break point (end of sentence or paragraph)
  const breakPoints = [
    text.indexOf('\n\n', maxLength / 2),
    text.indexOf('. ', maxLength / 2),
    text.indexOf('? ', maxLength / 2),
    text.indexOf('! ', maxLength / 2),
  ].filter(point => point !== -1 && point < maxLength);
  
  // Use the furthest break point that's within our limit
  const breakPoint = breakPoints.length ? Math.max(...breakPoints) + 1 : maxLength;
  
  return text.substring(0, breakPoint) + '...';
};

/**
 * Generate a thumbnail path for an image or create a text preview
 */
export const generatePreview = async (file: SharedFile, localId: string): Promise<{
  previewText?: string;
  thumbnailUri?: string;
  previewType: 'text' | 'image' | 'other';
}> => {
  // Create previews directory if needed
  const previewsDir = `${FileSystem.documentDirectory}previews/`;
  const dirInfo = await FileSystem.getInfoAsync(previewsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(previewsDir, { intermediates: true });
  }
  
  // For text content, create a text preview
  if (file.text) {
    return {
      previewText: generateTextPreview(file.text),
      previewType: 'text'
    };
  }
  
  // For images, create a thumbnail
  if (file.uri && file.mimeType?.startsWith('image/')) {
    try {
      // Copy the image to the previews directory as the thumbnail
      // In a production app, you'd want to resize this to a smaller size
      const thumbnailUri = `${previewsDir}${localId}-thumb.jpg`;
      await FileSystem.copyAsync({
        from: file.uri,
        to: thumbnailUri
      });
      
      return {
        thumbnailUri,
        previewType: 'image'
      };
    } catch (error) {
      console.error('Error creating thumbnail:', error);
    }
  }
  
  // For other file types
  return {
    previewText: file.name || 'File',
    previewType: 'other'
  };
};

/**
 * Get a list of all pending and completed local files
 */
export const getLocalFiles = async (): Promise<{
  id: string;
  name: string;
  mimeType: string;
  status: string;
  createdAt: string;
  previewText?: string;
  thumbnailUri?: string;
  previewType: 'text' | 'image' | 'other';
  error?: string;
}[]> => {
  try {
    // Ensure directory exists
    await ensurePendingUploadsDir();
    
    // Read all subdirectories
    const dirs = await FileSystem.readDirectoryAsync(PENDING_UPLOADS_DIR);
    
    const localFiles = [];
    
    // Read metadata for each file
    for (const dir of dirs) {
      try {
        const metadataPath = `${PENDING_UPLOADS_DIR}${dir}/metadata.json`;
        const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
        
        if (metadataInfo.exists) {
          const metadataRaw = await FileSystem.readAsStringAsync(metadataPath);
          const metadata = JSON.parse(metadataRaw);
          
          localFiles.push({
            id: metadata.localId || dir,
            name: metadata.name || 'Unnamed file',
            mimeType: metadata.mimeType || 'application/octet-stream',
            status: metadata.status || 'pending',
            createdAt: metadata.createdAt || new Date().toISOString(),
            previewText: metadata.textPreview,
            thumbnailUri: metadata.thumbnailUri,
            previewType: metadata.previewType || 'other',
            error: metadata.error
          });
        }
      } catch (error) {
        console.error(`Error reading metadata for ${dir}:`, error);
      }
    }
    
    // Sort by creation date, newest first
    return localFiles.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting local files:', error);
    return [];
  }
};