import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UploadStatus } from '@/utils/file-handler';
import { FilePreview } from './file-preview';
import { TextDocumentViewer } from './text-document-viewer';

interface ProcessingStatusProps {
  status: UploadStatus;
  result?: string | null | { extractedText?: string, visualElements?: any };
  fileUrl?: string;
  mimeType?: string;
  fileName?: string;
  onRetry?: () => void;
  onBackToHome?: () => void;
  showDetails?: boolean;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  result,
  fileUrl,
  mimeType,
  fileName,
  onRetry,
  onBackToHome,
  showDetails = true,
}) => {
  if (status === 'idle') {
    return null;
  }

  return (
    <View style={styles.container}>
      {(status === 'uploading' || status === 'processing') && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>
            {status === 'uploading' ? 'Uploading your file...' : 'AI is processing your document...'}
          </Text>
          {showDetails && (
            <Text style={styles.statusSubtext}>
              {status === 'uploading'
                ? 'This will just take a moment'
                : 'Extracting text and organizing content'}
            </Text>
          )}
        </View>
      )}

      {status === 'completed' && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>
              File processed successfully
            </Text>
          </View>
          
          {/* Display file preview when completed */}
          {fileUrl && (
            <View style={styles.previewContainer}>
              <FilePreview 
                fileUrl={fileUrl} 
                mimeType={mimeType} 
                fileName={fileName}
                textContent={result && typeof result === 'object' && 'extractedText' in result ? result.extractedText : undefined}
              />
            </View>
          )}

          {/* Display extracted text content if available and not already shown in preview */}
          {result && typeof result === 'object' && 'extractedText' in result && result.extractedText && !mimeType?.includes('text') && !mimeType?.includes('markdown') && (
            <View style={styles.textContentContainer}>
              <Text style={styles.textContentTitle}>Extracted Text</Text>
              <TextDocumentViewer 
                content={result.extractedText}
                title="Extracted Content"
              />
            </View>
          )}
          
          {showDetails && (
            <Text style={styles.resultSubtext}>
              Your file has been uploaded to Note Companion AI.
              {'\n\n'}
              It will be automatically synced to any services you have enabled.
            </Text>
          )}
          {onBackToHome && (
            <TouchableOpacity
              style={styles.button}
              onPress={onBackToHome}
            >
              <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={24} color="#f44336" />
          <Text style={styles.errorText}>
            {typeof result === 'string'
              ? result 
              : 'An error occurred'}
          </Text>
          <View style={styles.buttonContainer}>
            {onRetry && (
              <TouchableOpacity
                style={styles.button}
                onPress={onRetry}
              >
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            )}
            {onBackToHome && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onBackToHome}
              >
                <Text style={styles.buttonText}>Back to Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  statusContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewContainer: {
    width: '100%',
    marginVertical: 15,
    maxHeight: 400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 10,
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginVertical: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  textContentContainer: {
    width: '100%',
    marginTop: 16,
  },
  textContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
});