import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSemanticColor } from '@/hooks/useThemeColor';

export type ButtonVariant = 
  'primary' | 
  'secondary' | 
  'outline' | 
  'danger' | 
  'success' | 
  'text';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  haptic?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  onPress,
  children,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  haptic = true,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  // Get colors from our semantic theme system
  const primaryColor = useSemanticColor('primary');
  const dangerColor = useSemanticColor('danger');
  const successColor = useSemanticColor('success');
  const secondaryColor = useSemanticColor('secondary');
  const textColor = useSemanticColor('text');
  const backgroundColor = useSemanticColor('background');
  
  // Handle haptic feedback
  const handlePress = () => {
    if (haptic && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  // Get style based on variant
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: primaryColor,
        };
      case 'secondary':
        return {
          backgroundColor: secondaryColor,
        };
      case 'danger':
        return {
          backgroundColor: dangerColor,
        };
      case 'success':
        return {
          backgroundColor: successColor,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: primaryColor,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
        };
      default:
        return {};
    }
  };

  // Get text color based on variant
  const getTextColorStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return {
          color: 'black'
        };
      case 'outline':
        return {
          color: primaryColor,
        };
      case 'text':
        return {
          color: primaryColor,
        };
      default:
        return {};
    }
  };

  // Get size style
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return styles.smallButton;
      case 'lg':
        return styles.largeButton;
      case 'md':
      default:
        return {};
    }
  };

  // Get text size style
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return styles.smallText;
      case 'lg':
        return styles.largeText;
      case 'md':
      default:
        return {};
    }
  };

  // Different component rendering based on platform
  if (Platform.OS === 'ios') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          pressed && styles.pressed,
          style,
          disabled && styles.disabled,
        ]}
        disabled={disabled || loading}
      >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'text' ? primaryColor : 'white'} 
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
          <Text 
            style={[
              styles.text, 
              getTextColorStyle(),
              getTextSizeStyle(),
              textStyle
            ]}
          >
            {children}
          </Text>
          {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
        </>
      )}
    </Pressable>
    );
  } else {
    // Android or other platforms use TouchableOpacity
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          style,
          disabled && styles.disabled,
        ]}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'text' ? primaryColor : 'white'} 
            size={size === 'sm' ? 'small' : 'small'}
          />
        ) : (
          <>
            {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
            <Text 
              style={[
                styles.text, 
                getTextColorStyle(),
                getTextSizeStyle(),
                textStyle
              ]}
            >
              {children}
            </Text>
            {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
          </>
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 44, // Standard touch target
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 32,
  },
  largeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 52,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});