import React from 'react';
import { TouchableOpacity, Linking, ScrollView, View } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Phone, MapPin, Clock, ChevronLeft } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Svg, { Path } from 'react-native-svg';
import { useColors } from '../../theme/useColors';
import { useStoreInfo } from '../../utils/useStoreInfo';

// ── Brand logos ──────────────────────────────────────────────

const WhatsAppLogo = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Path fill="white" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </Svg>
);

const TelegramLogo = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
    <Path fill="white" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </Svg>
);

const InstagramLogo = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path fill="white" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </Svg>
);

// ── Card ─────────────────────────────────────────────────────

const ContactCard = ({
  bgColor, logo, label, sub, onPress,
}: {
  bgColor: string;
  logo: React.ReactNode;
  label: string;
  sub: string;
  onPress?: () => void;
}) => {
  const Colors = useColors();
  const Inner = (
    <XStack
      backgroundColor={Colors.white}
      borderRadius={16}
      padding={16}
      alignItems="center"
      gap={14}
      marginBottom={10}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: bgColor,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {logo}
      </View>
      <YStack flex={1} gap={2}>
        <Text fontSize={15} fontWeight="700" color={Colors.black}>{label}</Text>
        <Text fontSize={13} color={Colors.gray} numberOfLines={2}>{sub}</Text>
      </YStack>
      {onPress && (
        <Text fontSize={22} color={Colors.gray} style={{ marginRight: 4 }}>›</Text>
      )}
    </XStack>
  );

  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{Inner}</TouchableOpacity>
    : Inner;
};

// ── Section label ─────────────────────────────────────────────

const SectionLabel = ({ title }: { title: string }) => {
  const Colors = useColors();
  return (
  <Text
    fontSize={11} color={Colors.gray} fontWeight="600"
    style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}
  >
    {title}
  </Text>
  );
};

// ─────────────────────────────────────────────────────────────

const ContactsScreen = () => {
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const STORE_INFO = useStoreInfo();
  return (
  <ScreenWrapper>
  <YStack flex={1} backgroundColor={Colors.bg}>
    <YStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={20} paddingBottom={16}>
      <XStack alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={22} fontWeight="bold" color={Colors.black}>{t('contacts.title')}</Text>
      </XStack>
    </YStack>

    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel title={t('contacts.messengers')} />

      <ContactCard
        bgColor="#25D366"
        logo={<WhatsAppLogo />}
        label="WhatsApp"
        sub={STORE_INFO.phone}
        onPress={() => Linking.openURL(STORE_INFO.whatsapp)}
      />

      <ContactCard
        bgColor="#229ED9"
        logo={<TelegramLogo />}
        label="Telegram"
        sub={`@${STORE_INFO.telegram.replace(/.*t\.me\//, '').replace(/\/$/, '')}`}
        onPress={() => Linking.openURL(STORE_INFO.telegram)}
      />

      <ContactCard
        bgColor="#C13584"
        logo={<InstagramLogo />}
        label="Instagram"
        sub={`@${STORE_INFO.instagram.replace(/.*instagram\.com\//, '').replace(/\/$/, '')}`}
        onPress={() => Linking.openURL(STORE_INFO.instagram)}
      />

      <View style={{ height: 8 }} />
      <SectionLabel title={t('contacts.aboutStore')} />

      <ContactCard
        bgColor="#FFD700"
        logo={<Phone color="#1A1A1A" size={22} />}
        label={t('contacts.phone')}
        sub={STORE_INFO.phone}
        onPress={() => Linking.openURL(`tel:${STORE_INFO.phone}`)}
      />

      <ContactCard
        bgColor="#FF7043"
        logo={<MapPin color="white" size={22} />}
        label={t('contacts.address')}
        sub={STORE_INFO.address}
      />

      <ContactCard
        bgColor="#7E57C2"
        logo={<Clock color="white" size={22} />}
        label={t('contacts.workHours')}
        sub={STORE_INFO.hours}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  </YStack>
  </ScreenWrapper>
  );
};

export default ContactsScreen;
