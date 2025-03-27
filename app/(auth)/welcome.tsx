import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Define valid icon types for TypeScript
type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  const documentExamples = [
    {
      title: "Receipt Scan",
      preview: "OCR-extracted text from business receipts for easy expense tracking...",
      date: "Mar 15, 2024",
      icon: "receipt" as IconName,
    },
    {
      title: "Book Page",
      preview: "Scanned page with highlighted text and OCR extraction...",
      date: "Mar 12, 2024",
      icon: "menu-book" as IconName,
    },
    {
      title: "Handwritten Note",
      preview: "Transcribed text from handwritten meeting notes with 98% accuracy...",
      date: "Mar 8, 2024",
      icon: "draw" as IconName,
    },
  ];

  const integrations = [
    {
      name: "Obsidian",
      description: "Sync transcribed documents directly to your Obsidian vault",
      icon: "extension" as IconName,
    },
    {
      name: "Apple Notes",
      description: "Export OCR results to Apple Notes with one tap",
      icon: "ios-share" as IconName,
    },
    {
      name: "Telegram",
      description: "Share transcribed content via Telegram",
      icon: "send" as IconName,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.heroSection}>
          <Image 
            source={require('@/assets/big-logo.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>
            Document OCR & Sync
          </Text>
          <Text style={styles.heroDescription}>
            Note Companion automatically extracts text from your documents using OCR technology,
            making it accessible across all your favorite platforms.
          </Text>
        </View>
        
        <View style={styles.workflowSection}>
          <Text style={styles.sectionTitle}>Simple Workflow</Text>
          
          <View style={styles.workflowStep}>
            <View style={styles.workflowIcon}>
              <MaterialIcons name="upload-file" size={28} color="#fff" />
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.workflowContent}>
              <Text style={styles.workflowTitle}>Upload Document</Text>
              <Text style={styles.workflowDescription}>
                Scan or upload any document, receipt, book page, or handwritten note
              </Text>
            </View>
          </View>
          
          <View style={styles.workflowStep}>
            <View style={styles.workflowIcon}>
              <MaterialIcons name="document-scanner" size={28} color="#fff" />
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.workflowContent}>
              <Text style={styles.workflowTitle}>OCR Processing</Text>
              <Text style={styles.workflowDescription}>
                Our advanced OCR technology extracts text with high accuracy
              </Text>
            </View>
          </View>
          
          <View style={styles.workflowStep}>
            <View style={styles.workflowIcon}>
              <MaterialIcons name="sync" size={28} color="#fff" />
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.workflowContent}>
              <Text style={styles.workflowTitle}>Sync Everywhere</Text>
              <Text style={styles.workflowDescription}>
                Access your transcribed text on the web dashboard or export to other apps
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Document Examples</Text>
          <Text style={styles.sectionSubtitle}>
            Here's what your transcribed documents look like:
          </Text>
          
          {documentExamples.map((doc, index) => (
            <View key={index} style={styles.noteCard}>
              <View style={styles.noteIconContainer}>
                <MaterialIcons name={doc.icon} size={24} color="#8a65ed" />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>{doc.title}</Text>
                <Text style={styles.notePreview} numberOfLines={2}>{doc.preview}</Text>
                <Text style={styles.noteDate}>{doc.date}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.integrationsSection}>
          <Text style={styles.sectionTitle}>Integrations</Text>
          <Text style={styles.sectionSubtitle}>
            Sync your transcribed content with these platforms:
          </Text>
          
          {integrations.map((integration, index) => (
            <View key={index} style={styles.featureCard}>
              <MaterialIcons name={integration.icon} size={24} color="#8a65ed" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{integration.name}</Text>
                <Text style={styles.featureDescription}>
                  {integration.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={24} color="#666" />
          <Text style={styles.infoText}>
            Note Companion is a document OCR and syncing tool. 
            Sign in with your existing account to start uploading documents and accessing the OCR features.
          </Text>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.signInButtonText}>Sign In to Start Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  workflowSection: {
    marginBottom: 30,
  },
  workflowStep: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  workflowIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8a65ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8a65ed',
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8a65ed',
    lineHeight: 18,
  },
  workflowContent: {
    flex: 1,
  },
  workflowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workflowDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  demoSection: {
    marginBottom: 30,
  },
  integrationsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  noteCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
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
  noteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#888',
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
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
  featureContent: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  signInButton: {
    backgroundColor: '#8a65ed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 