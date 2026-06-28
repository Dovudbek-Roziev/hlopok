import React from 'react';
import { ScrollView, TouchableOpacity, Linking } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft, ChevronRight, MessageCircle, Send,
  Camera, HelpCircle, Headphones,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { useStoreInfo } from '../../utils/useStoreInfo';

const SupportScreen = () => {
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const STORE_INFO = useStoreInfo();

  const CONTACTS = [
    { label: 'WhatsApp',  icon: MessageCircle, bg: '#25D366', url: STORE_INFO.whatsapp },
    { label: 'Telegram',  icon: Send,           bg: '#0088CC', url: STORE_INFO.telegram },
    { label: 'Instagram', icon: Camera,          bg: '#E1306C', url: STORE_INFO.instagram },
  ];

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* ── Yellow header with banner ── */}
      <YStack backgroundColor={Colors.yellow} paddingTop={50} paddingHorizontal={16} paddingBottom={20}>
        <XStack alignItems="center" gap={10} marginBottom={14}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.black} size={24} />
          </TouchableOpacity>
          <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('store.supportTitle')}</Text>
        </XStack>

        {/* Banner */}
        <YStack backgroundColor="rgba(0,0,0,0.08)" borderRadius={16} height={110}
          alignItems="center" justifyContent="center" gap={8}>
          <Headphones color={Colors.black} size={36} />
          <Text fontSize={13} fontWeight="600" color={Colors.black}>
            {t('store.supportBanner')}
          </Text>
        </YStack>
      </YStack>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>

        {/* Hint */}
        <YStack backgroundColor={Colors.white} borderRadius={14} padding={16}>
          <Text color={Colors.grayDark} fontSize={14} lineHeight={20}>
            {t('store.supportHint')}
          </Text>
        </YStack>

        {/* ── Contact buttons ── */}
        <YStack gap={8}>
          <Text fontSize={12} fontWeight="700" color={Colors.grayDark} textTransform="uppercase" letterSpacing={0.5}>
            {t('store.contactUs')}
          </Text>
          {CONTACTS.map(({ label, icon: Icon, bg, url }) => (
            <TouchableOpacity key={label} onPress={() => { if (url) Linking.openURL(url).catch(() => {}); }}
              style={{ backgroundColor: bg, borderRadius: 14, height: 54,
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 }}>
              <Icon color="#fff" size={22} />
              <Text flex={1} fontWeight="700" color="#fff" fontSize={15}>{label}</Text>
              <ChevronRight color="rgba(255,255,255,0.7)" size={20} />
            </TouchableOpacity>
          ))}
        </YStack>

{/* FAQ button */}
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab', { screen: 'FAQ' })}
          style={{ borderWidth: 1.5, borderColor: Colors.yellow, borderRadius: 14, height: 52,
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12,
            backgroundColor: Colors.white }}>
          <HelpCircle color="#C9A800" size={20} />
          <Text flex={1} fontWeight="600" color={Colors.black} fontSize={15}>{t('profile.faq')}</Text>
          <ChevronRight color={Colors.grayLight} size={18} />
        </TouchableOpacity>

      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default SupportScreen;
