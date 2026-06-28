// Do'kon ma'lumotlari ekrani / Store info screen
import React from 'react';
import { ScrollView, TouchableOpacity, Linking } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, Clock, Phone } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { useStoreInfo } from '../../utils/useStoreInfo';

const StoreInfoScreen = () => {
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const STORE_INFO = useStoreInfo();

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={18} fontWeight="bold" color={Colors.black}>{t('profile.storeAddress')}</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={14}>
          <XStack alignItems="flex-start" gap={12}>
            <MapPin color={Colors.green} size={22} />
            <YStack flex={1}>
              <Text fontWeight="600" color={Colors.black}>{t('store.addressLabel')}</Text>
              <Text color={Colors.grayDark} lineHeight={22}>{STORE_INFO.address}</Text>
            </YStack>
          </XStack>
          <YStack height={0.5} backgroundColor={Colors.border} />
          <XStack alignItems="center" gap={12}>
            <Clock color={Colors.green} size={22} />
            <YStack>
              <Text fontWeight="600" color={Colors.black}>{t('store.workHours')}</Text>
              <Text color={Colors.grayDark}>{STORE_INFO.hours}</Text>
            </YStack>
          </XStack>
          <YStack height={0.5} backgroundColor={Colors.border} />
          <XStack alignItems="center" gap={12}>
            <Phone color={Colors.green} size={22} />
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${STORE_INFO.phone.replace(/[\s\-\(\)]/g, '')}`)}>
              <Text fontWeight="600" color={Colors.black}>{t('store.phoneLabel')}</Text>
              <Text color={Colors.green}>{STORE_INFO.phone}</Text>
            </TouchableOpacity>
          </XStack>
        </YStack>

        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={12}>
          <Text fontWeight="bold" fontSize={15} color={Colors.black}>{t('store.messengers')}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(STORE_INFO.whatsapp)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
              backgroundColor: '#25D36620', borderRadius: 10 }}>
            <YStack width={36} height={36} borderRadius={18} backgroundColor="#25D366" alignItems="center" justifyContent="center">
              <Text color="#fff">W</Text>
            </YStack>
            <Text fontWeight="600" color="#25D366">WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(STORE_INFO.telegram)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
              backgroundColor: '#0088CC20', borderRadius: 10 }}>
            <YStack width={36} height={36} borderRadius={18} backgroundColor="#0088CC" alignItems="center" justifyContent="center">
              <Text color="#fff">TG</Text>
            </YStack>
            <Text fontWeight="600" color="#0088CC">Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(STORE_INFO.instagram)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
              backgroundColor: '#E1306C20', borderRadius: 10 }}>
            <YStack width={36} height={36} borderRadius={18} backgroundColor="#E1306C" alignItems="center" justifyContent="center">
              <Text color="#fff">Ig</Text>
            </YStack>
            <Text fontWeight="600" color="#E1306C">Instagram</Text>
          </TouchableOpacity>
        </YStack>
      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default StoreInfoScreen;
