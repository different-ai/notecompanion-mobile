import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UploadedFile } from '@/utils/api';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useSemanticColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import * as Haptics from 'expo-haptics';

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
  file: UploadedFile & {
    featured?: boolean; // Optional flag to mark a file as featured
  };
  onDelete: (id: number) => void;
  onView: (file: UploadedFile) => void;
}

export function FileCard({ file, onDelete, onView }: FileCardProps) {
  const router = useRouter();
  const [moderation, setModeration] = React.useState<{
    isAppropriate: boolean;
    contentFlags?: string[];
  }>({ isAppropriate: true });
  
  // Get colors from our semantic theme system
  const primaryColor = useSemanticColor('primary');
  const successColor = useSemanticColor('success');
  const dangerColor = useSemanticColor('danger');
  const textColor = useSemanticColor('text');
  const textSecondaryColor = useSemanticColor('textSecondary');
  const warningColor = useSemanticColor('warning');
  const backgroundColor = useSemanticColor('background');
  const cardColor = useSemanticColor('card');
  const borderColor = useSemanticColor('border');
  
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
      
      // Add haptic feedback on iOS
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleView = () => {
    if (!file.processed) {
      Alert.alert('Note Not Ready', 'Please wait until processing is complete before viewing.');
      return;
    }

    // Add haptic feedback on iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Navigate to the file viewer screen
    router.push({
      pathname: '/file-viewer',
      params: {
        fileUrl: file.blobUrl,
        mimeType: file.mimeType,
        fileName: file.name,
        content: file.extractedText,
      },
    });
  };

  const handleDelete = () => {
    // Add haptic feedback on iOS for destructive actions
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // Show a confirmation dialog
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(file.id),
        },
      ]
    );
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Gradient border overlay */}
      <View style={styles.gradientBorder} />
      
      {/* Card content */}
      <ThemedView 
        variant="card" 
        style={styles.card}
      >
        {/* Popular ribbon - can be conditionally rendered */}
        {file.featured && (
          <View style={styles.ribbon}>
            <ThemedText style={styles.ribbonText} colorName="background">Most Popular</ThemedText>
          </View>
        )}
        
        <View style={styles.fileHeader}>
          <View style={styles.titleContainer}>
            <View style={[styles.fileIcon, { backgroundColor: Platform.OS === 'ios' ? 'rgba(159, 122, 234, 0.15)' : 'rgba(159, 122, 234, 0.1)' }]}>
              <MaterialIcons
                name={getFileIcon(file.mimeType)}
                size={24}
                color="rgb(159, 122, 234)"
              />
            </View>
            <View style={styles.fileInfo}>
              <ThemedText weight="semibold" style={styles.fileName} numberOfLines={1}>
                {file.name}
              </ThemedText>
              <ThemedText colorName="textSecondary" type="caption" style={styles.fileDate}>
                {formatDate(file.createdAt)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShare}
              disabled={!file.processed}
            >
              <MaterialIcons 
                name="share" 
                size={22} 
                color={file.processed ? "#68D391" : "#AAAAAA"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete-outline" size={22} color="#FC8181" />
            </TouchableOpacity>
          </View>
        </View>
        
        {file.extractedText && !moderation.isAppropriate ? (
          <ThemedView 
            style={styles.contentFilteredContainer} 
            colorName="warning"
          >
            <MaterialIcons name="warning" size={18} color={Platform.OS === 'ios' ? '#f59e0b' : '#F6E05E'} />
            <ThemedText style={styles.contentFilteredText}>
              Content flagged for review
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.previewContainer}>
            {file.mimeType?.includes('image') && file.blobUrl ? (
              <Image
                source={{ uri: file.blobUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : file.mimeType?.includes('pdf') && file.blobUrl ? (
              <View style={styles.pdfPreviewContainer}>
                <MaterialIcons name="picture-as-pdf" size={48} color={primaryColor} />
                <ThemedText colorName="textSecondary" style={styles.pdfPreviewText}>PDF Document</ThemedText>
              </View>
            ) : file.extractedText ? (
              <ThemedText colorName="textSecondary" style={styles.previewText} numberOfLines={2}>
                {getContentPreview()}
              </ThemedText>
            ) : (
              <View style={styles.noPreviewContainer}>
                <MaterialIcons name="insert-drive-file" size={48} color={textSecondaryColor} />
                <ThemedText colorName="textSecondary" style={styles.noPreviewText}>No preview available</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* File features/benefits section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={18} color="rgb(159, 122, 234)" />
            <ThemedText colorName="textSecondary" style={styles.featureText}>
              {file.extractedText ? `${Math.ceil(file.extractedText.length / 100)} words` : 'No content'}
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={18} color="rgb(159, 122, 234)" />
            <ThemedText colorName="textSecondary" style={styles.featureText}>
              {file.mimeType?.includes('pdf') ? 'PDF Format' : file.mimeType?.includes('image') ? 'Image Format' : 'Text Format'}
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="check" size={18} color="rgb(159, 122, 234)" />
            <ThemedText colorName="textSecondary" style={styles.featureText}>
              {file.processed ? 'Ready to use' : 'Processing...'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.mainActionButton, !file.processed && styles.disabledButton]}
            onPress={handleView}
            disabled={!file.processed}
          >
            <ThemedText style={styles.mainActionButtonText} colorName="background">
              View Note
            </ThemedText>
            <MaterialIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 24,
    marginHorizontal: 2, // Allow space for the border effect to be visible
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(159, 122, 234, 0.2)', // Primary color with low opacity
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  card: {
    borderRadius: 16, 
    padding: 20,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'black',
    zIndex: 2,
    overflow: 'hidden', // For the ribbon positioning
  },
  ribbon: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: [{ translateX: -48 }],
    backgroundColor: 'rgb(159, 122, 234)', // Hard-coded primary color
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentFilteredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'black',
    opacity: 0.9,
  },
  contentFilteredText: {
    marginLeft: 8,
    fontSize: 14,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8, // Extra space at top for ribbon if needed
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  fileDate: {
    fontSize: 13,
    marginTop: 4,
  },
  previewContainer: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'black',
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(0,0,0,0.03)',
      },
      android: {
        backgroundColor: '#f8f9fa',
      },
    }),
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pdfPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPreviewText: {
    marginTop: 8,
    fontSize: 14,
  },
  noPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPreviewText: {
    marginTop: 8,
    fontSize: 14,
  },
  previewText: {
    fontSize: 15,
    padding: 12,
    fontStyle: 'italic',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    marginTop: 8,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(159, 122, 234)', // Hard-coded primary color
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  mainActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  iconButton: {
    padding: 10,
    marginLeft: 12,
  },
  disabledText: {
    opacity: 0.5,
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
  statusText: {
    fontSize: 13,
  },
});