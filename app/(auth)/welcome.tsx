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

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  const demoNotes = [
    {
      title: "Meeting Notes",
      preview: "AI-generated summary of today's product meeting with action items...",
      date: "Nov 10, 2023",
      icon: "event-note",
    },
    {
      title: "Research Summary",
      preview: "Analysis of competitor landscape with key findings...",
      date: "Nov 8, 2023",
      icon: "search",
    },
    {
      title: "Project Ideas",
      preview: "Brainstorming session for new product features...",
      date: "Nov 5, 2023",
      icon: "lightbulb",
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
        <Text style={styles.headerTitle}>Feature Preview</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.heroSection}>
          <Image 
            source={require('@/assets/images/app-demo.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>
            Your Personal Note Assistant
          </Text>
          <Text style={styles.heroDescription}>
            Note Companion AI enhances your notes with powerful AI features, 
            organization, and insights - all accessible through this companion app.
          </Text>
        </View>
        
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Note Examples</Text>
          <Text style={styles.sectionSubtitle}>
            Here's a preview of what your notes could look like:
          </Text>
          
          {demoNotes.map((note, index) => (
            <View key={index} style={styles.noteCard}>
              <View style={styles.noteIconContainer}>
                <MaterialIcons name={note.icon} size={24} color="#8a65ed" />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.notePreview} numberOfLines={2}>{note.preview}</Text>
                <Text style={styles.noteDate}>{note.date}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureCard}>
            <MaterialIcons name="speed" size={24} color="#8a65ed" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-time Sync</Text>
              <Text style={styles.featureDescription}>
                Any changes you make on the web are instantly available on your mobile device.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <MaterialIcons name="security" size={24} color="#8a65ed" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure Access</Text>
              <Text style={styles.featureDescription}>
                Your notes are protected with enterprise-grade security and encryption.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <MaterialIcons name="auto-awesome" size={24} color="#8a65ed" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Analysis</Text>
              <Text style={styles.featureDescription}>
                Get summaries, action items, and insights from your notes.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={24} color="#666" />
          <Text style={styles.infoText}>
            This is a companion app for Note Companion AI. 
            Sign in with your existing account to access your notes and all features.
          </Text>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/sign-in')}
        >
          <Text style={styles.signInButtonText}>Sign In to Access Your Notes</Text>
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
  demoSection: {
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
  featuresSection: {
    marginBottom: 30,
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