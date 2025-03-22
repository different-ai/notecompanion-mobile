import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSemanticColor } from '@/hooks/useThemeColor';

const TabBarBackground = () => {
  const backgroundColor = useSemanticColor('tabBar');
  
  return (
    <View 
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor }
      ]} 
    />
  );
};

export default TabBarBackground;

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
