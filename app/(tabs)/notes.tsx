import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchFiles, UploadedFile } from '@/utils/api';
import { useAuth } from '@clerk/clerk-expo';
import { FileList } from '@/components/FileList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSemanticColor } from '@/hooks/useThemeColor';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '@/utils/file-handler';
import { Asset } from 'expo-asset';

export default function NotesScreen() {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const primaryColor = useSemanticColor('primary');

  const loadFiles = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }
      
      const filesData = await fetchFiles(token, { page: 1, limit: 10 });
      setFiles(filesData.files || []);
      
      // Show onboarding if user has no files
      setShowOnboarding(filesData.files.length === 0);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load your notes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFiles(false);
  };
  
  const handleDemoUpload = async () => {
    try {
      setUploading(true);
      
      // Load the asset and wait for it to be available
      const asset = Asset.fromModule(require('@/assets/einstein-document.jpg'));
      await asset.downloadAsync();
      
      if (!asset.localUri) {
        throw new Error('Failed to load the Einstein document asset');
      }
      
      console.log('Asset loaded successfully:', {
        localUri: asset.localUri,
        width: asset.width,
        height: asset.height
      });
      
      // Create a destination path in the document directory
      const fileName = 'einstein-document.jpg';
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Check if we already have the file in the document directory
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      
      // If file doesn't exist, copy it
      if (!fileExists.exists) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: fileUri
        });
        
        console.log('Copied Einstein document to:', fileUri);
      }
      
      // Get authentication token
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again to upload files.');
        return;
      }
      
      // Prepare file info
      const uploadFileInfo = {
        uri: fileUri,
        name: 'Einstein Equations.jpg',
        mimeType: 'image/jpeg'
      };
      
      console.log('Uploading file with info:', uploadFileInfo);
      
      // Upload the file
      await uploadFile(uploadFileInfo, token);
      
      // Reload files to show the newly uploaded file
      Alert.alert('Success', 'Einstein document uploaded successfully!');
      loadFiles();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert(
        'Upload Failed', 
        'There was a problem uploading the document: ' + 
        (err.message || String(err))
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      setUploading(true);
      const file = result.assets[0];
      
      // Get authentication token
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again to upload files.');
        return;
      }
      
      // Prepare file info
      const uploadFileInfo = {
        uri: file.uri,
        name: file.name || 'document.pdf',
        mimeType: file.mimeType || 'application/pdf'
      };
      
      // Upload the file
      await uploadFile(uploadFileInfo, token);
      
      // Reload files to show the newly uploaded file
      Alert.alert('Success', 'Document uploaded successfully!');
      loadFiles();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'There was a problem uploading the document: ' + (err.message || String(err)));
    } finally {
      setUploading(false);
    }
  };

  const renderOnboarding = () => (
    <ScrollView style={styles.container}>
      <View style={styles.onboardingContainer}>
        <ThemedText type="heading" style={styles.onboardingTitle}>
          Welcome to Note Companion
        </ThemedText>
        
        <ThemedText style={styles.onboardingDescription}>
          You don't have any documents yet. Let's add your first document to get started with OCR text extraction!
        </ThemedText>
        
        <View style={styles.demoCard}>
          <ThemedText type="subtitle" style={styles.demoTitle}>
            Upload Einstein's Handwritten Equations
          </ThemedText>
          
          <ThemedText style={styles.demoDescription}>
            Try our OCR capabilities with this historical document from Albert Einstein's archives:
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.demoImageContainer}
            onPress={handleDemoUpload}
            disabled={uploading}
          >
            <Image 
              source={require('@/assets/einstein-document.jpg')} 
              style={styles.demoImage}
              resizeMode="contain"
            />
            
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={handleDemoUpload}
            disabled={uploading}
          >
            <MaterialIcons name="file-upload" size={20} color="#fff" />
            <Text style={styles.demoButtonText}>
              {uploading ? 'Uploading...' : 'Upload Sample Document'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUploadFile}
            disabled={uploading}
          >
            <MaterialIcons name="cloud-upload" size={20} color={primaryColor} />
            <ThemedText style={styles.uploadButtonText}>Upload Your Own Document</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={styles.loadingText}>Loading your notes...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <MaterialIcons name="error-outline" size={48} color="#E53E3E" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => loadFiles()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="elevated" style={[styles.header, { paddingTop: Math.max(20, insets.top) }]}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="note" size={28} color={primaryColor} style={styles.icon} />
          <ThemedText type="heading" style={styles.headerTitle}>My Notes</ThemedText>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleUploadFile}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </ThemedView>
      
      {showOnboarding ? (
        renderOnboarding()
      ) : (
        <FileList 
          files={files} 
          onRefresh={handleRefresh} 
          refreshing={refreshing}
          onFileDeleted={() => loadFiles(false)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        marginBottom: 0,
      },
      android: {
        elevation: 2,
        marginBottom: 4,
      },
    }),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8a65ed',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#E53E3E',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#8a65ed',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  onboardingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  onboardingDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  demoCard: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  demoImageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  demoImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#8a65ed',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});