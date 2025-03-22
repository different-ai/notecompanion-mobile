import { View } from 'react-native';
import { useSemanticColor } from '@/hooks/useThemeColor';

// This is a shim for web and Android where the tab bar is generally opaque.
const TabBarBackground = () => {
  const backgroundColor = useSemanticColor('tabBar');
  return <View style={{ flex: 1, backgroundColor }} />;
};

export default TabBarBackground;

export function useBottomTabOverflow() {
  return 0;
}
