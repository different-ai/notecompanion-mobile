import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileList } from '@/components/FileList';
import { MaterialIcons } from '@expo/vector-icons';

export default function NotesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="note" size={36} color="#007AFF" />
        <Text style={styles.title}>My Notes</Text>
        <Text style={styles.subtitle}>
          View and manage all your processed documents
        </Text>
      </View>
      
      <View style={styles.fileListContainer}>
        <FileList />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  fileListContainer: {
    flex: 1,
    paddingTop: 10,
  },
});