import React, { useState } from 'react';
import { Alert, Linking, ScrollView, TouchableOpacity, View, Image } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MessageCircle, CircleCheck, ChevronRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { useStoreInfo } from '../../utils/useStoreInfo';
import { getSizeLabel } from '../../utils/sizeLabel';

// ── Mbank логотипи ────────────────────────────────────────────────────────────
const MbankLogo = ({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={{
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#007A3D',
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    }}
  >
    {/* Жашыл фон */}
    <View style={{ backgroundColor: '#007A3D', padding: 20, paddingBottom: 14 }}>
      {/* M тамгасы */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 30,
              fontWeight: '900',
              fontStyle: 'italic',
              lineHeight: 34,
            }}
          >
            M
          </Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 }}>
          bank
        </Text>
      </View>
      {/* ELQR белгиси */}
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: 'rgba(255,255,255,0.22)',
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>
          ELQR
        </Text>
      </View>
    </View>
    {/* Төмөнкү тилке */}
    <View
      style={{
        backgroundColor: '#005C2E',
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <ChevronRight color="#fff" size={14} />
    </View>
  </TouchableOpacity>
);

// ── O! Business логотипи ──────────────────────────────────────────────────────
const OBusinessLogo = ({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    style={{
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    }}
  >
    {/* Кара фон */}
    <View style={{ backgroundColor: '#111111', padding: 20, paddingBottom: 14 }}>
      {/* O! логотипи */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            backgroundColor: '#E91E8C',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 24 }}>O!</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
          Business
        </Text>
      </View>
      {/* ELQR белгиси */}
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#E91E8C',
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>
          ELQR
        </Text>
      </View>
    </View>
    {/* Төмөнкү тилке */}
    <View
      style={{
        backgroundColor: '#E91E8C',
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <ChevronRight color="#fff" size={14} />
    </View>
  </TouchableOpacity>
);

// ── PaymentScreen ─────────────────────────────────────────────────────────────
const PaymentScreen = () => {
  const Colors     = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const STORE_INFO  = useStoreInfo();
  const isKy        = i18n.language === 'ky';

  const {
    orderNumber    = '',
    orderId        = '',
    total          = 0,
    subtotal       = 0,
    bonusUsed      = 0,
    deliveryType   = 'pickup',
    deliveryAddress = '',
    contactName    = '',
    contactPhone   = '',
    note           = '',
    items          = [],
  } = route.params || {};

  const [whatsappSent, setWhatsappSent] = useState(false);

  // WhatsApp чек билдирүү
  const buildReceipt = () => {
    const lines = items.map((it: any) => {
      const name   = isKy ? (it.name_ky || it.name_ru) : it.name_ru;
      const size   = getSizeLabel(it.size, isKy ? 'ky' : 'ru');
      const color  = it.color ? `, ${it.color}` : '';
      return `• ${name} (${size}${color}) × ${it.qty} — ${formatPrice(it.price * it.qty)}`;
    });
    return lines.join('\n');
  };

  const openWhatsApp = async () => {
    const msg = t('checkout.paymentReceiptMsg', {
      number: orderNumber,
      amount: formatPrice(total),
      items:  buildReceipt(),
    });
    const url = `${STORE_INFO.whatsapp}?text=${encodeURIComponent(msg)}`;
    try {
      await Linking.openURL(url);
      setWhatsappSent(true);
    } catch {
      Alert.alert(t('common.error'), 'WhatsApp топулган жок');
    }
  };

  const goToSuccess = () => {
    navigation.replace('OrderSuccess', {
      orderNumber,
      orderId,
      paymentMethod: 'online',
      total,
      subtotal,
      bonusUsed,
      deliveryType,
      deliveryAddress,
      contactName,
      contactPhone,
      note,
      items,
    });
  };

  const openBank = async (link: string, bankName: string) => {
    if (!link) {
      Alert.alert(bankName, t('checkout.paymentLinkNotSet'));
      return;
    }
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert(t('common.error'), t('checkout.paymentLinkNotSet'));
    }
  };

  const tapLabel = isKy ? 'Басып төлөңүз' : 'Нажмите для оплаты';

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 32, gap: 16 }}
      >

        {/* ── Башкы: Буйрутма түзүлдү ── */}
        <YStack alignItems="center" gap={10} paddingVertical={4}>
          <YStack
            width={72}
            height={72}
            borderRadius={36}
            backgroundColor={Colors.greenBg}
            alignItems="center"
            justifyContent="center"
          >
            <CircleCheck color={Colors.green} size={42} />
          </YStack>
          <Text fontSize={20} fontWeight="800" color={Colors.black} textAlign="center">
            {t('checkout.paymentPendingTitle', { number: orderNumber })}
          </Text>
          <Text fontSize={13} color={Colors.gray} textAlign="center" lineHeight={20}>
            {t('checkout.paymentPendingSubtitle')}
          </Text>
        </YStack>

        {/* ── Сумма карточкасы ── */}
        <YStack
          backgroundColor={Colors.white}
          borderRadius={18}
          padding={20}
          alignItems="center"
          gap={6}
          style={{ borderWidth: 2, borderColor: Colors.yellow }}
        >
          <Text fontSize={12} color={Colors.gray} fontWeight="700" letterSpacing={1.5}>
            {isKy ? 'ТӨЛӨМ СУММАСЫ' : 'СУММА К ОПЛАТЕ'}
          </Text>
          <Text fontSize={36} fontWeight="900" color={Colors.black} letterSpacing={1}>
            {formatPrice(total)}
          </Text>
          {!!STORE_INFO.paymentName && (
            <XStack alignItems="center" gap={6} marginTop={4}>
              <Text fontSize={13} color={Colors.grayDark}>
                {isKy ? 'Алуучу:' : 'Получатель:'}
              </Text>
              <Text fontSize={14} fontWeight="700" color={Colors.green}>
                {STORE_INFO.paymentName}
              </Text>
            </XStack>
          )}
          {!!STORE_INFO.paymentCard && (
            <Text fontSize={13} color={Colors.gray}>
              {STORE_INFO.paymentCard}
            </Text>
          )}
        </YStack>

        {/* ── QR Код ── */}
        <YStack gap={12}>
          <Text fontSize={15} fontWeight="800" color={Colors.black}>
            {t('checkout.paymentChooseBank')}
          </Text>

          {/* QR kodlar — agar yuklangan bo'lsa ko'rsatish */}
          {(STORE_INFO.paymentQR || STORE_INFO.paymentQR2) ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Mbank QR */}
              {STORE_INFO.paymentQR ? (
                <TouchableOpacity
                  onPress={() => openBank(STORE_INFO.paymentLink, 'Mbank')}
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: 16, overflow: 'hidden',
                    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: '#007A3D' }}
                >
                  <View style={{ backgroundColor: '#007A3D', paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>Mbank ELQR</Text>
                  </View>
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Image
                      source={{ uri: STORE_INFO.paymentQR }}
                      style={{ width: 140, height: 140, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ backgroundColor: '#005C2E', paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tapLabel}</Text>
                    <ChevronRight color="#fff" size={12} />
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* O! Business QR */}
              {STORE_INFO.paymentQR2 ? (
                <TouchableOpacity
                  onPress={() => openBank(STORE_INFO.paymentLink2, 'O! Business')}
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: 16, overflow: 'hidden',
                    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: '#E91E8C' }}
                >
                  <View style={{ backgroundColor: '#111111', paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#E91E8C', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>O! Business</Text>
                  </View>
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Image
                      source={{ uri: STORE_INFO.paymentQR2 }}
                      style={{ width: 140, height: 140, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ backgroundColor: '#E91E8C', paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tapLabel}</Text>
                    <ChevronRight color="#fff" size={12} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            /* QR yo'q bo'lsa — eski bank tugmalari */
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MbankLogo
                label={tapLabel}
                onPress={() => openBank(STORE_INFO.paymentLink, 'Mbank')}
              />
              <OBusinessLogo
                label={tapLabel}
                onPress={() => openBank(STORE_INFO.paymentLink2, 'O! Business')}
              />
            </View>
          )}
        </YStack>

        {/* ── Сепаратор ── */}
        <YStack height={1} backgroundColor={Colors.border} marginVertical={4} />

        {/* ── Чек жөнөтүү ── */}
        <YStack gap={12}>
          <Text fontSize={14} fontWeight="700" color={Colors.black}>
            {t('checkout.paymentAfterPay')}
          </Text>

          {/* WhatsApp баскычы */}
          <TouchableOpacity
            onPress={openWhatsApp}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#25D366',
              borderRadius: 16,
              height: 58,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              shadowColor: '#25D366',
              shadowOpacity: 0.45,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <MessageCircle color="#fff" size={24} />
            <YStack>
              <Text color="#fff" fontWeight="800" fontSize={16}>
                {t('checkout.paymentSendWhatsApp')}
              </Text>
              <Text color="rgba(255,255,255,0.8)" fontSize={11}>
                {isKy ? 'Чек жазылган, жибериңиз' : 'Чек уже написан, отправьте'}
              </Text>
            </YStack>
          </TouchableOpacity>

          {/* WhatsApp жиберилгенден кийин — кийинки баскыч */}
          {whatsappSent && (
            <TouchableOpacity
              onPress={goToSuccess}
              activeOpacity={0.85}
              style={{
                backgroundColor: Colors.yellow,
                borderRadius: 16,
                height: 54,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CircleCheck color={Colors.black} size={20} />
              <Text color={Colors.black} fontWeight="800" fontSize={15}>
                {isKy ? 'Чек жиберилди — улантуу' : 'Чек отправлен — продолжить'}
              </Text>
            </TouchableOpacity>
          )}
        </YStack>

      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default PaymentScreen;
