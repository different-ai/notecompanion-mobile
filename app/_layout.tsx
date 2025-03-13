import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Platform, ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';
import { processSharedFile, cleanupSharedFile } from '@/utils/share-handler';
import * as FileSystem from 'expo-file-system';

import { useColorScheme } from '@/hooks/useColorScheme';
// Remove direct ClerkProvider import and use our custom AuthProvider
import { AuthProvider } from '@/providers/auth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const segments = useSegments();
  const [isProcessingShare, setIsProcessingShare] = useState(false);

  const publishableKey = CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const handleIncomingURL = async (url: string | null) => {
    console.log('\n[RootLayout] ===== Starting URL Processing =====');
    console.log('[RootLayout] Raw incoming URL:', url);
    if (!url) {
      console.log('[RootLayout] No URL provided');
      return;
    }

    // Set share processing state to show loading indicator instead of not-found
    setIsProcessingShare(true);

    try {
      // Handle direct file URLs
      if (url.startsWith('file://')) {
        console.log('\n[RootLayout] === Processing File URL ===');
        console.log('[RootLayout] Original URL:', url);
        
        try {
          // First decode the URL to handle double-encoded spaces
          const decodedUrl = decodeURIComponent(decodeURIComponent(url));
          console.log('[RootLayout] After double decode:', decodedUrl);
          
          // Split URL into components for filename only
          const urlParts = decodedUrl.split('/');
          const fileName = urlParts.pop() || 'shared-file';
          console.log('[RootLayout] Extracted filename:', fileName);
  
          // Create shared file object with original URL
          const sharedFile = {
            uri: url,  // Use original URL
            mimeType: decodedUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            name: fileName,
          };
          console.log('\n[RootLayout] Created shared file object:', JSON.stringify(sharedFile, null, 2));
  
          // Check if file exists before processing
          console.log('\n[RootLayout] === Checking File Existence ===');
          const fileInfo = await FileSystem.getInfoAsync(url);  // Check original URL
          console.log('[RootLayout] File info result:', JSON.stringify(fileInfo, null, 2));
  
          if (!fileInfo.exists) {
            // Try alternative paths
            console.log('\n[RootLayout] === Trying Alternative Paths ===');
            const alternativePaths = [
              url.replace('file://', ''),
              decodedUrl,
              url.replace(/%2520/g, '%20')
            ];
  
            let foundPath = null;
            for (const path of alternativePaths) {
              console.log('[RootLayout] Trying path:', path);
              const altFileInfo = await FileSystem.getInfoAsync(path);
              console.log('[RootLayout] Result for path:', { path, exists: altFileInfo.exists });
              if (altFileInfo.exists) {
                console.log('[RootLayout] Found file at alternative path:', path);
                sharedFile.uri = path;
                foundPath = path;
                break;
              }
            }
  
            if (!foundPath) {
              throw new Error(`File not found at path: ${url}\nTried alternative paths: ${alternativePaths.join('\n')}`);
            }
          }
  
          console.log('\n[RootLayout] === Processing File ===');
          const fileData = await processSharedFile(sharedFile);
          console.log('[RootLayout] Processed file data:', JSON.stringify(fileData, null, 2));
          
          console.log('\n[RootLayout] === Navigation ===');
          console.log('[RootLayout] Navigating to share screen');
          router.replace({
            pathname: '/(tabs)/share',
            params: { sharedFile: JSON.stringify(fileData) }
          });

        } catch (innerError) {
          // If anything fails with file processing, still go to home page
          console.error('[RootLayout] Error processing shared file:', innerError);
          
          // Navigate to the home tab instead of showing not found
          console.log('[RootLayout] Navigating to home due to error');
          router.replace('/(tabs)');
        } finally {
          // Always set processing to false when done
          setIsProcessingShare(false);
        }

        return;
      }

      // Handle share scheme URLs
      const { path, queryParams } = Linking.parse(url);
      console.log('[RootLayout] Parsed URL:', { path, queryParams });

      if (path === 'share') {
        console.log('[RootLayout] Processing share path');
        try {
          if (queryParams?.uri) {
            console.log('[RootLayout] Processing shared file with URI');
            const sharedFile = {
              uri: decodeURIComponent(queryParams.uri as string),
              mimeType: queryParams.type as string,
              name: queryParams.name as string,
            };
            console.log('[RootLayout] Shared file data:', sharedFile);
  
            const fileData = await processSharedFile(sharedFile);
            console.log('[RootLayout] Processed file data:', fileData);
            
            console.log('[RootLayout] Navigating to share screen');
            router.replace({
              pathname: '/(tabs)/share',
              params: { sharedFile: JSON.stringify(fileData) }
            });
  
            // Clean up temporary files after processing
            if (Platform.OS === 'android') {
              console.log('[RootLayout] Cleaning up Android temporary files');
              await cleanupSharedFile(sharedFile.uri);
            }
          } else if (queryParams?.text) {
            console.log('[RootLayout] Processing shared text');
            const textData = {
              text: decodeURIComponent(queryParams.text as string),
              mimeType: 'text/plain',
              name: 'shared-text.txt'
            };
            console.log('[RootLayout] Text data:', textData);
  
            console.log('[RootLayout] Navigating to share screen with text');
            router.replace({
              pathname: '/(tabs)/share',
              params: { sharedFile: JSON.stringify(textData) }
            });
          } else {
            // No valid parameters found, go to home
            console.log('[RootLayout] No valid parameters found, going to home');
            router.replace('/(tabs)');
          }
        } catch (innerError) {
          // If anything fails, still go to home page
          console.error('[RootLayout] Error processing share path:', innerError);
          console.log('[RootLayout] Navigating to home due to error');
          router.replace('/(tabs)');
        } finally {
          // Always set processing to false when done
          setIsProcessingShare(false);
        }
      } else {
        // Unknown path, go to home
        console.log('[RootLayout] Unknown path, going to home');
        router.replace('/(tabs)');
        setIsProcessingShare(false);
      }
    } catch (error) {
      console.error('[RootLayout] Error handling shared content:', error);
      // For any unhandled error, redirect to home
      console.log('[RootLayout] Navigating to home due to unhandled error');
      router.replace('/(tabs)');
      setIsProcessingShare(false);
    }
  };

  // Add logging for URL handling setup
  useEffect(() => {
    console.log('[RootLayout] Setting up URL handlers');
    // Handle initial URL when app is opened from share
    Linking.getInitialURL().then(url => {
      console.log('[RootLayout] Initial URL:', url);
      if (url) {
        // If we have a URL on initial load, we want to handle it before proceeding
        handleIncomingURL(url);
      }
    });

    // Subscribe to URL open events
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[RootLayout] URL open event:', url);
      handleIncomingURL(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  // Show a loading spinner while processing shared content
  if (isProcessingShare) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing CLERK_PUBLISHABLE_KEY');
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Import and use the AuthProvider from providers/auth.tsx instead of direct ClerkProvider */}
      <AuthProvider>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#f5f5f5',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
