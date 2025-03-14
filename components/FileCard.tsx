import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UploadedFile } from '@/utils/api';
import * as FileSystem from 'expo-file-system';

// Content moderation check for displaying files
const runContentModeration = async (text: string | undefined): Promise<{
  isAppropriate: boolean;
  contentFlags?: string[];
}> => {
  try {
    // Simple text moderation - can be replaced with a more comprehensive API
    if (!text) return { isAppropriate: true };
    
    const profanityList = [
      'vulgar', 'explicit', 'offensive', 'inappropriate'
    ];
    
    const contentFlags = profanityList.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
    
    return {
      isAppropriate: contentFlags.length === 0,
      contentFlags: contentFlags.length > 0 ? contentFlags : undefined
    };
  } catch (error) {
    console.error('Error running content moderation:', error);
    // Default to appropriate if the check fails
    return { isAppropriate: true };
  }
};

interface FileCardProps {
  file: UploadedFile;
  onDelete: (id: number) => void;
  onView: (file: UploadedFile) => void;
}

export function FileCard({ file, onDelete, onView }: FileCardProps) {
  const [moderation, setModeration] = React.useState<{
    isAppropriate: boolean;
    contentFlags?: string[];
  }>({ isAppropriate: true });
  
  React.useEffect(() => {
    // Run content moderation check
    if (file.extractedText) {
      runContentModeration(file.extractedText)
        .then(result => {
          setModeration(result);
        });
    }
  }, [file.extractedText]);

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get appropriate icon based on file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('image')) {
      return 'image';
    } else if (mimeType?.includes('pdf')) {
      return 'picture-as-pdf';
    } else if (mimeType?.includes('text') || mimeType?.includes('markdown')) {
      return 'note';
    } else {
      return 'insert-drive-file';
    }
  };

  // Display a snippet of extracted text if available
  const getContentPreview = () => {
    if (file.extractedText) {
      const preview = file.extractedText.substring(0, 100);
      return preview.length < file.extractedText.length 
        ? `${preview}...` 
        : preview;
    }
    return 'No preview available';
  };

  // Handle sharing the file with other apps
  const handleShare = async () => {
    try {
      if (!file.processed) {
        Alert.alert('Note Not Ready', 'Please wait until processing is complete before sharing.');
        return;
      }
      
      // Determine if we have content to share
      const hasContent = file.extractedText && file.extractedText.trim().length > 0;
      
      if (hasContent) {
        // For markdown or text files, share the content directly
        await Share.share({
          title: file.name,
          message: file.extractedText as string,
        });
      } else if (file.blobUrl) {
        // For binary files like PDFs, attempt to share the URL
        // This works best for publicly accessible URLs
        try {
          // Download the file locally first if it's a remote URL
          const localUri = `${FileSystem.documentDirectory}${file.name}`;
          const downloadResumable = FileSystem.createDownloadResumable(
            file.blobUrl,
            localUri
          );
          
          const downloadResult = await downloadResumable.downloadAsync();
          
          if (downloadResult && downloadResult.uri) {
            await Share.share({
              title: file.name,
              url: downloadResult.uri, // iOS only
            });
          } else {
            throw new Error('Failed to download file for sharing');
          }
        } catch (error) {
          console.error('Error preparing file for sharing:', error);
          
          // Fallback to just sharing the URL if download fails
          await Share.share({
            title: file.name,
            message: `View my note: ${file.blobUrl}`,
          });
        }
      } else {
        Alert.alert('Cannot Share', 'This note has no content available for sharing.');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Share Failed', 'There was a problem sharing this note.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.fileHeader}>
        <View style={styles.fileIcon}>
          <MaterialIcons
            name={getFileIcon(file.mimeType)}
            size={24}
            color="#007AFF"
          />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={styles.fileDate}>{formatDate(file.createdAt)}</Text>
        </View>
      </View>
      
      {file.extractedText && !moderation.isAppropriate ? (
        <View style={styles.contentFilteredContainer}>
          <MaterialIcons name="warning" size={18} color="#f59e0b" />
          <Text style={styles.contentFilteredText}>
            Content flagged for review
          </Text>
        </View>
      ) : file.extractedText && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText} numberOfLines={2}>
            {getContentPreview()}
          </Text>
        </View>
      )}

      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusIndicator,
            file.processed ? styles.statusSuccess : styles.statusPending,
          ]}
        />
        <Text style={styles.statusText}>
          {file.processed ? 'Ready to view' : 'Processing...'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onView(file)}
          disabled={!file.processed}
        >
          <MaterialIcons name="visibility" size={20} color={file.processed ? "#007AFF" : "#AAAAAA"} />
          <Text style={[styles.viewButtonText, !file.processed && styles.disabledText]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={!file.processed}
        >
          <MaterialIcons 
            name="share" 
            size={20} 
            color={file.processed ? "#4CAF50" : "#AAAAAA"} 
          />
          <Text style={[styles.shareButtonText, !file.processed && styles.disabledText]}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(file.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  contentFilteredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentFilteredText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  fileDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  previewText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusSuccess: {
    backgroundColor: '#34C759',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
  },
  viewButtonText: {
    color: '#007AFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledText: {
    color: '#AAAAAA',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
  },
  shareButtonText: {
    color: '#4CAF50',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
});
