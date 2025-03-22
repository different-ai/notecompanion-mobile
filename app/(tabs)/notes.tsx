import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { FileList } from '@/components/FileList';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useSemanticColor } from '@/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotesScreen() {
  const primaryColor = useSemanticColor('primary');
  const insets = useSafeAreaInsets();
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="elevated" style={[styles.header, { paddingTop: Math.max(20, insets.top) }]}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="note" size={28} color={primaryColor} style={styles.icon} />
          <ThemedText type="heading" style={styles.title}>My Notes</ThemedText>
        </View>
        <ThemedText colorName="textSecondary" type="label" style={styles.subtitle}>
          View and manage all your processed documents
        </ThemedText>
      </ThemedView>
      
      <View style={styles.fileListContainer}>
        <FileList />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderRadius: 0,
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
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 8,
  },
  fileListContainer: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
});