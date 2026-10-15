import { TouchableOpacity } from 'react-native';
import { Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useColors } from '../theme/useColors';

export default function ReviewRules({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value }}
    onPress={() => onChange(!value)} style={{ paddingVertical: 12 }}>
    <Text color={colors.black} fontSize={13}>{value ? '☑ ' : '☐ '}{t('release.rules')}</Text>
  </TouchableOpacity>;
}
