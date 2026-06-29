import React, { useState, useRef, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Input, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Clock, Star, Banknote, CreditCard, Truck, QrCode } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ordersApi } from '../../api/orders';
import { bonusApi } from '../../api/categories';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { useStoreInfo } from '../../utils/useStoreInfo';

type DeliveryMethod = 'pickup' | 'delivery';
type PaymentMethod  = 'cash' | 'online';

const CheckoutScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const isKy = i18n.language === 'ky';
  const navigation = useNavigation<any>();
  const { items, totalPrice, clearCart, totalItems } = useCartStore();
  const { user }   = useAuthStore();
  const STORE_INFO = useStoreInfo();

  const [method, setMethod]               = useState<DeliveryMethod>('pickup');
  const [payment, setPayment]             = useState<PaymentMethod>('cash');
  const [name, setName]                   = useState(user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [phone, setPhone]                 = useState(user?.phone || '');
  const submitting                         = useRef(false);
  const isMounted                          = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);
  const [deliveryAddress, setAddress]     = useState('');
  const [note, setNote]                   = useState('');
  const [useBonus, setUseBonus]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const { data: bonusSettings } = useQuery({
    queryKey: ['bonus-settings'],
    queryFn: () => bonusApi.getSettings().then(r => r.data.settings),
    staleTime: 10 * 60 * 1000,
  });
  const bonusPct = bonusSettings?.bonusPercent ?? 5;

  const subtotal    = totalPrice();
  const bonusApply  = useBonus ? Math.min(user?.bonusBalance || 0, subtotal) : 0;
  const total       = Math.max(0, subtotal - bonusApply);
  const bonusEarned = Math.floor(total * bonusPct / 100);

  const handleOrder = async () => {
    if (submitting.current) return;
    if (!name.trim() || !phone.trim()) {
      setError(t('cart.requiredFields'));
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError(t('checkout.contactPhone'));
      return;
    }
    if (method === 'delivery' && !deliveryAddress.trim()) {
      setError(t('checkout.addressRequired'));
      return;
    }
    setError('');
    setLoading(true);
    submitting.current = true;
    try {
      const res = await ordersApi.createOrder({
        items: items.map(i => ({
          productId:   i.productId,
          size:        i.size,
          color:       i.color,
          qty:         i.qty,
          promotionId: i.promotionId,
        })),
        contactName:     name.trim(),
        contactPhone:    phone.trim(),
        deliveryAddress: method === 'delivery' ? deliveryAddress.trim() : '',
        bonusUsed:       bonusApply,
        note:            note.slice(0, 100),
        deliveryMethod:  method,
        paymentMethod:   payment,
      });
      const order = res.data.order;
      clearCart();
      const params = {
        orderNumber:     order.orderNumber,
        orderId:         order._id,
        total,
        subtotal,
        bonusUsed:       bonusApply,
        deliveryType:    method,
        deliveryAddress: method === 'delivery' ? deliveryAddress.trim() : '',
        contactName:     name.trim(),
        contactPhone:    phone.trim(),
        note:            note.trim(),
        items:           order.items,
      };
      if (payment === 'online') {
        navigation.replace('Payment', params);
      } else {
        navigation.replace('OrderSuccess', { ...params, paymentMethod: 'cash' });
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.response?.data?.message || t('common.error'));
    } finally {
      submitting.current = false;
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenWrapper>
      <YStack flex={1} backgroundColor={Colors.bg}>

        {/* ── Header ── */}
        <YStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16}>
          <XStack alignItems="center" gap={12}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft color={Colors.black} size={24} />
            </TouchableOpacity>
            <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('checkout.title')}</Text>
          </XStack>
        </YStack>

        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">

          {/* ── Method selector ── */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={6}>
            <XStack>
              {(['pickup', 'delivery'] as DeliveryMethod[]).map(m => (
                <TouchableOpacity key={m} onPress={() => setMethod(m)}
                  style={{ flex: 1, borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', gap: 6,
                    backgroundColor: method === m ? Colors.yellow : 'transparent' }}>
                  {m === 'pickup'
                    ? <MapPin color={method === m ? Colors.black : Colors.gray} size={15} />
                    : <Truck color={method === m ? Colors.black : Colors.gray} size={15} />}
                  <Text fontWeight={method === m ? '700' : '400'} fontSize={14}
                    color={method === m ? Colors.black : Colors.gray}>
                    {m === 'pickup' ? t('checkout.methodPickup') : t('checkout.methodDelivery')}
                  </Text>
                </TouchableOpacity>
              ))}
            </XStack>
          </YStack>

          {/* ── Pickup info ── */}
          {method === 'pickup' && (
            <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={12}>
              <Text fontWeight="700" fontSize={14} color={Colors.black}>{t('checkout.pickup')}</Text>
              <XStack alignItems="flex-start" gap={10}>
                <YStack width={36} height={36} borderRadius={18} backgroundColor={Colors.bg}
                  alignItems="center" justifyContent="center">
                  <MapPin color={Colors.green} size={18} />
                </YStack>
                <YStack flex={1} justifyContent="center">
                  <Text color={Colors.black} fontSize={14} fontWeight="500">{STORE_INFO.address}</Text>
                </YStack>
              </XStack>
              <XStack alignItems="center" gap={10}>
                <YStack width={36} height={36} borderRadius={18} backgroundColor={Colors.bg}
                  alignItems="center" justifyContent="center">
                  <Clock color={Colors.green} size={18} />
                </YStack>
                <Text color={Colors.gray} fontSize={13}>{STORE_INFO.hours}</Text>
              </XStack>
            </YStack>
          )}

          {/* ── Delivery info + address ── */}
          {method === 'delivery' && (
            <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={12}>
              <XStack alignItems="flex-start" gap={12} backgroundColor={Colors.blueBg} borderRadius={12} padding={14}>
                <YStack width={40} height={40} borderRadius={20} backgroundColor={Colors.blueBorder}
                  alignItems="center" justifyContent="center" flexShrink={0}>
                  <Truck color={Colors.blue} size={20} />
                </YStack>
                <YStack flex={1} gap={4}>
                  <Text color={Colors.blue} fontSize={14} fontWeight="700">{t('checkout.deliveryTitle')}</Text>
                  <Text color={Colors.grayDark} fontSize={13} lineHeight={20}>
                    {t('checkout.deliveryInfoMsg')}
                  </Text>
                </YStack>
              </XStack>
              <YStack gap={6}>
                <Text fontSize={13} fontWeight="600" color={Colors.grayDark}>{t('checkout.deliveryAddress')}</Text>
                <Input
                  value={deliveryAddress}
                  onChangeText={(v: string) => { setAddress(v); setError(''); }}
                  placeholder={t('checkout.deliveryAddressPlaceholder')}
                  borderColor={error && !deliveryAddress.trim() ? Colors.red : Colors.border}
                  backgroundColor={Colors.bg}
                  borderRadius={12} height={50} paddingHorizontal="$4"
                />
              </YStack>
            </YStack>
          )}

          {/* ── Contact ── */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={12}>
            <Text fontWeight="700" fontSize={14} color={Colors.black}>{t('cart.contactData')}</Text>
            <Input value={name} onChangeText={(v: string) => { setName(v); setError(''); }}
              placeholder={t('checkout.contactName')}
              borderColor={error && !name.trim() ? Colors.red : Colors.border}
              backgroundColor={Colors.bg}
              borderRadius={12} height={50} paddingHorizontal="$4" />
            <Input value={phone} onChangeText={(v: string) => { setPhone(v); setError(''); }}
              placeholder="0XXX XX XX XX"
              keyboardType="phone-pad"
              maxLength={13}
              borderColor={error && !phone.trim() ? Colors.red : Colors.border}
              backgroundColor={Colors.bg}
              borderRadius={12} height={50} paddingHorizontal="$4" />
            {!!error && <Text color={Colors.red} fontSize={13}>{error}</Text>}
          </YStack>

          {/* ── Payment method ── */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={12}>
            <Text fontWeight="700" fontSize={14} color={Colors.black}>{t('checkout.paymentMethod')}</Text>
            <XStack gap={10}>
              {(['cash', 'online'] as PaymentMethod[]).map(p => {
                const isActive = payment === p;
                return (
                  <TouchableOpacity key={p} onPress={() => setPayment(p)}
                    style={{ flex: 1, borderRadius: 12, height: 54, alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 8,
                      backgroundColor: isActive ? (p === 'online' ? Colors.blueBg : Colors.greenBg) : Colors.bg,
                      borderWidth: 2,
                      borderColor: isActive ? (p === 'online' ? Colors.blue : Colors.green) : Colors.border }}>
                    {p === 'cash'
                      ? <Banknote color={isActive ? Colors.green : Colors.gray} size={18} />
                      : <CreditCard color={isActive ? Colors.blue : Colors.gray} size={18} />}
                    <Text fontWeight={isActive ? '700' : '400'} fontSize={14}
                      color={isActive ? (p === 'online' ? Colors.blue : Colors.green) : Colors.gray}>
                      {p === 'cash' ? t('checkout.paymentCashLabel') : t('checkout.paymentOnlineLabel')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </XStack>
            {payment === 'cash' && (
              <XStack backgroundColor={Colors.yellowBg} borderRadius={10} padding={12} alignItems="center" gap={10}>
                <Banknote color={Colors.brand} size={16} />
                <Text color={Colors.grayDark} fontSize={13} flex={1}>
                  {method === 'delivery' ? t('checkout.paymentDeliveryHint') : t('checkout.paymentPickupHint')}
                </Text>
              </XStack>
            )}
            {payment === 'online' && (
              <YStack backgroundColor={Colors.blueBg} borderRadius={12} padding={14} gap={10}
                style={{ borderWidth: 1, borderColor: Colors.blueBorder }}>
                <XStack alignItems="center" gap={8}>
                  <QrCode color={Colors.blue} size={16} />
                  <Text color={Colors.blue} fontSize={13} fontWeight="700">
                    {t('checkout.paymentOnlineHeader')}
                  </Text>
                </XStack>
                {!!STORE_INFO.paymentName && (
                  <XStack backgroundColor={Colors.white} borderRadius={10} padding={12} gap={8} alignItems="center"
                    style={{ borderWidth: 1, borderColor: Colors.blueBg }}>
                    <QrCode color={Colors.blue} size={22} />
                    <YStack flex={1}>
                      <Text color={Colors.gray} fontSize={11} fontWeight="600">
                        {t('checkout.paymentRecipientLabel')}
                      </Text>
                      <Text color={Colors.blue} fontSize={14} fontWeight="700">{STORE_INFO.paymentName}</Text>
                    </YStack>
                  </XStack>
                )}
                <Text color={Colors.grayDark} fontSize={12} lineHeight={18}>
                  {t('checkout.paymentSendReceiptHint')}
                </Text>
              </YStack>
            )}
          </YStack>

          {/* ── Bonus ── */}
          {(user?.bonusBalance || 0) > 0 && (
            <XStack backgroundColor={Colors.white} borderRadius={14} padding={16} alignItems="center" gap={12}>
              <YStack width={40} height={40} borderRadius={20} backgroundColor={Colors.yellow}
                alignItems="center" justifyContent="center">
                <Star color={Colors.black} size={18} fill={Colors.black} />
              </YStack>
              <YStack flex={1}>
                <Text fontWeight="600" color={Colors.black} fontSize={14}>{t('checkout.useBonus')}</Text>
                <Text color={Colors.gray} fontSize={12}>
                  {t('checkout.availableBonus')}: {formatPrice(user?.bonusBalance || 0)}
                </Text>
              </YStack>
              <TouchableOpacity onPress={() => setUseBonus(!useBonus)}
                style={{ width: 50, height: 28, borderRadius: 14,
                  backgroundColor: useBonus ? Colors.green : Colors.grayLight,
                  alignItems: useBonus ? 'flex-end' : 'flex-start',
                  paddingHorizontal: 3, justifyContent: 'center' }}>
                <YStack width={22} height={22} borderRadius={11} backgroundColor={Colors.white} />
              </TouchableOpacity>
            </XStack>
          )}

          {/* ── Note ── */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={8}>
            <Text fontWeight="700" fontSize={14} color={Colors.black}>{t('checkout.note')}</Text>
            <Input value={note} onChangeText={(v: string) => setNote(v.slice(0, 100))}
              placeholder={t('cart.notePlaceholder')}
              multiline numberOfLines={3}
              borderColor={Colors.border} backgroundColor={Colors.bg}
              borderRadius={12} padding="$4" />
            <Text color={Colors.gray} fontSize={11} textAlign="right">{note.length}/100</Text>
          </YStack>

          {/* ── Summary ── */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={10}>
            <XStack justifyContent="space-between">
              <Text color={Colors.grayDark} fontSize={14}>{t('checkout.subtotal')} ({totalItems()})</Text>
              <Text color={Colors.black} fontSize={14}>{formatPrice(subtotal)}</Text>
            </XStack>
            {bonusApply > 0 && (
              <XStack justifyContent="space-between">
                <Text color={Colors.grayDark} fontSize={14}>{t('checkout.bonusDiscount')}</Text>
                <Text color={Colors.green} fontSize={14}>-{formatPrice(bonusApply)}</Text>
              </XStack>
            )}
            <XStack justifyContent="space-between">
              <Text color={Colors.green} fontSize={13}>{t('checkout.bonusWillEarn')} (+{bonusPct}%)</Text>
              <Text color={Colors.green} fontSize={13}>+{formatPrice(bonusEarned)}</Text>
            </XStack>
            <YStack height={1} backgroundColor={Colors.border} />
            <XStack justifyContent="space-between">
              <Text fontSize={16} fontWeight="700" color={Colors.black}>{t('checkout.totalAmount')}</Text>
              <Text fontSize={16} fontWeight="700" color={Colors.black}>{formatPrice(total)}</Text>
            </XStack>
          </YStack>

        </ScrollView>

        {/* ── Order button ── */}
        <YStack padding={16} backgroundColor={Colors.white}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 8 }}>
          <TouchableOpacity onPress={handleOrder} disabled={loading}
            style={{ backgroundColor: Colors.yellow,
              borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            {loading
              ? <Spinner color={Colors.black} />
              : <>
                  {method === 'delivery' && <Truck color={Colors.black} size={18} />}
                  <Text fontWeight="700" color={Colors.black} fontSize={16}>
                    {method === 'delivery' ? t('checkout.placeDeliveryOrder') : t('checkout.placeOrder')}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </YStack>
      </YStack>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default CheckoutScreen;
