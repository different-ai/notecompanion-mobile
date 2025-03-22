/**
 * Enhanced color system with warm, modern palette
 * Featuring a soft, paper-like background with purple accents
 */

// Warm, modern palette with purple accents
const primaryLight = 'rgb(159, 122, 234)'; // Purple primary
const primaryDark = 'rgb(167, 139, 250)'; // Purple primary - dark mode
const secondaryLight = '#F6AD55'; // Soft orange
const secondaryDark = '#ED8936'; // Soft orange - dark mode
const successLight = '#68D391'; // Soft green
const successDark = '#48BB78'; // Soft green - dark mode
const dangerLight = '#FC8181'; // Soft red
const dangerDark = '#F56565'; // Soft red - dark mode

// Enhanced color system with semantic colors
export const Colors = {
  light: {
    // Base colors
    text: '#4A5568', // Darker text for better readability on warm background
    textSecondary: '#718096', // Secondary text
    textTertiary: '#A0AEC0', // Tertiary text
    background: 'rgb(251, 244, 234)', // Warm, paper-like background as requested
    backgroundSecondary: 'rgb(255, 250, 240)', // Slightly lighter variant
    card: 'rgb(255, 250, 240)',
    border: '#EDF2F7', // Light border color
    notification: dangerLight,

    // Brand colors
    primary: primaryLight,
    secondary: secondaryLight,
    success: successLight,
    danger: dangerLight,
    warning: '#F6E05E', // Soft yellow

    // UI elements
    tint: primaryLight,
    icon: '#4A5568',
    tabIconDefault: '#718096',
    tabIconSelected: primaryLight,
    tabBar: 'rgb(251, 244, 234)', // Solid background matching app
  },
  dark: {
    // Base colors
    text: '#F7FAFC',
    textSecondary: '#E2E8F0',
    textTertiary: '#CBD5E0',
    background: '#2D3748', // Dark blue-gray
    backgroundSecondary: '#1A202C',
    card: '#2D3748',
    border: '#4A5568',
    notification: dangerDark,

    // Brand colors
    primary: primaryDark,
    secondary: secondaryDark,
    success: successDark,
    danger: dangerDark,
    warning: '#ECC94B',

    // UI elements
    tint: primaryDark,
    icon: '#E2E8F0',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: primaryDark,
    tabBar: '#1A202C',
  },
};
