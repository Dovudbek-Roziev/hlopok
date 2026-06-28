import React, { useState } from 'react';
import { Share, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CircleCheck, Truck, House, MessageCircle, Package, Send, Share2, MapPin, Phone, User, X, CreditCard, Banknote } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { useStoreInfo } from '../../utils/useStoreInfo';
import { getSizeLabel } from '../../utils/sizeLabel';

const OrderSuccessScreen = () => {
  const Colors     = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const STORE_INFO  = useStoreInfo();

  const {
    orderNumber    = '',
    paymentMethod  = 'cash',
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

  const isOnline   = paymentMethod === 'online';
  const isDelivery = deliveryType === 'delivery';
  const isKy       = i18n.language === 'ky';


  const goHome = () => navigation.navigate('HomeTab');

  const shareReceipt = () => {
    const line = '─────────────────────';
    const itemLines = items.map((it: any) => {
      const name = isKy ? (it.name_ky || it.name_ru) : it.name_ru;
      const detail = `${getSizeLabel(it.size, isKy ? 'ky' : 'ru')}${it.color ? `, ${it.color}` : ''}`;
      return `• ${name} (${detail}) × ${it.qty}  —  ${formatPrice(it.price * it.qty)}`;
    }).join('\n');

    const text = [
      `${t('checkout.receiptHeader')} #${orderNumber}`,
      `Хлопок — ${t('checkout.storeTagline')}`,
      line,
      itemLines,
      line,
      subtotal !== total
        ? `${t('checkout.subtotal')}: ${formatPrice(subtotal)}`
        : null,
      bonusUsed > 0
        ? `${t('checkout.receiptBonusLabel')}: -${formatPrice(bonusUsed)}`
        : null,
      `${t('checkout.totalAmount')}: ${formatPrice(total)}`,
      isDelivery
        ? `${t('checkout.methodDelivery')}: ${deliveryAddress}`
        : `${t('checkout.methodPickup')}`,
      `${t('checkout.receiptPaymentLabel')}: ${isOnline ? t('checkout.paymentOnlineCard') : t('checkout.paymentCashLabel')}`,
      line,
      `${t('checkout.receiptRecipient')}: ${contactName}`,
      `${t('checkout.receiptPhone')}: ${contactPhone}`,
      note ? `${t('checkout.receiptNote')}: ${note}` : null,
      line,
      t('checkout.receiptThanks'),
      `Хлопок · ${STORE_INFO.phone}`,
    ].filter(Boolean).join('\n');

    Share.share({ message: text });
  };

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* ── Header ── */}
      <XStack paddingTop={50} paddingHorizontal={16} paddingBottom={10}
        justifyContent="flex-start" alignItems="center">
        <TouchableOpacity onPress={goHome}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
          <X color={Colors.black} size={18} />
        </TouchableOpacity>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>

        {/* ── Success ── */}
        <YStack alignItems="center" gap={10} paddingVertical={8}>
          <YStack width={76} height={76} borderRadius={38}
            backgroundColor={Colors.greenBg} alignItems="center" justifyContent="center">
            <CircleCheck color={Colors.green} size={44} fill={Colors.greenBg} />
          </YStack>
          <Text fontSize={22} fontWeight="700" color={Colors.black} textAlign="center">
            {t('checkout.orderSuccess')}
          </Text>
          <Text fontSize={14} color={Colors.gray} textAlign="center">
            {t('checkout.waitingConfirmationHint')}
          </Text>
        </YStack>

        {/* ── Receipt card ── */}
        <YStack backgroundColor={Colors.white} borderRadius={16} overflow="hidden"
          style={{ borderWidth: 1, borderColor: Colors.border }}>

          {/* Receipt header */}
          <XStack backgroundColor={Colors.black} padding={14} alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap={8}>
              <Package color={Colors.yellow} size={18} />
              <Text color={Colors.yellow} fontWeight="700" fontSize={15}>{t('checkout.receipt')}</Text>
            </XStack>
            <Text color="rgba(255,255,255,0.5)" fontSize={12} style={{ fontFamily: 'monospace' }}>
              #{orderNumber}
            </Text>
          </XStack>

          <YStack padding={16} gap={12}>

            {/* Contact */}
            <YStack gap={6}>
              <XStack alignItems="center" gap={8}>
                <User color={Colors.gray} size={14} />
                <Text fontSize={13} color={Colors.black} fontWeight="600">{contactName}</Text>
              </XStack>
              <XStack alignItems="center" gap={8}>
                <Phone color={Colors.gray} size={14} />
                <Text fontSize={13} color={Colors.gray}>{contactPhone}</Text>
              </XStack>
              {isDelivery && !!deliveryAddress && (
                <XStack alignItems="flex-start" gap={8}>
                  <MapPin color={Colors.blue} size={14} style={{ marginTop: 2 }} />
                  <Text fontSize={13} color={Colors.blue} flex={1}>{deliveryAddress}</Text>
                </XStack>
              )}
            </YStack>

            <YStack height={1} backgroundColor={Colors.border} />

            {/* Items */}
            {items.length > 0 && (
              <YStack gap={8}>
                {items.map((item: any, i: number) => (
                  <XStack key={i} justifyContent="space-between" alignItems="center" gap={8}>
                    <YStack flex={1}>
                      <Text fontSize={13} color={Colors.black} fontWeight="500" numberOfLines={1}>
                        {isKy ? (item.name_ky || item.name_ru) : item.name_ru}
                      </Text>
                      <Text fontSize={11} color={Colors.gray}>
                        {getSizeLabel(item.size, isKy ? 'ky' : 'ru')}{item.color ? ` · ${item.color}` : ''} · {item.qty} {t('common.pieces')}
                      </Text>
                    </YStack>
                    <Text fontSize={13} fontWeight="600" color={Colors.black}>
                      {formatPrice(item.price * item.qty)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}

            <YStack height={1} backgroundColor={Colors.border} />

            {/* Totals */}
            <YStack gap={6}>
              {subtotal !== total && (
                <XStack justifyContent="space-between">
                  <Text color={Colors.gray} fontSize={13}>{t('checkout.subtotal')}</Text>
                  <Text color={Colors.black} fontSize={13}>{formatPrice(subtotal)}</Text>
                </XStack>
              )}
              {bonusUsed > 0 && (
                <XStack justifyContent="space-between">
                  <Text color={Colors.gray} fontSize={13}>{t('checkout.bonusDiscount')}</Text>
                  <Text color={Colors.green} fontSize={13} fontWeight="600">-{formatPrice(bonusUsed)}</Text>
                </XStack>
              )}
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={15} fontWeight="700" color={Colors.black}>{t('checkout.totalAmount')}</Text>
                <Text fontSize={18} fontWeight="700" color={Colors.green}>{formatPrice(total)}</Text>
              </XStack>
            </YStack>

            <YStack height={1} backgroundColor={Colors.border} />

            {/* Delivery + Payment badges */}
            <XStack gap={8} flexWrap="wrap">
              <XStack backgroundColor={isDelivery ? Colors.blueBg : Colors.greenBg} borderRadius={8}
                padding={8} alignItems="center" gap={6}>
                {isDelivery
                  ? <Truck color={Colors.blue} size={14} />
                  : <MapPin color={Colors.green} size={14} />}
                <Text fontSize={12} color={isDelivery ? Colors.blue : Colors.green} fontWeight="600">
                  {isDelivery ? t('checkout.methodDelivery') : t('checkout.methodPickup')}
                </Text>
              </XStack>
              <XStack backgroundColor={isOnline ? Colors.blueBg : Colors.greenBg} borderRadius={8}
                padding={8} alignItems="center" gap={6}>
                {isOnline
                  ? <CreditCard color={Colors.blue} size={14} />
                  : <Banknote color={Colors.green} size={14} />}
                <Text fontSize={12} color={isOnline ? Colors.blue : Colors.green} fontWeight="600">
                  {isOnline ? t('checkout.paymentOnlineLabel') : t('checkout.paymentCashLabel')}
                </Text>
              </XStack>
            </XStack>

            {!!note && (
              <YStack backgroundColor={Colors.bg} borderRadius={10} padding={10}>
                <Text fontSize={12} color={Colors.gray} lineHeight={18}>{note}</Text>
              </YStack>
            )}
          </YStack>

          {/* Share receipt button */}
          <TouchableOpacity onPress={shareReceipt}
            style={{ margin: 16, marginTop: 0, backgroundColor: Colors.yellow,
              borderRadius: 12, height: 48, flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Share2 color={Colors.black} size={18} />
            <Text color={Colors.black} fontWeight="700" fontSize={14}>{t('checkout.shareReceipt')}</Text>
          </TouchableOpacity>
        </YStack>

        {/* ── Online payment: big WhatsApp pay button ── */}
        {/* ── Delivery contact ── */}
        {isDelivery && (() => {
          const waMsg = encodeURIComponent(
            t('checkout.deliveryWhatsAppMsg', { number: orderNumber, address: deliveryAddress })
          );
          return (
            <YStack backgroundColor={Colors.blueBg} borderRadius={16} padding={16} gap={12}
              style={{ borderWidth: 1, borderColor: Colors.blueBorder }}>
              <XStack alignItems="center" gap={10}>
                <YStack width={40} height={40} borderRadius={20} backgroundColor={Colors.blue}
                  alignItems="center" justifyContent="center">
                  <Truck color={Colors.white} size={20} />
                </YStack>
                <YStack flex={1}>
                  <Text fontWeight="700" fontSize={15} color={Colors.blue}>{t('checkout.deliverySuccessTitle')}</Text>
                  <Text color={Colors.grayDark} fontSize={13} marginTop={2}>{t('checkout.deliverySuccessMsg')}</Text>
                </YStack>
              </XStack>

              <YStack backgroundColor={Colors.white} borderRadius={12} padding={12}>
                <Text fontSize={15} fontWeight="700" color={Colors.black} letterSpacing={1} textAlign="center">
                  #{orderNumber}
                </Text>
              </YStack>

              <XStack gap={10}>
                <TouchableOpacity onPress={() => Linking.openURL(`${STORE_INFO.whatsapp}?text=${waMsg}`).catch(() => {})}
                  style={{ flex: 1, backgroundColor: '#25D366', borderRadius: 12, height: 50,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <MessageCircle color="#fff" size={18} />
                  <Text color="#fff" fontWeight="700" fontSize={14}>{t('checkout.sendReceiptWhatsApp')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(STORE_INFO.telegram).catch(() => {})}
                  style={{ flex: 1, backgroundColor: '#229ED9', borderRadius: 12, height: 50,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send color="#fff" size={16} />
                  <Text color="#fff" fontWeight="700" fontSize={14}>{t('checkout.sendReceiptTelegram')}</Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          );
        })()}

      </ScrollView>

      {/* ── Bottom buttons ── */}
      <YStack padding={16} gap={10} backgroundColor={Colors.white}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 8 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OrdersTab', { screen: 'Orders' })}
          style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 52,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Package color={Colors.black} size={18} />
          <Text fontWeight="700" color={Colors.black} fontSize={15}>{t('orders.title')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goHome}
          style={{ borderWidth: 2, borderColor: Colors.green, borderRadius: 14, height: 52,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <House color={Colors.green} size={18} />
          <Text fontWeight="700" color={Colors.green} fontSize={15}>{t('home.toHome')}</Text>
        </TouchableOpacity>
      </YStack>

    </YStack>
    </ScreenWrapper>
  );
};

export default OrderSuccessScreen;
