import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

interface TabIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  console.log('[TabLayout] Rendered with auth state:', { isSignedIn, isLoaded });

  useEffect(() => {
    console.log('[TabLayout] Auth state changed:', { isSignedIn, isLoaded });
    
    if (isLoaded && !isSignedIn) {
      // Give auth a moment to restore from storage before redirecting
      const authTimeout = setTimeout(() => {
        console.log('[TabLayout] User not signed in after timeout, redirecting to sign-in');
        router.replace('/(auth)/sign-in');
      }, 1000); // Wait 1 second before redirecting to allow token restore
      
      return () => clearTimeout(authTimeout);
    }
  }, [isLoaded, isSignedIn]);

  // Show nothing while auth is loading to prevent flash
  if (!isLoaded) {
    console.log('[TabLayout] Auth still loading, not rendering tabs yet');
    return null;
  }
  
  // If not signed in, we'll be redirected by the useEffect, but still render
  // to prevent flashing during the delay
  if (!isSignedIn) {
    console.log('[TabLayout] Not signed in, waiting for redirect timeout');
    // We're returning null here but the useEffect will handle redirection
    return null;
  }

  console.log('[TabLayout] Rendering tab navigation');
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#007AFF',
        headerShown: true 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'My Notes',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="sync" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
