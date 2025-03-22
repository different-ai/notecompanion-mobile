import { View, type ViewProps, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useSemanticColor, useThemeColor, ThemeColorName } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  colorName?: ThemeColorName;
  variant?: 'default' | 'card' | 'elevated' | 'grouped' | 'inset';
  bordered?: boolean;
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'none' | 'full';
};

// Border radius values
const borderRadii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor,
  colorName = 'background',
  variant = 'default',
  bordered = false,
  rounded = false,
  ...otherProps 
}: ThemedViewProps) {
  // Use semantic color system for iOS native look and feel
  const backgroundColor = useSemanticColor(colorName);
  
  // Override with explicit colors if provided
  const explicitBackgroundColor = lightColor || darkColor 
    ? useThemeColor({ light: lightColor, dark: darkColor }, 'background')
    : backgroundColor;
  
  // Border color 
  const borderColor = useSemanticColor('border');
  
  // Calculate border radius based on rounded prop
  let borderRadius: number | undefined = undefined;
  if (rounded) {
    if (rounded === true) {
      borderRadius = borderRadii.md; // Default to medium
    } else {
      borderRadius = borderRadii[rounded];
    }
  }

  return (
    <View 
      style={[
        // Base background color
        { backgroundColor: explicitBackgroundColor },
        
        // Apply variant styles
        variant === 'card' && styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'grouped' && styles.grouped,
        variant === 'inset' && styles.inset,
        
        // Apply border if requested
        bordered && { borderWidth: StyleSheet.hairlineWidth, borderColor },
        
        // Apply border radius if requested
        borderRadius !== undefined && { borderRadius },
        
        // Custom styles
        style,
      ]} 
      {...otherProps} 
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  elevated: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  grouped: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inset: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
