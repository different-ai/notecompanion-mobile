import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSemanticColor } from '@/hooks/useThemeColor';
import { HapticTab } from '@/components/HapticTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import TabBarBackground component
import TabBarBackground from '@/components/ui/TabBarBackground';

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  
  // Get colors from our semantic theme system
  const primaryColor = useSemanticColor('primary');
  const tabIconDefaultColor = useSemanticColor('tabIconDefault');
  const backgroundColor = useSemanticColor('background');
  const tabBarColor = useSemanticColor('tabBar');
  
  // Authentication redirect logic
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Give auth a moment to restore from storage before redirecting
      const authTimeout = setTimeout(() => {
        router.replace('/(auth)'); // Redirect to auth index instead of sign-in directly
      }, 1000); // Wait 1 second before redirecting to allow token restore
      
      return () => clearTimeout(authTimeout);
    }
  }, [isLoaded, isSignedIn]);

  // Show nothing while auth is loading to prevent flash
  if (!isLoaded) {
    return null;
  }
  
  // If not signed in, we'll be redirected by the useEffect, but still render
  // to prevent flashing during the delay
  if (!isSignedIn) {
    return null;
  }

  // Determine header style based on platform
  const headerStyle = Platform.OS === 'ios' ? {
    headerStyle: {
      backgroundColor: 'transparent',
    },
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
    // For iOS, use translucent header with blur effect
    headerTransparent: true,
    headerBlurEffect: theme === 'dark' ? 'systemChromeMaterialDark' as const : 'systemChromeMaterial' as const,
  } : {
    headerStyle: {
      backgroundColor,
    },
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
  };

  // Custom tab bar icon with animation
  const renderTabIcon = (props: TabIconProps, iconName: React.ComponentProps<typeof MaterialIcons>['name']) => {
    const { color, size, focused } = props;
    return (
      <MaterialIcons
        name={iconName}
        size={size}
        color={color}
        style={{
          transform: [{ scale: focused ? 1.1 : 1 }],
        }}
      />
    );
  };

  return (
    <Tabs 
      screenOptions={{
        // Tab bar styling
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: tabIconDefaultColor,
        tabBarStyle: {
          backgroundColor: tabBarColor,
          // Add subtle border to tab bar
          borderTopColor: 'rgba(0,0,0,0.05)',
          borderTopWidth: StyleSheet.hairlineWidth,
          // Extra iOS-specific styling
          ...(Platform.OS === 'ios' ? {
            position: 'absolute',
            height: 49 + insets.bottom, // Standard iOS tab bar height + bottom safe area
          } : {}),
        },
        // Use custom tab button with haptic feedback on iOS
        tabBarButton: (props) => <HapticTab {...props} />,
        // Make tab bar background translucent on iOS
        tabBarBackground: () => <TabBarBackground />,
        // Show tab bar labels
        tabBarShowLabel: true,
        // Dynamic Island compatible header styling
        headerShown: false, // Hide default headers, we'll use custom ones in each tab
        // Animation for tab transitions
        tabBarHideOnKeyboard: true,
        ...headerStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (props) => renderTabIcon(props, 'home'),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'My Notes',
          tabBarIcon: (props) => renderTabIcon(props, 'note'),
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: (props) => renderTabIcon(props, 'sync'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (props) => renderTabIcon(props, 'settings'),
        }}
      />
    </Tabs>
  );
}