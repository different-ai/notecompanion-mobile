import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface IntegrationOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  comingSoon: boolean;
}

const integrations: IntegrationOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: 'book',
    description: 'Sync your files directly with your Obsidian vault',
    comingSoon: false,
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    icon: 'cloud',
    description: 'Backup your files to Google Drive',
    comingSoon: true,
  },
  {
    id: 'icloud',
    name: 'iCloud',
    icon: 'cloud-download',
    description: 'Seamlessly sync with your iCloud storage',
    comingSoon: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'description',
    description: 'Import files directly to your Notion workspace',
    comingSoon: true,
  },
];

export default function SyncScreen() {
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.mainSection}>
          <View style={styles.explanationCard}>
            <MaterialIcons name="update" size={24} color="#007AFF" />
            <Text style={styles.explanationTitle}>Seamless Integration</Text>
            <Text style={styles.explanationText}>
              We're working on integrations with your favorite services to make your file organization experience even better.
            </Text>
          </View>

          <View style={styles.integrationsList}>
            {integrations.map((integration) => (
              <View key={integration.id} style={styles.integrationCard}>
                <View style={styles.integrationHeader}>
                  <MaterialIcons name={integration.icon as any} size={32} color="#007AFF" />
                  <View style={styles.integrationTitleContainer}>
                    <Text style={styles.integrationTitle}>{integration.name}</Text>
                    {integration.comingSoon ? (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    ) : (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.integrationDescription}>
                  {integration.description}
                </Text>
                {integration.id === 'obsidian' && !integration.comingSoon && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsTitle}>How to sync:</Text>
                    <Text style={styles.instructionsText}>
                      1. Visit notecompanion.ai in your browser{'\n'}
                      2. Follow the instructions for Obsidian integration{'\n'}
                      3. Your notes will sync between this app and your Obsidian vault
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.notificationCard}>
            <MaterialIcons name="notifications-active" size={24} color="#007AFF" />
            <Text style={styles.notificationTitle}>Stay Updated</Text>
            <Text style={styles.notificationText}>
              We'll notify you as soon as these integrations become available.
            </Text>
            <Text style={styles.notificationHint}>
              You can view your saved notes in the My Notes tab.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  mainSection: {
    padding: 16,
  },
  explanationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    color: '#1a1a1a',
  },
  explanationText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  integrationsList: {
    gap: 16,
  },
  integrationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  integrationTitleContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  comingSoonBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  integrationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  instructionsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginVertical: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationHint: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
});