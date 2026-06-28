import React from 'react';
import { Modal, ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useColors } from '../theme/useColors';

const SIZES = [
  { size: '1 мес',  age_ru: '0–1 мес',   age_ky: '0–1 ай',   height: '50–56', weight: '3–4'   },
  { size: '3 мес',  age_ru: '1–3 мес',   age_ky: '1–3 ай',   height: '56–62', weight: '4–6'   },
  { size: '6 мес',  age_ru: '3–6 мес',   age_ky: '3–6 ай',   height: '62–68', weight: '6–8'   },
  { size: '9 мес',  age_ru: '6–9 мес',   age_ky: '6–9 ай',   height: '68–74', weight: '8–9'   },
  { size: '12 мес', age_ru: '9–12 мес',  age_ky: '9–12 ай',  height: '74–80', weight: '9–10'  },
  { size: '18 мес', age_ru: '12–18 мес', age_ky: '12–18 ай', height: '80–86', weight: '10–11' },
  { size: '24 мес', age_ru: '18–24 мес', age_ky: '18–24 ай', height: '86–92', weight: '11–13' },
  { size: '3 года', age_ru: '2–3 года',  age_ky: '2–3 жаш',  height: '92–98',  weight: '13–15' },
  { size: '4 года', age_ru: '3–4 года',  age_ky: '3–4 жаш',  height: '98–104', weight: '15–17' },
  { size: '5 лет',  age_ru: '4–5 лет',   age_ky: '4–5 жаш',  height: '104–110', weight: '17–19' },
  { size: '6 лет',  age_ru: '5–6 лет',   age_ky: '5–6 жаш',  height: '110–116', weight: '19–21' },
  { size: '7 лет',  age_ru: '6–7 лет',   age_ky: '6–7 жаш',  height: '116–122', weight: '21–24' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SizeGuideModal = ({ visible, onClose }: Props) => {
  const Colors    = useColors();
  const { t, i18n } = useTranslation();
  const isKy      = i18n.language === 'ky';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
        <YStack
          backgroundColor={Colors.white}
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          maxHeight="88%"
          paddingBottom={24}
        >
          {/* Header */}
          <XStack paddingHorizontal={20} paddingTop={20} paddingBottom={12}
            alignItems="center" justifyContent="space-between">
            <Text fontSize={18} fontWeight="700" color={Colors.black}>
              {t('sizeGuide.title')}
            </Text>
            <TouchableOpacity onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.grayLight,
                alignItems: 'center', justifyContent: 'center' }}>
              <X color={Colors.gray} size={18} />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack paddingHorizontal={16} paddingBottom={8}>

              {/* Table header */}
              <XStack backgroundColor={Colors.yellow} borderRadius={10}
                paddingVertical={10} paddingHorizontal={12} marginBottom={4}>
                <Text flex={1.2} fontWeight="700" fontSize={13} color={Colors.black}>
                  {t('sizeGuide.size')}
                </Text>
                <Text flex={2} fontWeight="700" fontSize={13} color={Colors.black}>
                  {t('sizeGuide.age')}
                </Text>
                <Text flex={1.5} fontWeight="700" fontSize={13} color={Colors.black} textAlign="center">
                  {t('sizeGuide.height')}
                </Text>
                <Text flex={1.5} fontWeight="700" fontSize={13} color={Colors.black} textAlign="center">
                  {t('sizeGuide.weight')}
                </Text>
              </XStack>

              {/* Table rows */}
              {SIZES.map((row, i) => (
                <XStack
                  key={row.size}
                  backgroundColor={i % 2 === 0 ? Colors.bg : Colors.white}
                  borderRadius={8}
                  paddingVertical={10}
                  paddingHorizontal={12}
                  alignItems="center"
                >
                  <Text flex={1.2} fontWeight="600" fontSize={13} color={Colors.black}>
                    {row.size}
                  </Text>
                  <Text flex={2} fontSize={13} color={Colors.grayDark}>
                    {isKy ? row.age_ky : row.age_ru}
                  </Text>
                  <Text flex={1.5} fontSize={13} color={Colors.grayDark} textAlign="center">
                    {row.height}
                  </Text>
                  <Text flex={1.5} fontSize={13} color={Colors.grayDark} textAlign="center">
                    {row.weight}
                  </Text>
                </XStack>
              ))}

              {/* Hint */}
              <YStack marginTop={14} backgroundColor={Colors.bg} borderRadius={10}
                padding={12} borderLeftWidth={3} borderLeftColor={Colors.yellow}>
                <Text fontSize={12} color={Colors.gray} lineHeight={18}>
                  {t('sizeGuide.hint')}
                </Text>
              </YStack>

            </YStack>
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
};

export default SizeGuideModal;
