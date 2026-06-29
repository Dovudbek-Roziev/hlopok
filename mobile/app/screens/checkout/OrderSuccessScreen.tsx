import React from 'react';
import { TouchableOpacity, Linking } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { CircleCheck, Package, House, MessageCircle, Send, Truck, CreditCard } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { useStoreInfo } from '../../utils/useStoreInfo';

const OrderSuccessScreen = () => {
  const Colors     = useColors();
  const { t }      = useTranslation();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const STORE_INFO = useStoreInfo();

  const {
    orderNumber   = '',
    paymentMethod = 'cash',
    total         = 0,
    deliveryType  = 'pickup',
    deliveryAddress = '',
  } = route.params || {};

  const isOnline   = paymentMethod === 'online';
  const isDelivery = deliveryType === 'delivery';

  const resetAndGo = (tabName: string) => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Cart' }] }));
    navigation.getParent()?.navigate(tabName);
  };

  const waPayMsg = encodeURIComponent(
    t('checkout.paymentWhatsAppMsg', { number: orderNumber, amount: formatPrice(total) })
  );
  const waDelivMsg = encodeURIComponent(
    t('checkout.deliveryWhatsAppMsg', { number: orderNumber, address: deliveryAddress })
  );

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg} justifyContent="space-between">

      {/* ── Body ── */}
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={24} gap={20}>

        {/* Icon */}
        <YStack width={96} height={96} borderRadius={48}
          backgroundColor={Colors.greenBg} alignItems="center" justifyContent="center">
          <CircleCheck color={Colors.green} size={56} fill={Colors.greenBg} />
        </YStack>

        {/* Title */}
        <YStack alignItems="center" gap={8}>
          <Text fontSize={24} fontWeight="800" color={Colors.black} textAlign="center">
            {t('checkout.orderSuccess')}
          </Text>
          <Text fontSize={14} color={Colors.gray} textAlign="center" lineHeight={20}>
            {t('checkout.thankYou')}
          </Text>
        </YStack>

        {/* Order number badge */}
        <YStack backgroundColor={Colors.white} borderRadius={14} paddingHorizontal={24} paddingVertical={12}
          style={{ borderWidth: 1, borderColor: Colors.border }}>
          <Text color={Colors.gray} fontSize={12} textAlign="center" marginBottom={2}>
            {t('checkout.orderNumber')}
          </Text>
          <Text fontSize={20} fontWeight="800" color={Colors.black} textAlign="center"
            style={{ fontFamily: 'monospace', letterSpacing: 1 }}>
            #{orderNumber}
          </Text>
        </YStack>

        {/* Online payment notice */}
        {isOnline && (
          <YStack backgroundColor={Colors.blueBg} borderRadius={14} padding={16} gap={12} width="100%"
            style={{ borderWidth: 1, borderColor: Colors.blueBorder }}>
            <XStack alignItems="center" gap={10}>
              <CreditCard color={Colors.blue} size={20} />
              <Text fontSize={14} fontWeight="700" color={Colors.blue} flex={1}>
                {t('checkout.paymentOnlineHeader')}
              </Text>
            </XStack>
            <Text fontSize={13} color={Colors.grayDark} lineHeight={18}>
              {t('checkout.paymentOnlineHint')}
            </Text>
            <XStack gap={10}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`${STORE_INFO.whatsapp}?text=${waPayMsg}`).catch(() => {})}
                style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 12, height: 46,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MessageCircle color="#fff" size={16} />
                <Text color="#fff" fontWeight="700" fontSize={13}>{t('checkout.payNowWhatsApp')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL(STORE_INFO.telegram).catch(() => {})}
                style={{ flex: 1, backgroundColor: '#229ED9', borderRadius: 12, height: 46,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send color="#fff" size={14} />
                <Text color="#fff" fontWeight="700" fontSize={13}>Telegram</Text>
              </TouchableOpacity>
            </XStack>
          </YStack>
        )}

        {/* Delivery notice */}
        {isDelivery && (
          <YStack backgroundColor={Colors.blueBg} borderRadius={14} padding={16} gap={12} width="100%"
            style={{ borderWidth: 1, borderColor: Colors.blueBorder }}>
            <XStack alignItems="center" gap={10}>
              <Truck color={Colors.blue} size={20} />
              <Text fontSize={14} fontWeight="700" color={Colors.blue} flex={1}>
                {t('checkout.deliverySuccessTitle')}
              </Text>
            </XStack>
            <Text fontSize={13} color={Colors.grayDark} lineHeight={18}>
              {t('checkout.deliverySuccessMsg')}
            </Text>
            <XStack gap={10}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`${STORE_INFO.whatsapp}?text=${waDelivMsg}`).catch(() => {})}
                style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 12, height: 46,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MessageCircle color="#fff" size={16} />
                <Text color="#fff" fontWeight="700" fontSize={13}>{t('checkout.sendReceiptWhatsApp')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL(STORE_INFO.telegram).catch(() => {})}
                style={{ flex: 1, backgroundColor: '#229ED9', borderRadius: 12, height: 46,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send color="#fff" size={14} />
                <Text color="#fff" fontWeight="700" fontSize={13}>Telegram</Text>
              </TouchableOpacity>
            </XStack>
          </YStack>
        )}

      </YStack>

      {/* ── Bottom buttons ── */}
      <YStack padding={16} gap={10} backgroundColor={Colors.white}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 8 }}>
        <TouchableOpacity
          onPress={() => resetAndGo('OrdersTab')}
          style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Package color={Colors.black} size={18} />
          <Text fontWeight="700" color={Colors.black} fontSize={16}>{t('orders.title')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => resetAndGo('HomeTab')}
          style={{ borderWidth: 2, borderColor: Colors.border, borderRadius: 14, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <House color={Colors.grayDark} size={18} />
          <Text fontWeight="700" color={Colors.grayDark} fontSize={16}>{t('home.toHome')}</Text>
        </TouchableOpacity>
      </YStack>

    </YStack>
    </ScreenWrapper>
  );
};

export default OrderSuccessScreen;
