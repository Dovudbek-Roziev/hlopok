import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHeaderTopPadding = () => {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, 8);
};
