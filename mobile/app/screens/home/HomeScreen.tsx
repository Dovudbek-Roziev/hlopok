import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ScrollView, TouchableOpacity, Linking, FlatList,
  RefreshControl, Dimensions, TextInput, NativeSyntheticEvent,
  NativeScrollEvent, Animated,
} from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Tag, Truck, Heart, Search, CircleAlert, RotateCw, LayoutGrid, Bell, X, Package } from 'lucide-react-native';
import { useAppStore } from '../../store/appStore';
import { bannersApi, brandsApi, promotionsApi } from '../../api/categories';
import { productsApi } from '../../api/products';
import { useColors } from '../../theme/useColors';
import HlopokLogo from '../../components/HlopokLogo';
import { formatPrice } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

// ── Quick action button ──────────────────────────────────────

const QuickBtn = ({ icon: Icon, color, bg, label, onPress }: any) => {
  const Colors = useColors();
  return (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ alignItems: 'center', flex: 1 }}>
    <YStack
      width={60} height={60} borderRadius={20}
      backgroundColor={bg}
      alignItems="center" justifyContent="center"
      marginBottom={7}
      style={{ shadowColor: color, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <Icon color={color} size={26} strokeWidth={2.2} />
    </YStack>
    <Text fontSize={11} fontWeight="600" color={Colors.grayDark} textAlign="center" numberOfLines={2} maxWidth={70}>
      {label}
    </Text>
  </TouchableOpacity>
  );
};

// ── Error block ──────────────────────────────────────────────

const ErrorBlock = ({ onRetry }: { onRetry: () => void }) => {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
  <YStack alignItems="center" paddingVertical={20} gap={8}>
    <CircleAlert color={Colors.gray} size={28} />
    <Text color={Colors.gray} fontSize={13}>{t('home.loadError')}</Text>
    <TouchableOpacity onPress={onRetry} style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: Colors.yellow, borderRadius: 20,
      paddingHorizontal: 18, paddingVertical: 8,
    }}>
      <RotateCw color={Colors.black} size={14} />
      <Text color={Colors.black} fontSize={13} fontWeight="600">{t('home.retry')}</Text>
    </TouchableOpacity>
  </YStack>
  );
};

// ── Section title ────────────────────────────────────────────

const SectionTitle = ({ title, onMore }: { title: string; onMore?: () => void }) => {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
  <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} marginBottom={10}>
    <Text fontSize={17} fontWeight="800" color={Colors.black}>{title}</Text>
    {onMore && (
      <TouchableOpacity onPress={onMore}>
        <Text color={Colors.green} fontSize={13} fontWeight="600">{t('home.allProducts')}</Text>
      </TouchableOpacity>
    )}
  </XStack>
  );
};

// ─────────────────────────────────────────────────────────────

const HomeScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();
  const { notifCount, clearNotif } = useAppStore();
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const [bannerIndex, setBannerIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const bannerScrollRef = useRef<ScrollView>(null);
  const brandsScrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);
  useFocusEffect(useCallback(() => { clearNotif(); }, []));
  const brandsScrollX = useRef(0);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: bannersData, isError: bannersError, refetch: refetchBanners } = useQuery({
    queryKey: ['banners', 'slider'],
    queryFn: () => bannersApi.getBanners('slider').then(r => r.data.banners),
  });

  const { data: brandsData, refetch: refetchBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsApi.getBrands().then(r => r.data.brands),
  });

  const { data: promotionsData, refetch: refetchPromos } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsApi.getPromotions().then(r => r.data.promotions),
    retry: 1,
  });

  const { data: productsData, isLoading: productsLoading, isError: productsError, refetch } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: () => productsApi.getProducts({ limit: 10, sort: '-createdAt' }).then(r => r.data.products),
  });

  const sliderBanners = bannersData || [];
  const brands        = brandsData  || [];
  const promotions    = promotionsData || [];
  const products      = productsData || [];

  // Map productId → discountPercent
  const promoMap: Record<string, number> = {};
  promotions.forEach((promo: any) => {
    if (promo.discountPercent > 0) {
      (promo.products || []).forEach((p: any) => {
        const pid = typeof p.product === 'string' ? p.product : p.product?._id;
        if (pid) promoMap[pid] = promo.discountPercent;
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchBanners(), refetchBrands(), refetchPromos()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
    setBannerIndex(idx);
  };

  const handleSearchSubmit = () => {
    navigation.navigate('CatalogTab', { screen: 'Catalog', params: { search: searchText } });
  };

  // ── Banner autoplay (every 3s, manual swipe still works) ──
  useEffect(() => {
    if (sliderBanners.length < 2) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => {
        const next = (prev + 1) % sliderBanners.length;
        bannerScrollRef.current?.scrollTo({ x: next * (width - 32), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderBanners.length]);

  // ── Brands continuous auto-scroll ──
  useEffect(() => {
    if (brands.length < 2) return;
    const itemWidth = 94;
    const totalWidth = brands.length * itemWidth;
    const interval = setInterval(() => {
      brandsScrollX.current += 1;
      if (brandsScrollX.current >= totalWidth) brandsScrollX.current = 0;
      brandsScrollRef.current?.scrollTo({ x: brandsScrollX.current, animated: false });
    }, 30);
    return () => clearInterval(interval);
  }, [brands.length]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.yellow} />
      }
    >
      {/* ── Header ── */}
      <YStack backgroundColor={Colors.bg} paddingTop={52} paddingBottom={14} paddingHorizontal={16}>
        <XStack alignItems="center" justifyContent="space-between">
          <HlopokLogo size="sm" />
          <TouchableOpacity
            onPress={() => { navigation.navigate('Notifications'); }}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Bell color={Colors.black} size={22} />
            {notifCount > 0 && (
              <YStack
                position="absolute" top={4} right={4}
                width={17} height={17} borderRadius={9}
                backgroundColor={Colors.yellow}
                alignItems="center" justifyContent="center"
                style={{ borderWidth: 1.5, borderColor: Colors.bg }}>
                <Text color={Colors.black} fontSize={9} fontWeight="700">
                  {notifCount > 9 ? '9+' : notifCount}
                </Text>
              </YStack>
            )}
          </TouchableOpacity>
        </XStack>
      </YStack>

      {/* ── 4 Quick buttons ── */}
      <YStack paddingHorizontal={12} paddingVertical={10} marginBottom={4}>
        <XStack justifyContent="space-around">
          <QuickBtn icon={CreditCard} color="#6C5CE7" bg="#EDE9FB" label={t('home.bonusCard')}
            onPress={() => isAuthenticated
              ? navigation.navigate('ProfileTab', { screen: 'BonusCard' })
              : navigation.navigate('AuthNavigator')} />
          <QuickBtn icon={Tag} color={Colors.green} bg="#E2F4EA" label={t('home.discounts')}
            onPress={() => navigation.navigate('HomeTab', { screen: 'Promotions' })} />
          <QuickBtn icon={Truck} color="#E17055" bg="#FCE9E2" label={t('home.orderStatus')}
            onPress={() => navigation.navigate('OrdersTab')} />
          <QuickBtn icon={Heart} color={Colors.red} bg="#FCE5E4" label={t('home.favorites')}
            onPress={() => isAuthenticated
              ? navigation.navigate('ProfileTab', { screen: 'Favorites' })
              : navigation.navigate('AuthNavigator')} />
        </XStack>
      </YStack>

      {/* ── Search + Catalog pill ── */}
      <YStack paddingHorizontal={16} paddingBottom={14} marginBottom={4}>
        <XStack alignItems="center" gap={8}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CatalogTab')}
            style={{
              backgroundColor: Colors.yellow, borderRadius: 22,
              paddingHorizontal: 16, paddingVertical: 10,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}>
            <LayoutGrid color={Colors.black} size={15} />
            <Text fontWeight="800" color={Colors.black} fontSize={14}>{t('home.catalog')}</Text>
          </TouchableOpacity>
          <XStack
            flex={1} flexDirection="row" alignItems="center"
            backgroundColor={Colors.white} borderRadius={22}
            borderWidth={1} borderColor={Colors.border}
            paddingHorizontal={14} height={42} gap={8}>
            <Search color={Colors.gray} size={16} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              placeholder={t('home.search')}
              placeholderTextColor={Colors.gray}
              style={{ flex: 1, fontSize: 14, color: Colors.black }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                <X color={Colors.gray} size={15} />
              </TouchableOpacity>
            )}
          </XStack>
        </XStack>
      </YStack>

      {/* ── Banner Slider ── */}
      {bannersError ? (
        <YStack backgroundColor={Colors.white} marginBottom={8} marginHorizontal={16} borderRadius={16}>
          <ErrorBlock onRetry={refetchBanners} />
        </YStack>
      ) : sliderBanners.length > 0 ? (
        <YStack marginBottom={8} marginHorizontal={16}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onBannerScroll}
            style={{ borderRadius: 18, overflow: 'hidden' }}
          >
            {sliderBanners.map((banner: any) => (
              <TouchableOpacity key={banner._id}
                onPress={() => banner.linkUrl && Linking.openURL(banner.linkUrl)}
                activeOpacity={0.95}>
                <Image
                  source={{ uri: banner.image }}
                  width={width - 32}
                  height={150}
                  resizeMode="cover"
                  borderRadius={18}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Pagination dots */}
          {sliderBanners.length > 1 && (
            <XStack justifyContent="center" gap={6} paddingTop={10}>
              {sliderBanners.map((_: any, i: number) => (
                <YStack key={i}
                  width={bannerIndex === i ? 22 : 7}
                  height={7} borderRadius={4}
                  backgroundColor={bannerIndex === i ? Colors.yellow : Colors.grayLight}
                />
              ))}
            </XStack>
          )}
        </YStack>
      ) : null}

      {/* ── Promotions ── */}
      {promotions.length > 0 && (
        <YStack marginBottom={8}>
          <SectionTitle title={t('home.promotions')} onMore={() => navigation.navigate('Promotions')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {promotions.map((promo: any) => (
              <TouchableOpacity key={promo._id}
                onPress={() => navigation.navigate('PromotionDetail', { id: promo._id })}
                activeOpacity={0.9}
                style={{ width: width - 64, borderRadius: 16, overflow: 'hidden',
                  backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }}>
                <Image source={{ uri: promo.image }} width={width - 64} height={120} resizeMode="cover" />
                <YStack padding={10} gap={2}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="700" fontSize={13} color={Colors.black} numberOfLines={1} flex={1}>
                      {promo[`title_${lang}`]}
                    </Text>
                    {!!promo.discountPercent && (
                      <YStack backgroundColor={Colors.redBg} borderRadius={10} paddingHorizontal={7} paddingVertical={2} marginLeft={6}>
                        <Text color={Colors.red} fontSize={11} fontWeight="700">-{promo.discountPercent}%</Text>
                      </YStack>
                    )}
                  </XStack>
                  {!!promo[`description_${lang}`] && (
                    <Text fontSize={12} color={Colors.gray} numberOfLines={2}>
                      {promo[`description_${lang}`]}
                    </Text>
                  )}
                </YStack>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </YStack>
      )}

      {/* ── Brands ── */}
      {brands.length > 0 && (
        <YStack marginBottom={8}>
          <SectionTitle title={t('home.popularBrands')} />
          <ScrollView ref={brandsScrollRef} horizontal showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
            {(brands.length >= 4 ? [...brands, ...brands] : brands).map((brand: any, i: number) => (
              <TouchableOpacity key={`${brand._id}_${i}`}
                onPress={() => navigation.navigate('CatalogTab', { screen: 'Catalog', params: { brand: brand._id } })}
                style={{ width: 78, alignItems: 'center' }}>
                <YStack width={72} height={72} borderRadius={36} overflow="hidden"
                  backgroundColor={Colors.white} borderWidth={1.5} borderColor={Colors.border}
                  alignItems="center" justifyContent="center"
                  style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
                  {brand.logo ? (
                    <Image source={{ uri: brand.logo }} width={72} height={72} resizeMode="cover" />
                  ) : (
                    <Text fontWeight="bold" color={Colors.black} fontSize={22}>{brand.name[0]}</Text>
                  )}
                </YStack>
                <Text fontSize={11} color={Colors.grayDark} fontWeight="600"
                  numberOfLines={1} marginTop={6} textAlign="center">
                  {brand.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </YStack>
      )}

      {/* ── Products ── */}
      <YStack marginBottom={20}>
        <SectionTitle
          title={t('home.recommended')}
          onMore={() => navigation.navigate('CatalogTab')}
        />
        {productsLoading ? (
          <YStack alignItems="center" paddingVertical={24}>
            <Spinner color={Colors.yellow} />
          </YStack>
        ) : productsError ? (
          <ErrorBlock onRetry={refetch} />
        ) : products.length === 0 ? (
          <YStack alignItems="center" paddingVertical={20}>
            <Text color={Colors.gray} fontSize={14}>{t('home.noProducts')}</Text>
          </YStack>
        ) : (
          <FlatList
            data={products}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            keyExtractor={i => i._id}
            renderItem={({ item }) => {
              const discount = promoMap[item._id] || 0;
              const salePrice = discount > 0 ? Math.round(item.price * (1 - discount / 100)) : 0;
              return (
              <TouchableOpacity
                onPress={() => navigation.navigate('HomeTab', { screen: 'Product', params: { id: item._id } })}
                style={{
                  width: 148, backgroundColor: Colors.white,
                  borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: Colors.border,
                }}>
                {item.images?.[0]
                  ? <Image source={{ uri: item.images[0] }} width={148} height={148} resizeMode="cover" />
                  : <YStack width={148} height={148} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={36} /></YStack>
                }
                {discount > 0 ? (
                  <YStack position="absolute" top={8} left={8}
                    backgroundColor={Colors.red} borderRadius={6}
                    paddingHorizontal={7} paddingVertical={3}>
                    <Text color={Colors.white} fontSize={10} fontWeight="700">-{discount}%</Text>
                  </YStack>
                ) : item.isNew ? (
                  <YStack position="absolute" top={8} left={8}
                    backgroundColor={Colors.green} borderRadius={6}
                    paddingHorizontal={7} paddingVertical={3}>
                    <Text color={Colors.white} fontSize={10} fontWeight="700">{t('home.newBadge')}</Text>
                  </YStack>
                ) : null}
                <YStack padding={10} gap={4}>
                  <Text numberOfLines={2} fontSize={12} color={Colors.black} lineHeight={16}>{item[`name_${lang}`]}</Text>
                  {discount > 0 ? (
                    <XStack alignItems="center" gap={4} flexWrap="wrap">
                      <Text fontWeight="800" color={Colors.red} fontSize={14}>{formatPrice(salePrice)}</Text>
                      <Text color={Colors.gray} fontSize={11} style={{ textDecorationLine: 'line-through' }}>{formatPrice(item.price)}</Text>
                    </XStack>
                  ) : (
                    <Text fontWeight="800" color={Colors.green} fontSize={14}>{formatPrice(item.price)}</Text>
                  )}
                </YStack>
              </TouchableOpacity>
              );
            }}
          />
        )}
      </YStack>

    </ScrollView>
    </Animated.View>
  );
};

export default HomeScreen;
