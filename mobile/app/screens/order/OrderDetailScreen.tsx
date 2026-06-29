import React, { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, Modal, Share } from 'react-native';
import { YStack, XStack, Text, Spinner, Image } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, CircleX, Star, Truck, Package, Check, Receipt, Share2, X, CreditCard } from 'lucide-react-native';
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

// ─── Чек модал / Receipt modal ────────────────────────────────────────────────
const ReceiptModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
  const Colors       = useColors();
  const { t, i18n } = useTranslation();
  const lang         = i18n.language === 'ky' ? 'ky' : 'ru';

  const handleShare = async () => {
    const lines: string[] = [];
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`${t('checkout.receiptHeader')} — ХЛОПОК`);
    lines.push(`${t('checkout.storeTagline')}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`# ${order.orderNumber}`);
    lines.push(`${formatDateTime(order.createdAt)}`);
    lines.push('');
    lines.push(`${t('checkout.receiptRecipient')}: ${order.contactName || ''}`);
    lines.push(`${t('checkout.receiptPhone')}: ${order.contactPhone || ''}`);
    lines.push('');
    lines.push(`${t('orders.productsLabel')}:`);
    (order.items || []).forEach((item: any) => {
      const name = item[`name_${lang}`] || item.name_ru || '';
      lines.push(`  • ${name} (${getSizeLabel(item.size, lang)}) ×${item.qty} — ${formatPrice(item.price * item.qty)}`);
    });
    lines.push('');
    if (order.bonusUsed > 0) {
      lines.push(`${t('checkout.receiptBonus')}: -${formatPrice(order.bonusUsed)}`);
    }
    lines.push(`${t('checkout.totalAmount')}: ${formatPrice(order.total)}`);
    lines.push(`${t('checkout.receiptPaymentLabel')}: ${order.paymentMethod === 'online' ? t('checkout.paymentOnlineCard') : t('checkout.paymentCash')}`);
    lines.push('');
    lines.push(t('checkout.receiptThanks'));
    lines.push('━━━━━━━━━━━━━━━━━━━━');

    await Share.share({ message: lines.join('\n') });
  };

  const isDelivery = order.deliveryType === 'delivery';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.5)" justifyContent="flex-end">
        <YStack backgroundColor={Colors.white} borderTopLeftRadius={24} borderTopRightRadius={24}
          paddingBottom={40} maxHeight="90%">

          {/* Modal header */}
          <XStack paddingHorizontal={20} paddingTop={20} paddingBottom={12}
            justifyContent="space-between" alignItems="center"
            borderBottomWidth={1} borderBottomColor={Colors.border}>
            <Text fontSize={17} fontWeight="700" color={Colors.black}>{t('checkout.receipt')}</Text>
            <TouchableOpacity onPress={onClose}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg,
                alignItems: 'center', justifyContent: 'center' }}>
              <X color={Colors.gray} size={18} />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 0 }}>

            {/* Store header */}
            <YStack alignItems="center" paddingVertical={16} gap={4}
              borderBottomWidth={1} borderBottomColor={Colors.border} marginBottom={16}>
              <Text fontSize={22} fontWeight="800" color={Colors.black} letterSpacing={2}>ХЛОПОК</Text>
              <Text fontSize={12} color={Colors.gray}>{t('checkout.storeTagline')}</Text>
              <YStack height={1} width={60} backgroundColor={Colors.yellow} marginTop={8} />
            </YStack>

            {/* Order info */}
            <YStack gap={6} marginBottom={16}>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('orders.ordersTitle') || 'Буйрутма'}</Text>
                <Text fontSize={13} fontWeight="600" color={Colors.black}>{order.orderNumber}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('orders.date') || 'Дата'}</Text>
                <Text fontSize={13} color={Colors.black}>{formatDateTime(order.createdAt)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('checkout.receiptRecipient')}</Text>
                <Text fontSize={13} color={Colors.black}>{order.contactName || '—'}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('checkout.receiptPhone')}</Text>
                <Text fontSize={13} color={Colors.black}>{order.contactPhone || '—'}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{isDelivery ? t('checkout.methodDelivery') : t('checkout.pickup')}</Text>
                <Text fontSize={13} color={Colors.black}>
                  {isDelivery ? (order.deliveryAddress || '—') : t('checkout.pickupShort')}
                </Text>
              </XStack>
            </YStack>

            {/* Divider */}
            <YStack borderStyle="dashed" borderTopWidth={1} borderTopColor={Colors.border} marginBottom={16} />

            {/* Items */}
            <YStack gap={10} marginBottom={16}>
              {(order.items || []).map((item: any, i: number) => (
                <XStack key={i} gap={10} alignItems="center">
                  {item.image
                    ? <Image source={{ uri: item.image }} width={44} height={44} borderRadius={8} resizeMode="cover" />
                    : <YStack width={44} height={44} borderRadius={8} backgroundColor={Colors.grayLight}
                        alignItems="center" justifyContent="center">
                        <Package color={Colors.gray} size={18} />
                      </YStack>
                  }
                  <YStack flex={1}>
                    <Text fontSize={13} fontWeight="600" color={Colors.black} numberOfLines={2}>
                      {item[`name_${lang}`] || item.name_ru}
                    </Text>
                    <Text fontSize={11} color={Colors.gray}>
                      {getSizeLabel(item.size, lang)} × {item.qty}
                    </Text>
                  </YStack>
                  <Text fontSize={13} fontWeight="700" color={Colors.green}>
                    {formatPrice(item.price * item.qty)}
                  </Text>
                </XStack>
              ))}
            </YStack>

            {/* Divider */}
            <YStack borderStyle="dashed" borderTopWidth={1} borderTopColor={Colors.border} marginBottom={16} />

            {/* Totals */}
            <YStack gap={8} marginBottom={16}>
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('checkout.subtotal')}</Text>
                <Text fontSize={13} color={Colors.black}>{formatPrice(order.subtotal)}</Text>
              </XStack>
              {order.bonusUsed > 0 && (
                <XStack justifyContent="space-between">
                  <Text fontSize={13} color={Colors.gray}>{t('checkout.receiptBonus')}</Text>
                  <Text fontSize={13} color={Colors.green}>-{formatPrice(order.bonusUsed)}</Text>
                </XStack>
              )}
              <XStack justifyContent="space-between">
                <Text fontSize={13} color={Colors.gray}>{t('checkout.receiptPaymentLabel')}</Text>
                <Text fontSize={13} color={Colors.black}>
                  {order.paymentMethod === 'online' ? t('checkout.paymentOnlineCard') : t('checkout.paymentCash')}
                </Text>
              </XStack>
              <YStack height={1} backgroundColor={Colors.border} />
              <XStack justifyContent="space-between">
                <Text fontSize={16} fontWeight="700" color={Colors.black}>{t('checkout.totalAmount')}</Text>
                <Text fontSize={16} fontWeight="700" color={Colors.black}>{formatPrice(order.total)}</Text>
              </XStack>
            </YStack>

            {/* Thanks */}
            <YStack alignItems="center" paddingVertical={12} gap={4}>
              <YStack height={1} width={60} backgroundColor={Colors.yellow} marginBottom={8} />
              <Text fontSize={13} color={Colors.gray} textAlign="center">{t('checkout.receiptThanks')}</Text>
            </YStack>

          </ScrollView>

          {/* Share button */}
          <YStack paddingHorizontal={20} paddingTop={12}>
            <TouchableOpacity onPress={handleShare}
              style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 52,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Share2 color={Colors.black} size={18} />
              <Text fontWeight="700" color={Colors.black} fontSize={15}>{t('checkout.shareReceipt')}</Text>
            </TouchableOpacity>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
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
  const [cancelling, setCancelling]     = useState(false);
  const [showReceipt, setShowReceipt]   = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id).then(r => r.data.order),
  });

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
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
          <YStack backgroundColor={Colors.redBg} borderRadius={12} padding={16} gap={10}>
            <XStack alignItems="flex-start" gap={12}>
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
            {order.paymentMethod === 'online' && (
              <XStack backgroundColor="rgba(255,255,255,0.6)" borderRadius={10} padding={12}
                alignItems="flex-start" gap={10}>
                <CreditCard color={Colors.red} size={18} style={{ marginTop: 1 }} />
                <Text fontSize={13} color={Colors.red} flex={1} lineHeight={20}>
                  {t('orders.cancelledRefundNote')}
                </Text>
              </XStack>
            )}
          </YStack>
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

        {/* Receipt buttons */}
        <XStack gap={10}>
          <TouchableOpacity onPress={() => setShowReceipt(true)} style={{ flex: 1 }}>
            <XStack backgroundColor={Colors.white} borderRadius={12} height={48} borderWidth={1.5}
              borderColor={Colors.border} alignItems="center" justifyContent="center" gap={8}>
              <Receipt color={Colors.black} size={16} />
              <Text fontWeight="600" color={Colors.black} fontSize={14}>{t('checkout.viewReceipt')}</Text>
            </XStack>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              const lines: string[] = [];
              lines.push('━━━━━━━━━━━━━━━━━━━━');
              lines.push(`${t('checkout.receiptHeader')} — ХЛОПОК`);
              lines.push('━━━━━━━━━━━━━━━━━━━━');
              lines.push(`# ${order.orderNumber}`);
              lines.push(`${formatDateTime(order.createdAt)}`);
              lines.push('');
              (order.items || []).forEach((item: any) => {
                const name = item[`name_${lang}`] || item.name_ru || '';
                lines.push(`• ${name} (${getSizeLabel(item.size, lang)}) ×${item.qty} — ${formatPrice(item.price * item.qty)}`);
              });
              lines.push('');
              if (order.bonusUsed > 0) lines.push(`${t('checkout.receiptBonus')}: -${formatPrice(order.bonusUsed)}`);
              lines.push(`${t('checkout.totalAmount')}: ${formatPrice(order.total)}`);
              lines.push(t('checkout.receiptThanks'));
              lines.push('━━━━━━━━━━━━━━━━━━━━');
              await Share.share({ message: lines.join('\n') });
            }}
            style={{ flex: 1 }}
          >
            <XStack backgroundColor={Colors.yellow} borderRadius={12} height={48}
              alignItems="center" justifyContent="center" gap={8}>
              <Share2 color={Colors.black} size={16} />
              <Text fontWeight="600" color={Colors.black} fontSize={14}>{t('checkout.shareReceipt')}</Text>
            </XStack>
          </TouchableOpacity>
        </XStack>

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

    {showReceipt && order && (
      <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />
    )}

    {/* Cancel confirmation modal */}
    {showCancelModal && order && (
      <Modal visible animationType="slide" transparent onRequestClose={() => setShowCancelModal(false)}>
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.5)" justifyContent="flex-end">
          <YStack backgroundColor={Colors.white} borderTopLeftRadius={24} borderTopRightRadius={24}
            padding={24} paddingBottom={40} gap={20}>

            {/* Icon */}
            <YStack alignItems="center" gap={12}>
              <YStack width={64} height={64} borderRadius={32} backgroundColor={Colors.redBg}
                alignItems="center" justifyContent="center">
                <CircleX color={Colors.red} size={34} />
              </YStack>
              <Text fontSize={18} fontWeight="800" color={Colors.black} textAlign="center">
                {t('orders.cancelTitle')}
              </Text>
            </YStack>

            {/* Online payment warning */}
            {order.paymentMethod === 'online' ? (
              <YStack backgroundColor={Colors.redBg} borderRadius={14} padding={16} gap={10}>
                <XStack alignItems="center" gap={8}>
                  <CreditCard color={Colors.red} size={20} />
                  <Text fontSize={14} fontWeight="700" color={Colors.red}>
                    {t('checkout.paymentOnlineHeader')}
                  </Text>
                </XStack>
                <Text fontSize={13} color={Colors.red} lineHeight={20}>
                  {t('orders.cancelConfirmOnline')}
                </Text>
              </YStack>
            ) : (
              <YStack backgroundColor={Colors.bg} borderRadius={14} padding={16}>
                <Text fontSize={14} color={Colors.grayDark} lineHeight={22} textAlign="center">
                  {t('orders.cancelConfirm')}
                </Text>
              </YStack>
            )}

            {/* Buttons */}
            <YStack gap={10}>
              <TouchableOpacity onPress={confirmCancel}
                style={{ backgroundColor: Colors.red, borderRadius: 14, height: 52,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CircleX color={Colors.white} size={18} />
                <Text fontWeight="700" color={Colors.white} fontSize={15}>{t('orders.cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}
                style={{ backgroundColor: Colors.bg, borderRadius: 14, height: 52,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border }}>
                <Text fontWeight="600" color={Colors.black} fontSize={15}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </YStack>

          </YStack>
        </YStack>
      </Modal>
    )}

    </ScreenWrapper>
  );
};

export default OrderDetailScreen;
