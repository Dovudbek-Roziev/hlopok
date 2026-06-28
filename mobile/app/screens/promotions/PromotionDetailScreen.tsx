// Aksiya tafsiloti — shu aksiyaga tegishli mahsulotlar / Promotion detail — products in this promotion
import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Tag, Package } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { promotionsApi } from '../../api/categories';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';

const PromotionDetailScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params;
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const { data: promotion, isLoading, isError } = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => promotionsApi.getPromotion(id).then(r => r.data.promotion),
  });

  if (isLoading) {
    return <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack>;
  }
  if (isError || !promotion) {
    return (
      <YStack flex={1} backgroundColor={Colors.bg}>
        <XStack backgroundColor={Colors.bg} paddingTop={52} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
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
    );
  }

  const discountPercent = promotion.discountPercent || 0;
  const products = promotion.products || [];

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={52} paddingHorizontal={16} paddingBottom={10}
        alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={18} fontWeight="700" color={Colors.black} flex={1} numberOfLines={1}>
          {promotion[`title_${lang}`]}
        </Text>
      </XStack>

      <FlatList
        data={products.filter((i: any) => !!i.product)}
        numColumns={2}
        keyExtractor={i => i.product._id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        ListHeaderComponent={
          <YStack marginBottom={12} borderRadius={18} overflow="hidden" backgroundColor={Colors.white}
            borderWidth={1} borderColor={Colors.border}>
            {promotion.image
              ? <Image source={{ uri: promotion.image }} width="100%" height={150} resizeMode="cover" />
              : <YStack width="100%" height={150} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Tag color={Colors.gray} size={36} /></YStack>
            }
            <YStack padding={14} gap={6}>
              <XStack justifyContent="space-between" alignItems="flex-start">
                <Text fontWeight="700" fontSize={16} color={Colors.black} flex={1} marginRight={8}>
                  {promotion[`title_${lang}`]}
                </Text>
                {!!discountPercent && (
                  <YStack backgroundColor={Colors.redBg} borderRadius={20} paddingHorizontal={10} paddingVertical={4}>
                    <Text color={Colors.red} fontSize={13} fontWeight="700">-{discountPercent}%</Text>
                  </YStack>
                )}
              </XStack>
              {!!promotion[`description_${lang}`] && (
                <Text color={Colors.gray} fontSize={13}>{promotion[`description_${lang}`]}</Text>
              )}
            </YStack>
          </YStack>
        }
        ListEmptyComponent={
          <YStack alignItems="center" paddingVertical={40} gap={12}>
            <Tag color={Colors.grayLight} size={64} />
            <Text color={Colors.gray} fontSize={14}>{t('promotions.noProducts')}</Text>
          </YStack>
        }
        renderItem={({ item }) => {
          const product = item.product;
          const limit = item.limit;
          const discountedPrice = discountPercent > 0
            ? Math.round(product.price * (1 - discountPercent / 100))
            : product.price;
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('Product', { id: product._id, promoDiscount: discountPercent, promoId: id })}
              style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
                borderWidth: 1, borderColor: Colors.border }}>
              {product.images?.[0]
                ? <Image source={{ uri: product.images[0] }} width="100%" height={150} resizeMode="cover" />
                : <YStack width="100%" height={150} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={32} /></YStack>
              }
              {discountPercent > 0 && (
                <YStack position="absolute" top={8} left={8} backgroundColor={Colors.red} borderRadius={6}
                  paddingHorizontal={6} paddingVertical={2}>
                  <Text color={Colors.white} fontSize={10} fontWeight="700">-{discountPercent}%</Text>
                </YStack>
              )}
              {limit != null && (
                <YStack position="absolute" top={8} right={8} backgroundColor="rgba(0,0,0,0.65)" borderRadius={6}
                  paddingHorizontal={6} paddingVertical={2}>
                  <Text color={Colors.white} fontSize={10} fontWeight="700">{t('promotions.limitBadge', { count: limit })}</Text>
                </YStack>
              )}
              <YStack padding={10} gap={4}>
                <Text numberOfLines={2} fontSize={13} color={Colors.black}>{product[`name_${lang}`]}</Text>
                {discountPercent > 0 ? (
                  <XStack alignItems="center" gap={6}>
                    <Text fontWeight="bold" color={Colors.red} fontSize={14}>{formatPrice(discountedPrice)}</Text>
                    <Text color={Colors.gray} fontSize={12} style={{ textDecorationLine: 'line-through' }}>{formatPrice(product.price)}</Text>
                  </XStack>
                ) : (
                  <Text fontWeight="bold" color={Colors.green} fontSize={14}>{formatPrice(product.price)}</Text>
                )}
              </YStack>
            </TouchableOpacity>
          );
        }}
      />
    </YStack>
    </ScreenWrapper>
  );
};

export default PromotionDetailScreen;
