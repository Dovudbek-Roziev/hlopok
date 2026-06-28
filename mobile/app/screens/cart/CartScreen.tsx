import React from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { YStack, XStack, Text, Image } from 'tamagui';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Trash2, Plus, Minus, ShoppingBag, Package, ChevronRight } from 'lucide-react-native';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { getColorName } from '../../utils/colorName';
import { getSizeLabel } from '../../utils/sizeLabel';

const CartScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const { items, removeItem, updateQty, totalPrice } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  if (items.length === 0) {
    return (
      <ScreenWrapper>
        <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center" gap={16} padding={32} paddingTop={52}>
          <ShoppingBag color={Colors.grayLight} size={80} />
          <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('cart.empty')}</Text>
          <Text color={Colors.gray} fontSize={13} textAlign="center">{t('cart.emptyHint')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab')}
            style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 }}>
            <Text fontWeight="700" color={Colors.black}>{t('cart.goToCatalog')}</Text>
          </TouchableOpacity>
        </YStack>
      </ScreenWrapper>
    );
  }

  const subtotal = totalPrice();

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* ── Header ── */}
      <YStack backgroundColor={Colors.bg} paddingHorizontal={20} paddingTop={52} paddingBottom={14}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={22} fontWeight="700" color={Colors.black}>{t('cart.title')}</Text>
          <YStack backgroundColor={Colors.white} borderWidth={1} borderColor={Colors.border} borderRadius={12} paddingHorizontal={12} paddingVertical={4}>
            <Text fontWeight="700" color={Colors.black} fontSize={13}>{items.length} {t('common.pieces')}</Text>
          </YStack>
        </XStack>
      </YStack>

      <FlatList
        data={items}
        keyExtractor={i => `${i.productId}_${i.size}_${i.color}`}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item }) => (
          <XStack backgroundColor={Colors.white} borderRadius={14} padding={12} gap={12}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
            {item.image
              ? <Image source={{ uri: item.image }} width={90} height={90} borderRadius={12} resizeMode="cover" />
              : <YStack width={90} height={90} borderRadius={12} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={28} /></YStack>
            }
            <YStack flex={1} gap={3}>
              <XStack justifyContent="space-between" alignItems="flex-start">
                <Text numberOfLines={2} fontSize={14} fontWeight="600" color={Colors.black} flex={1} marginRight={8}>
                  {item[`name_${lang}`]}
                </Text>
                <TouchableOpacity onPress={() => Alert.alert(
                  t('cart.removeTitle'),
                  t('cart.removeConfirm'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('cart.remove'), style: 'destructive',
                      onPress: () => removeItem(item.productId, item.size, item.color) },
                  ]
                )}>
                  <Trash2 color={Colors.red} size={16} />
                </TouchableOpacity>
              </XStack>
              <XStack alignItems="center" gap={5} flexWrap="wrap">
                <Text fontSize={12} color={Colors.gray}>{getSizeLabel(item.size, lang)}</Text>
                {item.color ? (
                  <XStack alignItems="center" gap={5}>
                    <Text fontSize={12} color={Colors.gray}>·</Text>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color,
                      borderWidth: 0.5, borderColor: '#ccc' }} />
                    {getColorName(item.color, lang as 'ru' | 'ky') !== item.color && (
                      <Text fontSize={12} color={Colors.gray}>
                        {getColorName(item.color, lang as 'ru' | 'ky')}
                      </Text>
                    )}
                  </XStack>
                ) : null}
              </XStack>
              <Text fontWeight="700" color={Colors.green} fontSize={15}>{formatPrice(item.price)}</Text>
              <XStack alignItems="center" gap={10} marginTop={6}>
                <TouchableOpacity
                  onPress={() => item.qty > 1
                    ? updateQty(item.productId, item.size, item.color, item.qty - 1)
                    : removeItem(item.productId, item.size, item.color)}
                  style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bg,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: Colors.border }}>
                  <Minus color={Colors.black} size={15} />
                </TouchableOpacity>
                <Text fontWeight="700" fontSize={16} color={Colors.black} minWidth={20} textAlign="center">{item.qty}</Text>
                <TouchableOpacity
                  onPress={() => updateQty(item.productId, item.size, item.color, item.qty + 1)}
                  disabled={item.qty >= item.maxStock}
                  style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.yellow,
                    alignItems: 'center', justifyContent: 'center', opacity: item.qty >= item.maxStock ? 0.4 : 1 }}>
                  <Plus color={Colors.black} size={15} />
                </TouchableOpacity>
              </XStack>
            </YStack>
          </XStack>
        )}
        ListFooterComponent={
          <YStack gap={10} marginTop={2}>
              {/* Summary */}
            <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={10}>
              <XStack justifyContent="space-between">
                <Text color={Colors.grayDark} fontSize={14}>{t('checkout.subtotal')} ({items.length})</Text>
                <Text color={Colors.black} fontSize={14}>{formatPrice(subtotal)}</Text>
              </XStack>
              <YStack height={1} backgroundColor={Colors.border} />
              <XStack justifyContent="space-between">
                <Text fontSize={17} fontWeight="700" color={Colors.black}>{t('checkout.totalAmount')}</Text>
                <Text fontSize={17} fontWeight="700" color={Colors.black}>{formatPrice(subtotal)}</Text>
              </XStack>
            </YStack>
          </YStack>
        }
      />

      {/* ── Checkout button ── */}
      <YStack padding={16} backgroundColor={Colors.white}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (!isAuthenticated) { navigation.navigate('AuthNavigator'); return; }
            navigation.navigate('Checkout');
          }}
          style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text fontWeight="700" color={Colors.black} fontSize={16}>{t('cart.checkout')}</Text>
          <ChevronRight color={Colors.black} size={18} />
        </TouchableOpacity>
      </YStack>
    </YStack>
    </ScreenWrapper>
  );
};

export default CartScreen;
