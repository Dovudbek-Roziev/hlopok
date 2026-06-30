import React, { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Spinner, Image } from 'tamagui';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import { ordersApi } from '../../api/orders';
import { useColors } from '../../theme/useColors';
import { formatPrice, formatDate } from '../../utils/format';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FFF3DC', text: '#E6A800' },
  confirmed: { bg: '#DCF0FF', text: '#0077CC' },
  preparing: { bg: '#F0DCFF', text: '#7700CC' },
  ready:     { bg: '#DCFFE8', text: '#00A63E' },
  cancelled: { bg: '#FFE5E5', text: '#CC0000' },
};

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'];

const OrdersScreen = () => {
  const Colors = useColors();
  const { t }      = useTranslation();
  const navigation = useNavigation<any>();
  const [filterOpen, setFilterOpen]     = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders().then(r => r.data.orders),
  });

  const allOrders = data || [];
  const orders = statusFilter ? allOrders.filter((o: any) => o.status === statusFilter) : allOrders;

  if (isLoading) {
    return <ScreenWrapper><YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack></ScreenWrapper>;
  }

  if (isError) {
    return (
      <ScreenWrapper>
        <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center" gap={12} padding={32}>
          <Text fontSize={16} color={Colors.gray} textAlign="center">{t('common.error')}</Text>
          <TouchableOpacity onPress={() => refetch()}
            style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text fontWeight="700" color={Colors.black}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </YStack>
      </ScreenWrapper>
    );
  }

  if (allOrders.length === 0) {
    return (
      <ScreenWrapper>
        <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center" gap={14} padding={32}>
          <Package color={Colors.grayLight} size={80} />
          <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('orders.empty')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab')}
            style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text fontWeight="700" color={Colors.black}>{t('cart.goToCatalog')}</Text>
          </TouchableOpacity>
        </YStack>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* ── Top bar ── */}
      <XStack backgroundColor={Colors.bg} paddingTop={52} paddingHorizontal={16} paddingBottom={6}
        alignItems="center" justifyContent="center">
        <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('orders.title')}</Text>
      </XStack>

      {/* ── Subheader ── */}
      <XStack backgroundColor={Colors.bg} paddingHorizontal={20} paddingBottom={filterOpen ? 6 : 14}
        justifyContent="space-between" alignItems="center">
        <Text color={Colors.gray} fontSize={13}>
          {t('orders.total')}: {allOrders.length}
        </Text>
        <TouchableOpacity onPress={() => setFilterOpen(v => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 12, paddingVertical: 6,
          backgroundColor: statusFilter ? Colors.yellow : Colors.white, borderRadius: 10,
          borderWidth: 1, borderColor: statusFilter ? Colors.yellow : Colors.border }}>
          <SlidersHorizontal color={statusFilter ? Colors.black : Colors.grayDark} size={14} />
          <Text color={statusFilter ? Colors.black : Colors.grayDark} fontSize={13} fontWeight={statusFilter ? '700' : '400'}>
            {t('orders.filter')}
          </Text>
        </TouchableOpacity>
      </XStack>

      {/* ── Status filter chips ── */}
      {filterOpen && (
        <YStack paddingBottom={14}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all', ...STATUSES]}
            keyExtractor={s => s}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            renderItem={({ item: s }) => {
              const active = s === 'all' ? !statusFilter : statusFilter === s;
              return (
                <TouchableOpacity
                  onPress={() => setStatusFilter(s === 'all' ? null : s)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
                    backgroundColor: active ? Colors.black : Colors.white,
                    borderWidth: 1, borderColor: active ? Colors.black : Colors.border }}>
                  <Text fontSize={12} fontWeight={active ? '700' : '400'}
                    color={active ? '#fff' : Colors.grayDark}>
                    {s === 'all' ? t('catalog.all') : t(`orders.status_${s}`)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </YStack>
      )}

      {orders.length === 0 && (
        <YStack alignItems="center" paddingVertical={32}>
          <Text color={Colors.gray} fontSize={14}>{t('orders.empty')}</Text>
        </YStack>
      )}

      <FlatList
        data={orders}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        onRefresh={refetch}
        refreshing={false}
        renderItem={({ item }) => {
          const style = STATUS_STYLE[item.status] || { bg: '#F0F0F0', text: Colors.gray };
          const thumbs = (item.items || []).slice(0, 3).map((i: any) => i.image).filter(Boolean);
          const extra  = (item.items?.length || 0) - 3;

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('OrderDetail', { id: item._id })}
              activeOpacity={0.85}
              style={{ backgroundColor: Colors.white, borderRadius: 14, padding: 16 }}
            >
              {/* Row 1: order # + status */}
              <XStack justifyContent="space-between" alignItems="flex-start" marginBottom={10} gap={8}>
                <YStack flex={1} flexShrink={1}>
                  <Text fontWeight="700" color={Colors.black} fontSize={15} numberOfLines={1}>
                    {t('orders.orderNumber')} {item.orderNumber}
                  </Text>
                  <Text color={Colors.gray} fontSize={12} marginTop={2}>{formatDate(item.createdAt)}</Text>
                </YStack>
                <YStack flexShrink={0} style={{ backgroundColor: style.bg }}
                  borderRadius={20} paddingHorizontal={12} paddingVertical={4}>
                  <Text style={{ color: style.text }} fontSize={12} fontWeight="700" numberOfLines={1}>
                    {t(`orders.status_${item.status}`)}
                  </Text>
                </YStack>
              </XStack>

              {/* Row 2: product thumbs */}
              {thumbs.length > 0 && (
                <XStack alignItems="center" gap={-8} marginBottom={10}>
                  {thumbs.map((uri: string, i: number) => (
                    <YStack key={i} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: thumbs.length - i }}>
                      <Image source={{ uri }} width={38} height={38} borderRadius={8}
                        style={{ borderWidth: 1.5, borderColor: Colors.white }} resizeMode="cover" />
                    </YStack>
                  ))}
                  {extra > 0 && (
                    <YStack width={38} height={38} borderRadius={8} marginLeft={-10}
                      backgroundColor={Colors.bg} borderWidth={1.5} borderColor={Colors.white}
                      alignItems="center" justifyContent="center">
                      <Text fontSize={11} fontWeight="700" color={Colors.grayDark}>+{extra}</Text>
                    </YStack>
                  )}
                  <Text color={Colors.grayDark} fontSize={13} marginLeft={12}>
                    {item.items?.length} {t('orders.items')}
                  </Text>
                </XStack>
              )}

              <YStack height={1} backgroundColor={Colors.border} marginBottom={10} />

              {/* Row 3: price + details link */}
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="700" color={Colors.black} fontSize={15}>
                  {formatPrice(item.total)}
                </Text>
                <XStack alignItems="center" gap={4}>
                  <Text color={Colors.green} fontSize={14} fontWeight="600">{t('orders.details')}</Text>
                  <ChevronRight color={Colors.green} size={16} />
                </XStack>
              </XStack>
            </TouchableOpacity>
          );
        }}
      />
    </YStack>
    </ScreenWrapper>
  );
};

export default OrdersScreen;
