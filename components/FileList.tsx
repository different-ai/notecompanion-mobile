import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FileCard } from './FileCard';
import { fetchFiles, deleteFile, UploadedFile, PaginationData } from '@/utils/api';
import { useAuth } from '@clerk/clerk-expo';

interface FileListProps {
  pageSize?: number;
}

export function FileList({ pageSize = 10 }: FileListProps) {
  const [page, setPage] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const { getToken } = useAuth();

  const fetchSavedFiles = async (currentPage: number = page) => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const token = await getToken();
      if (!token) {
        throw new Error('Please sign in to view your notes');
      }

      const result = await fetchFiles(token, { page: currentPage, limit: pageSize });
      
      // Update files state based on current page
      setFiles(currentPage === 1 ? result.files : [...files, ...result.files]);
      setPagination(result.pagination);

      // Log success for debugging
      console.log(`Loaded ${result.files.length} notes. Page ${currentPage}/${result.pagination.totalPages}`);
    } catch (err) {
      setError('Failed to load notes. Please check your connection and try again.');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavedFiles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchSavedFiles(1);
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSavedFiles(nextPage);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      Alert.alert(
        'Delete File',
        'Are you sure you want to delete this file?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const token = await getToken();
              if (!token) {
                throw new Error('Please sign in to delete files');
              }
              
              const result = await deleteFile(id, token);
              
              if (!result.success) {
                throw new Error(result.error || 'Failed to delete file');
              }
              
              // Update the file list
              setFiles(files.filter(file => file.id !== id));
              
              // Refresh if the list becomes empty
              if (files.length === 1) {
                onRefresh();
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error('Error deleting file:', err);
      Alert.alert('Error', 'Failed to delete file. Please try again.');
    }
  };

  const handleView = async (file: UploadedFile) => {
    try {
      if (file.blobUrl) {
        await Linking.openURL(file.blobUrl);
      } else {
        Alert.alert('Error', 'File URL not available');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Could not open the file');
    }
  };

  if (loading && !refreshing && files.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && files.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the empty state with more descriptive text
  if (files.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="cloud-off" size={48} color="#8E8E93" />
        <Text style={styles.emptyText}>No notes synced yet</Text>
        <Text style={styles.emptySubtext}>
          Notes you save will appear here for easy access
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <FileCard
          file={item}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={() => (
        <View style={styles.headerContainer}>
        </View>
      )}
      ListFooterComponent={() =>
        loading && files.length > 0 ? (
          <ActivityIndicator
            style={styles.loadingMore}
            size="small"
            color="#007AFF"
          />
        ) : pagination && pagination.total > 0 ? (
          <Text style={styles.footerText}>
            Showing {files.length} of {pagination.total} notes
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingMore: {
    marginVertical: 16,
  },
  headerContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  footerText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
    fontSize: 14,
  },
});
