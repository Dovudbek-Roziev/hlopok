import React, { useState, useRef } from 'react';
import { ScrollView, TouchableOpacity, Dimensions, Share, Modal, FlatList, StatusBar } from 'react-native';
import { YStack, XStack, Text, Spinner, Image } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, Share2, ShoppingCart, ChevronDown, ChevronUp, Star, MessageSquare, X, PackageX } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { productsApi, activePromosApi } from '../../api/products';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { getColorName } from '../../utils/colorName';
import { getSizeLabel } from '../../utils/sizeLabel';

const { width } = Dimensions.get('window');

const ProductScreen = () => {
  const Colors = useColors();
  const { t, i18n }  = useTranslation();
  const navigation   = useNavigation<any>();
  const route        = useRoute<any>();
  const { id }       = route.params;
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { addItem } = useCartStore();

  const [selectedSize, setSize]     = useState('');
  const [selectedColor, setColor]   = useState('');
  const [imgIndex, setImgIndex]     = useState(0);
  const [cartError, setCartError]   = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const [descOpen, setDescOpen]     = useState(false);

  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id).then(r => r.data.product),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['product-rating', id],
    queryFn:  () => productsApi.getReviews(id).then(r => r.data),
    staleTime: 60_000,
  });

  // Auto-detect active promotion for this product (works from any navigation path)
  const { data: activePromos } = useQuery({
    queryKey: ['active-promotions'],
    queryFn:  () => activePromosApi.getActive().then(r => r.data.promotions),
    staleTime: 5 * 60_000,
    enabled: !route.params?.promoId, // skip if already passed via navigation
  });

  if (isLoading) {
    return <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack>;
  }

  if (isError) {
    return (
      <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center" gap={14} paddingHorizontal={32}>
        <Text fontSize={16} color={Colors.gray} textAlign="center">{t('common.error')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text fontWeight="700" color={Colors.black}>{t('common.back')}</Text>
        </TouchableOpacity>
      </YStack>
    );
  }

  const product = data;
  if (!product) {
    return (
      <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center" gap={14} paddingHorizontal={32}>
        <Text fontSize={16} color={Colors.gray} textAlign="center">{t('product.notFound')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text fontWeight="700" color={Colors.black}>{t('common.back')}</Text>
        </TouchableOpacity>
      </YStack>
    );
  }

  const isFav = user?.favorites?.includes(product._id);
  const variants = product.variants || [];

  const availableColors: string[] = [...new Set(variants.map((v: any) => v.color))].filter(Boolean) as string[];
  const hasColors = availableColors.length > 0;

  const colorKey = hasColors ? selectedColor : '';
  const sizesForColor = variants.filter((v: any) => (v.color || '') === colorKey && v.stock > 0);

  const maxStock = selectedSize
    ? variants.find((v: any) => v.size === selectedSize && v.color === colorKey)?.stock || 0
    : 0;

  const handleSelectColor = (color: string) => {
    setColor(color);
    const stillValid = variants.some((v: any) => v.size === selectedSize && v.color === color && v.stock > 0);
    if (!stillValid) setSize('');
  };

  // Find active promotion for this product (from params or auto-detected)
  const detectedPromo = !route.params?.promoId && activePromos
    ? activePromos.find((promo: any) =>
        promo.products?.some((p: any) => {
          const pid = typeof p.product === 'string' ? p.product : p.product?._id;
          return pid === product._id;
        })
      )
    : null;

  const promoDiscount = route.params?.promoDiscount || detectedPromo?.discountPercent || 0;
  const activePromoId = route.params?.promoId || detectedPromo?._id;
  const hasDiscount = promoDiscount > 0;
  const currentPrice = hasDiscount
    ? Math.round(product.price * (1 - promoDiscount / 100))
    : product.price;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product[`name_${lang}`]} — ${formatPrice(currentPrice)}\n${t('product.shareStoreName')}`,
      });
    } catch {}
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { navigation.navigate('AuthNavigator'); return; }
    const currentFavs: string[] = user?.favorites || [];
    const newFavs = isFav
      ? currentFavs.filter((fid: string) => fid !== product._id)
      : [...currentFavs, product._id];
    updateUser({ favorites: newFavs });
    try {
      const res = await authApi.toggleFavorite(product._id);
      updateUser({ favorites: res.data.favorites });
    } catch {
      updateUser({ favorites: currentFavs });
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigation.navigate('AuthNavigator'); return; }
    if (hasColors && !selectedColor) { setCartError(t('product.selectColor')); return; }
    if (!selectedSize) { setCartError(t('product.selectSize')); return; }
    if (maxStock === 0) { setCartError(t('product.outOfStock')); return; }
    setCartError('');
    addItem({
      productId: product._id,
      name_ru: product.name_ru,
      name_ky: product.name_ky,
      image: product.images?.[0] || '',
      price: currentPrice,
      size: selectedSize,
      color: selectedColor,
      qty: 1,
      maxStock,
      promotionId: hasDiscount ? activePromoId : undefined,
    });
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 2000);
  };

  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
  const isOutOfStock = variants.length === 0 || totalStock === 0;

  const avgRating  = reviewData?.avgRating || 0;
  const ratingCount = reviewData?.count || 0;

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.white}>

      {/* Floating header icons */}
      <XStack position="absolute" top={48} left={0} right={0} zIndex={10}
        justifyContent="space-between" paddingHorizontal={16}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft color={Colors.black} size={22} />
        </TouchableOpacity>
        <XStack gap={10}>
          <TouchableOpacity onPress={handleFavorite}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center', justifyContent: 'center' }}>
            <Heart color={isFav ? Colors.red : Colors.gray} fill={isFav ? Colors.red : 'none'} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center', justifyContent: 'center' }}>
            <Share2 color={Colors.gray} size={20} />
          </TouchableOpacity>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Images */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {(product.images?.length ? product.images : ['']).map((img: string, i: number) => (
            <Image key={i} source={{ uri: img }} width={width} height={width} resizeMode="cover" />
          ))}
        </ScrollView>

        {product.images?.length > 1 && (
          <XStack justifyContent="center" gap={6} marginTop={10}>
            {product.images.map((_: any, i: number) => (
              <YStack key={i}
                width={imgIndex === i ? 20 : 6} height={6} borderRadius={3}
                backgroundColor={imgIndex === i ? Colors.black : Colors.grayLight} />
            ))}
          </XStack>
        )}

        <YStack padding={20} paddingBottom={8} gap={14}>

          {/* Badges */}
          <XStack gap={8}>
            {product.isNew && (
              <YStack backgroundColor={Colors.green} borderRadius={20} paddingHorizontal={10} paddingVertical={4}>
                <Text color={Colors.white} fontSize={11} fontWeight="700">{t('product.isNew')}</Text>
              </YStack>
            )}
            {product.isBestseller && (
              <YStack backgroundColor={Colors.yellow} borderRadius={20} paddingHorizontal={10} paddingVertical={4}>
                <Text color={Colors.black} fontSize={11} fontWeight="700">{t('product.isBestseller')}</Text>
              </YStack>
            )}
          </XStack>

          {/* Name */}
          <Text fontSize={20} fontWeight="700" color={Colors.black} lineHeight={26}>
            {product[`name_${lang}`]}
          </Text>

          {/* Price */}
          <XStack alignItems="center" gap={10}>
            <Text fontSize={24} fontWeight="700" color={hasDiscount ? Colors.red : Colors.green}>
              {formatPrice(currentPrice)}
            </Text>
            {hasDiscount && (
              <>
                <Text fontSize={15} color={Colors.gray} style={{ textDecorationLine: 'line-through' }}>
                  {formatPrice(product.price)}
                </Text>
                <YStack backgroundColor={Colors.redBg} borderRadius={20} paddingHorizontal={8} paddingVertical={3}>
                  <Text color={Colors.red} fontSize={12} fontWeight="700">-{promoDiscount}%</Text>
                </YStack>
              </>
            )}
          </XStack>

          {/* Out of stock banner */}
          {isOutOfStock && (
            <YStack backgroundColor="#FFF3F3" borderRadius={14} padding={14} gap={6}
              borderLeftWidth={4} borderLeftColor={Colors.red}>
              <XStack alignItems="center" gap={8}>
                <PackageX color={Colors.red} size={22} />
                <Text fontSize={15} fontWeight="700" color={Colors.red}>
                  {t('product.outOfStockTitle')}
                </Text>
              </XStack>
              <Text fontSize={13} color="#B71C1C" lineHeight={20}>
                {t('product.outOfStockDesc')}
              </Text>
            </YStack>
          )}

          {/* Rating row */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Reviews', { productId: id, productName: product[`name_${lang}`] })}
          >
            <XStack alignItems="center" gap={6}>
              <XStack gap={2}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} color="#FFB800"
                    fill={ratingCount > 0 && s <= Math.round(avgRating) ? '#FFB800' : 'none'} />
                ))}
              </XStack>
              {ratingCount > 0 ? (
                <Text fontSize={13} color={Colors.gray}>
                  {avgRating} ({ratingCount} {t('reviews.reviewsCount')})
                </Text>
              ) : (
                <Text fontSize={13} color={Colors.gray}>{t('reviews.noReviews')}</Text>
              )}
            </XStack>
          </TouchableOpacity>

          <YStack height={1} backgroundColor={Colors.border} />

          {/* Colors */}
          {hasColors && (
            <YStack gap={8}>
              <XStack alignItems="center" gap={8}>
                <Text fontSize={14} fontWeight="600" color={Colors.black}>{t('product.color')}</Text>
                {selectedColor ? (
                  <Text fontSize={13} color={Colors.gray}>{getColorName(selectedColor, lang as 'ru' | 'ky')}</Text>
                ) : null}
              </XStack>
              <XStack gap={10} flexWrap="wrap">
                {availableColors.map((color: string) => {
                  const colorInStock = variants.some((v: any) => v.color === color && v.stock > 0);
                  return (
                    <TouchableOpacity key={color} onPress={() => colorInStock && handleSelectColor(color)}
                      disabled={!colorInStock}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: color,
                        borderWidth: selectedColor === color ? 3 : 1.5,
                        borderColor: selectedColor === color ? Colors.black : Colors.border,
                        opacity: colorInStock ? 1 : 0.3,
                      }} />
                  );
                })}
              </XStack>
            </YStack>
          )}

          {/* Sizes + Size guide button */}
          {(!hasColors || selectedColor) && (
            <YStack gap={10}>
              <Text fontSize={14} fontWeight="600" color={Colors.black}>{t('product.size')}</Text>
              {sizesForColor.length === 0 ? (
                <Text color={Colors.gray} fontSize={13}>{t('product.outOfStock')}</Text>
              ) : (
                <XStack gap={8} flexWrap="wrap">
                  {sizesForColor.map((v: any) => (
                    <TouchableOpacity key={v.size} onPress={() => setSize(v.size)}
                      style={{
                        minWidth: 64, height: 44, borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: selectedSize === v.size ? Colors.yellow : Colors.border,
                        backgroundColor: selectedSize === v.size ? Colors.yellow : Colors.white,
                        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
                      }}>
                      <Text fontSize={13} fontWeight={selectedSize === v.size ? '700' : '500'}
                        color={Colors.black} textAlign="center">
                        {getSizeLabel(v.size, lang)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </XStack>
              )}
            </YStack>
          )}
          {hasColors && !selectedColor && (
            <Text color={Colors.gray} fontSize={13}>{t('product.selectColorFirst')}</Text>
          )}

          <YStack height={1} backgroundColor={Colors.border} />

          {/* Description accordion */}
          {product[`description_${lang}`] ? (
            <YStack>
              <TouchableOpacity onPress={() => setDescOpen(v => !v)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <Text fontSize={15} fontWeight="600" color={Colors.black}>{t('product.description')}</Text>
                {descOpen ? <ChevronUp color={Colors.gray} size={18} /> : <ChevronDown color={Colors.gray} size={18} />}
              </TouchableOpacity>
              {descOpen && (
                <Text color={Colors.grayDark} fontSize={13} lineHeight={22} marginTop={8}>
                  {product[`description_${lang}`]}
                </Text>
              )}
            </YStack>
          ) : null}

          {/* Reviews preview */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Reviews', { productId: id, productName: product[`name_${lang}`] })}
          >
            <XStack backgroundColor={Colors.bg} borderRadius={14} padding={14}
              alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap={10}>
                <MessageSquare color={Colors.gray} size={18} />
                <YStack>
                  <Text fontSize={14} fontWeight="600" color={Colors.black}>{t('reviews.title')}</Text>
                  {ratingCount > 0 ? (
                    <XStack alignItems="center" gap={4}>
                      <Star color={Colors.yellow} fill={Colors.yellow} size={11} />
                      <Text fontSize={12} color={Colors.gray}>
                        {avgRating} · {ratingCount} {t('reviews.reviewsCount')}
                      </Text>
                    </XStack>
                  ) : (
                    <Text fontSize={12} color={Colors.gray}>{t('reviews.noReviews')}</Text>
                  )}
                </YStack>
              </XStack>
              <ChevronDown color={Colors.gray} size={16} style={{ transform: [{ rotate: '-90deg' }] }} />
            </XStack>
          </TouchableOpacity>

        </YStack>

        <YStack height={80} />
      </ScrollView>

      {/* Sticky bottom */}
      <YStack backgroundColor={Colors.white} paddingHorizontal={16} paddingVertical={12}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 10 }}>
        {!!cartError && (
          <YStack backgroundColor={Colors.redBg} borderRadius={10} padding={10} marginBottom={8}>
            <Text color={Colors.red} fontSize={13} textAlign="center">{cartError}</Text>
          </YStack>
        )}
        {cartSuccess && (
          <YStack backgroundColor={Colors.greenBg} borderRadius={10} padding={10} marginBottom={8}>
            <Text color={Colors.green} fontSize={13} textAlign="center">{t('product.addedToCart')}</Text>
          </YStack>
        )}
        <XStack gap={12} alignItems="center">
          <TouchableOpacity onPress={handleAddToCart} disabled={isOutOfStock} style={{ flex: 1 }}>
            <XStack backgroundColor={isOutOfStock ? Colors.grayLight : Colors.yellow}
              borderRadius={14} height={52} alignItems="center" justifyContent="center" gap={8}>
              <ShoppingCart color={isOutOfStock ? Colors.gray : Colors.black} size={18} />
              <Text fontWeight="700" color={isOutOfStock ? Colors.gray : Colors.black} fontSize={15}>
                {isOutOfStock ? t('product.outOfStockTitle') : t('product.addToCart')}
              </Text>
            </XStack>
          </TouchableOpacity>
          <YStack alignItems="flex-end">
            <Text color={Colors.gray} fontSize={11}>{t('product.total')}</Text>
            <Text fontWeight="700" color={Colors.black} fontSize={16}>{formatPrice(currentPrice)}</Text>
          </YStack>
        </XStack>
      </YStack>

    </YStack>
    </ScreenWrapper>
  );
};

export default ProductScreen;
