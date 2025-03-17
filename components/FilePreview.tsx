import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FilePreviewProps {
  fileUrl?: string;
  mimeType?: string;
  fileName?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  fileUrl, 
  mimeType = '', 
  fileName = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!fileUrl) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="insert-drive-file" size={48} color="#8E8E93" />
        <Text style={styles.noFileText}>No file available for preview</Text>
      </View>
    );
  }

  const isPdf = mimeType?.toLowerCase().includes('pdf');
  const isImage = mimeType?.toLowerCase().includes('image');

  // For preview dimensions
  const previewWidth = width - 40; // Accounting for padding
  const previewHeight = previewWidth * 1.4; // Reasonable aspect ratio

  const handleLoadComplete = () => {
    setLoading(false);
  };

  const handleError = (errorObj: object) => {
    console.error('Error loading file:', errorObj);
    setLoading(false);
    setError('Failed to load file preview');
  };

  const renderPreview = () => {
    if (isPdf) {
      // PDF Preview
      const source = { uri: fileUrl, cache: true };
      
      return (
        <View style={styles.fileContainer}>
          <Pdf
            source={source}
            onLoadComplete={handleLoadComplete}
            onError={handleError}
            style={[styles.pdfView, { width: previewWidth, height: previewHeight }]}
            trustAllCerts={false}
            renderActivityIndicator={() => <ActivityIndicator size="large" color="#007AFF" />}
            enablePaging={true}
            page={1}
          />
          {loading && (
            <View style={[styles.loadingOverlay, { width: previewWidth, height: previewHeight }]}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
        </View>
      );
    } else if (isImage) {
      // Image Preview
      return (
        <View style={styles.fileContainer}>
          <Image
            source={{ uri: fileUrl }}
            style={[styles.imagePreview, { width: previewWidth, height: previewHeight }]}
            onLoad={handleLoadComplete}
            onError={({ nativeEvent: { error } }) => {
              console.error('Image error:', error);
              setLoading(false);
              setError('Failed to load image preview');
            }}
            resizeMode="contain"
          />
          {loading && (
            <View style={[styles.loadingOverlay, { width: previewWidth, height: previewHeight }]}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}
        </View>
      );
    } else {
      // Generic file preview
      return (
        <View style={styles.genericContainer}>
          <MaterialIcons name="insert-drive-file" size={64} color="#007AFF" />
          <Text style={styles.fileNameText} numberOfLines={2}>
            {fileName || 'File preview not available'}
          </Text>
          <Text style={styles.mimeTypeText}>{mimeType || 'Unknown format'}</Text>
        </View>
      );
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.previewHeader}>
            <MaterialIcons 
              name={isPdf ? "picture-as-pdf" : isImage ? "image" : "insert-drive-file"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.previewHeaderText}>
              {isPdf ? 'PDF Preview' : isImage ? 'Image Preview' : 'File Preview'}
            </Text>
          </View>
          {renderPreview()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  previewHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  fileContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pdfView: {
    backgroundColor: '#f8f9fa',
  },
  imagePreview: {
    backgroundColor: '#f8f9fa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  genericContainer: {
    width: width - 40,
    height: (width - 40) * 1.4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  mimeTypeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: '#FF3B30',
  },
  noFileText: {
    fontSize: 16,
    marginTop: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
