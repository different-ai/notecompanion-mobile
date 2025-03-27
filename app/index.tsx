import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSemanticColor } from '@/hooks/useThemeColor';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const primaryColor = useSemanticColor('primary');
  
  // Show loading spinner while authentication state is loading
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  // Redirect based on authentication state
  // For signed-in users, go to the main app
  // For others, go to the auth welcome flow
  return isSignedIn ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/(auth)" />
  );
} 