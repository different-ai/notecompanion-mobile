import { Text, type TextProps, StyleSheet, Platform, StyleProp, TextStyle } from 'react-native';
import { useSemanticColor, useThemeColor, ThemeColorName } from '@/hooks/useThemeColor';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/**
 * App-wide themed text component that handles color schemes, typography, and styling
 * This component automatically adapts to iOS/Android platform conventions
 */
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  colorName?: ThemeColorName;
  weight?: FontWeight;
  size?: FontSize;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 
         'heading' | 'body' | 'caption' | 'label' | 'largeTitle';
};

// iOS SF Pro / Android Material You compatible typography system
// This automatically adjusts based on platform conventions
const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Get the system font family for each platform
const fontFamily = Platform.select({
  ios: undefined, // Uses San Francisco by default
  android: 'Roboto', // Android default
  default: undefined,
});

export function ThemedText({
  style,
  lightColor,
  darkColor,
  colorName = 'text',
  weight,
  size,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  // Use semantic color system for better platform integration
  const color = useSemanticColor(colorName);

  // Override with explicit colors if provided
  const explicitColor = lightColor || darkColor 
    ? useThemeColor({ light: lightColor, dark: darkColor }, 'text')
    : color;

  // Dynamically determine font weight based on type or weight prop
  let fontWeight: TextStyle['fontWeight'] = 'normal';
  if (weight) {
    switch (weight) {
      case 'regular': fontWeight = 'normal'; break;
      case 'medium': fontWeight = '500'; break;
      case 'semibold': fontWeight = '600'; break;
      case 'bold': fontWeight = 'bold'; break;
    }
  }

  // Dynamically determine fontSize based on size prop
  const fontSize = size ? fontSizes[size] : undefined;

  return (
    <Text
      style={[
        { color: explicitColor, fontFamily },
        // Original styles for backward compatibility
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        // New enhanced styles
        type === 'heading' ? styles.heading : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'largeTitle' ? styles.largeTitle : undefined,
        // Override with size and weight if explicitly provided
        fontSize ? { fontSize } : undefined,
        fontWeight ? { fontWeight } : undefined,
        // Custom styles passed as props
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Original styles for backward compatibility
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: Platform.OS === 'ios' ? 38 : 40, // Slight platform adjustment
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    // Using dynamic color through props instead of hardcoded value
  },

  // New enhanced iOS 17-inspired typography
  largeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: Platform.OS === 'ios' ? 0.41 : 0, // iOS-specific kerning
    lineHeight: 41,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: Platform.OS === 'ios' ? 0.34 : 0,
    lineHeight: 34,
  },
  body: {
    fontSize: 17,
    letterSpacing: Platform.OS === 'ios' ? -0.41 : 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: Platform.OS === 'ios' ? -0.24 : 0,
    lineHeight: 20,
  },
});
