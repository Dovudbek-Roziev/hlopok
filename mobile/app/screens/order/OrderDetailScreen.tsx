import React, { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Spinner, Image } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, CircleX, Star, Truck, Package, Check } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ordersApi } from '../../api/orders';
import { useColors } from '../../theme/useColors';
import { formatPrice, formatDateTime } from '../../utils/format';
import { useStoreInfo } from '../../utils/useStoreInfo';
import { getSizeLabel } from '../../utils/sizeLabel';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#FF9800',
  confirmed: '#2196F3',
  preparing: '#9C27B0',
  ready:     '#2D8653',
  cancelled: '#E53935',
};

const OrderDetailScreen = () => {
  const Colors       = useColors();
  const { t, i18n } = useTranslation();
  const navigation   = useNavigation<any>();
  const route        = useRoute<any>();
  const queryClient  = useQueryClient();
  const { id }       = route.params;
  const lang         = i18n.language === 'ky' ? 'ky' : 'ru';

  const storeInfo    = useStoreInfo();
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id).then(r => r.data.order),
  });

  const handleCancel = () => {
    Alert.alert(
      t('orders.cancelTitle'),
      t('orders.cancelConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('orders.cancelBtn'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await ordersApi.cancelOrder(id);
              queryClient.invalidateQueries({ queryKey: ['order', id] });
              queryClient.invalidateQueries({ queryKey: ['my-orders'] });
            } catch {
              Alert.alert(t('common.error'), t('orders.cancelError'));
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack>;
  }
  if (isError || !order) {
    return (
      <ScreenWrapper>
      <YStack flex={1} backgroundColor={Colors.bg}>
        <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.black} size={24} />
          </TouchableOpacity>
        </XStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Text color={Colors.gray}>{t('common.error')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}>
            <Text fontWeight="700" color={Colors.black}>{t('common.back')}</Text>
          </TouchableOpacity>
        </YStack>
      </YStack>
      </ScreenWrapper>
    );
  }

  const statusIndex = STATUSES.indexOf(order.status);
  const canCancel   = order.status === 'pending';
  const isDelivery  = order.deliveryType === 'delivery';

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      {/* Header */}
      <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="bold" color={Colors.black}>{order.orderNumber}</Text>
          <Text fontSize={12} color={Colors.gray}>{formatDateTime(order.createdAt)}</Text>
        </YStack>
        <YStack backgroundColor={STATUS_COLORS[order.status] + '22'} borderRadius={8} paddingHorizontal={10} paddingVertical={4}>
          <Text color={STATUS_COLORS[order.status]} fontSize={12} fontWeight="600">
            {t(`orders.status_${order.status}`)}
          </Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 24 }}>

        {/* Status timeline */}
        {order.status !== 'cancelled' && (
          <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={12}>
            <Text fontWeight="bold" color={Colors.black} fontSize={15}>{t('orders.statusTitle')}</Text>
            {STATUSES.map((s, i) => (
              <XStack key={s} alignItems="center" gap={12}>
                <YStack width={24} height={24} borderRadius={12}
                  backgroundColor={i <= statusIndex ? Colors.green : Colors.grayLight}
                  alignItems="center" justifyContent="center">
                  {i <= statusIndex && <Check color="white" size={12} />}
                </YStack>
                <Text color={i <= statusIndex ? Colors.black : Colors.gray}>
                  {t(`orders.status_${s}`)}
                </Text>
              </XStack>
            ))}
            {(() => {
              const lastComment = [...(order.statusHistory || [])]
                .reverse()
                .find((h: any) => h.comment?.trim());
              if (!lastComment) return null;
              return (
                <YStack backgroundColor={Colors.bg} borderRadius={8} padding={10} marginTop={4}>
                  <Text fontSize={12} color={Colors.gray} marginBottom={2}>
                    {t('orders.adminComment')}
                  </Text>
                  <Text fontSize={13} color={Colors.black}>{lastComment.comment}</Text>
                </YStack>
              );
            })()}
          </YStack>
        )}

        {/* Cancelled card */}
        {order.status === 'cancelled' && (
          <XStack backgroundColor={Colors.redBg} borderRadius={12} padding={16} alignItems="flex-start" gap={12}>
            <CircleX color={Colors.red} size={20} />
            <YStack flex={1} gap={4}>
              <Text fontWeight="700" color={Colors.red} fontSize={14}>{t('orders.cancelledTitle')}</Text>
              {order.cancelReason ? (
                <Text color={Colors.grayDark} fontSize={13}>{order.cancelReason}</Text>
              ) : null}
              {order.bonusUsed > 0 && (
                <Text color={Colors.green} fontSize={13}>
                  +{formatPrice(order.bonusUsed)} {t('orders.bonusRefunded')}
                </Text>
              )}
            </YStack>
          </XStack>
        )}

        {/* Delivery / Pickup */}
        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={8}>
          <Text fontWeight="bold" fontSize={15} color={Colors.black}>
            {isDelivery ? t('checkout.methodDelivery') : t('checkout.pickup')}
          </Text>
          <XStack alignItems="flex-start" gap={8}>
            {isDelivery ? <Truck color={Colors.blue} size={16} /> : <MapPin color={Colors.green} size={16} />}
            <Text color={isDelivery ? Colors.black : Colors.grayDark} flex={1}>
              {isDelivery
                ? (order.deliveryAddress || t('checkout.deliveryInfoMsg'))
                : (storeInfo.address || t('checkout.pickupAddress'))}
            </Text>
          </XStack>
        </YStack>

        {/* Items */}
        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={12}>
          <Text fontWeight="bold" fontSize={15} color={Colors.black}>{t('orders.productsLabel')}</Text>
          {(order.items || []).map((item: any, i: number) => (
            <XStack key={i} gap={12} alignItems="center">
              {item.image
                ? <Image source={{ uri: item.image }} width={60} height={60} borderRadius={8} resizeMode="cover" />
                : <YStack width={60} height={60} borderRadius={8} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={24} /></YStack>
              }
              <YStack flex={1} gap={4}>
                <Text numberOfLines={2} fontSize={14} color={Colors.black}>{item[`name_${lang}`]}</Text>
                <Text color={Colors.gray} fontSize={12}>{getSizeLabel(item.size, lang)} · ×{item.qty}</Text>
                <Text fontWeight="bold" color={Colors.green}>{formatPrice(item.price * item.qty)}</Text>
              </YStack>
            </XStack>
          ))}
        </YStack>

        {/* Price summary */}
        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={8}>
          <XStack justifyContent="space-between">
            <Text color={Colors.grayDark}>{t('checkout.subtotal')}</Text>
            <Text color={Colors.black}>{formatPrice(order.subtotal)}</Text>
          </XStack>
          {order.bonusUsed > 0 && (
            <XStack justifyContent="space-between">
              <Text color={Colors.grayDark}>{t('checkout.bonusDiscount')}</Text>
              <Text color={Colors.green}>-{formatPrice(order.bonusUsed)}</Text>
            </XStack>
          )}
          {order.bonusEarned > 0 && order.status !== 'cancelled' && (
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap={4}>
                <Star color={Colors.green} size={13} fill={Colors.green} />
                <Text color={Colors.green} fontSize={13}>{t('orders.bonusEarned')}</Text>
              </XStack>
              <Text color={Colors.green} fontSize={13}>
                {order.status === 'ready'
                  ? `+${formatPrice(order.bonusEarned)}`
                  : t('orders.bonusEarnedAfterReady')}
              </Text>
            </XStack>
          )}
          <YStack height={1} backgroundColor={Colors.border} />
          <XStack justifyContent="space-between">
            <Text fontWeight="bold" fontSize={16} color={Colors.black}>{t('checkout.totalAmount')}</Text>
            <Text fontWeight="bold" fontSize={16} color={Colors.black}>{formatPrice(order.total)}</Text>
          </XStack>
        </YStack>

        {/* Cancel button */}
        {canCancel && (
          <TouchableOpacity onPress={handleCancel} disabled={cancelling}
            style={{ backgroundColor: Colors.redBg, borderRadius: 12, height: 52, borderWidth: 1.5, borderColor: Colors.red,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {cancelling
              ? <Spinner color={Colors.red} />
              : <>
                  <CircleX color={Colors.red} size={18} />
                  <Text fontWeight="700" color={Colors.red} fontSize={15}>{t('orders.cancelBtn')}</Text>
                </>
            }
          </TouchableOpacity>
        )}

      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default OrderDetailScreen;
