import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { SharedFile, UploadStatus, handleFileProcess, handleSharedFile, startBackgroundSync } from '@/utils/file-handler';
import { ProcessingStatus } from '@/components/processing-status';

export default function ShareScreen() {
  const params = useLocalSearchParams<{ sharedFile?: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [sharedFileData, setSharedFileData] = useState<SharedFile | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [previewData, setPreviewData] = useState<{
    previewText?: string;
    thumbnailUri?: string;
    previewType?: 'text' | 'image' | 'other';
  }>({});
  const [processedFileData, setProcessedFileData] = useState<{
    mimeType?: string;
    fileName?: string;
  }>({});

  // Parse the shared file data from params
  useEffect(() => {
    if (params.sharedFile && !processingStarted) {
      try {
        const fileData: SharedFile = JSON.parse(params.sharedFile);
        setSharedFileData(fileData);
        
        // Store initial file properties for preview
        setProcessedFileData({
          mimeType: fileData.mimeType,
          fileName: fileData.name
        });
        
        // Use the original URI for initial preview
        setFileUrl(fileData.uri);
        
        console.log('[ShareScreen] Parsed shared file data:', fileData);
      } catch (error) {
        console.error('[ShareScreen] Error parsing shared file data:', error);
        setStatus('error');
        setResult('Invalid shared file data');
      }
    }
  }, [params.sharedFile, processingStarted]);

  // Process the shared file when data is available
  useEffect(() => {
    if (sharedFileData && !processingStarted) {
      processSharedFile(sharedFileData);
      setProcessingStarted(true);
    }
  }, [sharedFileData, processingStarted]);

  const processSharedFile = async (fileData: SharedFile) => {
    try {
      // Set initial status to uploading
      setStatus('uploading');

      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the new local-first approach
      await handleSharedFile(
        fileData,
        (preview) => {
          // Update preview data
          setPreviewData(preview);
          
          // Update status to show the save was successful locally
          setStatus('processing');
          setResult('File saved locally and queued for processing');
          
          // Start background sync to process files in queue
          startBackgroundSync(token);
        }
      );
      
      // Try to immediately process the current file 
      // but don't block the UI if it takes too long
      setTimeout(async () => {
        try {
          // Reset result message since we're starting processing
          setResult('Processing file...');
          
          // Try to process the file immediately as well
          const uploadResult = await handleFileProcess(
            fileData,
            token,
            (newStatus) => setStatus(newStatus)
          );

          // Update result based on the processing outcome
          if (uploadResult.status === 'completed') {
            setResult('File processed successfully');
            
            // Update file URL to the processed version if available
            if (uploadResult.url) {
              setFileUrl(uploadResult.url);
              console.log('[ShareScreen] Updated file URL for preview:', uploadResult.url);
            }
          } else if (uploadResult.status === 'error') {
            // Set error message but don't change status to error since we already saved locally
            setResult(`Processing status: ${uploadResult.error || 'Processing queued for background'}`);
          }
        } catch (error) {
          console.error('[ShareScreen] Error in background processing:', error);
          // Don't set status to error since we already saved locally
          setResult('File saved locally. Background processing will retry automatically.');
        }
      }, 500);
    } catch (error) {
      console.error('[ShareScreen] Error saving shared file:', error);
      setStatus('error');
      setResult(error instanceof Error ? error.message : 'Failed to save file');
    }
  };

  const handleRetry = () => {
    if (sharedFileData) {
      setStatus('uploading');
      setResult(null);
      processSharedFile(sharedFileData);
    }
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  const handleViewMyNotes = () => {
    router.replace('/notes');
  };

  // Render file preview based on mime type and preview data
  const renderFilePreview = () => {
    // If we have a thumbnail from our preview generator, use it
    if (previewData.previewType === 'image' && previewData.thumbnailUri) {
      return (
        <Image 
          source={{ uri: previewData.thumbnailUri }} 
          style={styles.imagePreview}
          resizeMode="contain"
        />
      );
    }
    
    // If we have text preview, show it
    if (previewData.previewType === 'text' && previewData.previewText) {
      return (
        <View style={styles.textPreviewContainer}>
          <Text style={styles.textPreview}>{previewData.previewText}</Text>
        </View>
      );
    }
    
    // Otherwise fall back to the original logic
    if (fileUrl && processedFileData.mimeType?.startsWith('image/')) {
      return (
        <Image 
          source={{ uri: fileUrl }} 
          style={styles.imagePreview}
          resizeMode="contain"
        />
      );
    }

    return (
      <View style={styles.fileTypeContainer}>
        <MaterialIcons 
          name={
            processedFileData.mimeType?.includes('pdf') 
              ? 'picture-as-pdf' 
              : processedFileData.mimeType?.startsWith('text/') 
                ? 'description' 
                : 'insert-drive-file'
          } 
          size={80} 
          color="#3498db" 
        />
        <Text style={styles.fileName}>
          {processedFileData.fileName || 'File'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          {renderFilePreview()}
        </View>

        <View style={styles.statusContainer}>
          <ProcessingStatus status={status} />
          {result && <Text style={styles.resultText}>{result}</Text>}
        </View>

        <View style={styles.actionContainer}>
          {status === 'error' ? (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <MaterialIcons name="refresh" size={24} color="#fff" />
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          ) : status === 'completed' ? (
            <TouchableOpacity style={styles.viewNotesButton} onPress={handleViewMyNotes}>
              <MaterialIcons name="note" size={24} color="#fff" />
              <Text style={styles.buttonText}>View My Notes</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity 
            style={[
              styles.homeButton, 
              status !== 'completed' && status !== 'error' ? styles.fullWidthButton : null
            ]} 
            onPress={handleBackToHome}
          >
            <MaterialIcons name="home" size={24} color="#fff" />
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  textPreviewContainer: {
    padding: 20,
    width: '100%',
    height: '100%',
  },
  textPreview: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'monospace',
  },
  fileTypeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    width: '100%',
  },
  resultText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  viewNotesButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  homeButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fullWidthButton: {
    marginRight: 0,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});