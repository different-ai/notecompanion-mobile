import { Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';
import { useSemanticColor } from '@/hooks/useThemeColor';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const primaryColor = useSemanticColor('primary');

  // Show loading screen while Clerk loads
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
} 