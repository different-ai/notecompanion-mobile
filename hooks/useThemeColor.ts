/**
 * Enhanced theme system with iOS 17+ and Material You compatibility
 * Supports Dynamic Island and provides consistent cross-platform design
 * 
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform, PlatformColor } from 'react-native';

// Type for all available theme colors
export type ThemeColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Enhanced hook for getting theme-aware colors with platform-specific optimizations
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
): string {
  // Always use light theme
  const theme = 'light';
  const colorFromProps = props[theme];

  // Override with props if provided
  if (colorFromProps) {
    return colorFromProps;
  }
  
  // Get the base color
  return Colors[theme][colorName];
}

/**
 * Returns a semantic color that will automatically adapt on iOS
 * Falls back to our custom theme colors on Android
 */
export function useSemanticColor(colorName: ThemeColorName): string {
  // Always use light theme
  const theme = 'light';
  
  // On iOS, we can use system colors for better Dynamic Island integration
  if (Platform.OS === 'ios') {
    try {
      // On iOS use platform colors when available, otherwise fallback to our own
      // Need to handle platform colors specially as they're not compatible with string type
      const color = Colors[theme][colorName];
      
      // Special case for tabBar which needs to be a regular color string for opacity
      if (colorName === 'tabBar') {
        return 'rgba(255, 255, 255, 0.9)';
      }
      
      return color;
    } catch (e) {
      // Fallback to our custom colors if PlatformColor fails
      return Colors[theme][colorName];
    }
  }
  
  // On Android, use our custom theme colors
  return Colors[theme][colorName];
}
