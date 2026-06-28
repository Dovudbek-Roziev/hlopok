// Katalog ekrani / Catalog screen
import React, { useState, useEffect, useRef } from 'react';
import { FlatList, TouchableOpacity, TextInput, StyleSheet, Pressable, Animated } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Search, Phone, X, Package } from 'lucide-react-native';
import { categoriesApi } from '../../api/categories';
import { productsApi, activePromosApi } from '../../api/products';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { Image } from 'tamagui';

const SORT_KEYS = [
  { key: '-createdAt', tKey: 'catalog.sortNew' },
  { key: 'price_asc',  tKey: 'catalog.sortCheap' },
  { key: 'popular',    tKey: 'catalog.sortPopular' },
  { key: 'top_rated',  tKey: 'catalog.sortTopRated' },
];

const CatalogScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();

  const [search, setSearch]           = useState(route.params?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategory, setCategory] = useState(route.params?.category || '');
  const [selectedBrand, setBrand]      = useState(route.params?.brand || '');
  const [selectedSort, setSort]       = useState('-createdAt');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);
  const [page, setPage]               = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    if (route.params?.search   !== undefined) setSearch(route.params.search);
    if (route.params?.category !== undefined) setCategory(route.params.category);
    if (route.params?.brand    !== undefined) setBrand(route.params.brand);
    setPage(1);
    setAllProducts([]);
  }, [route.params?.search, route.params?.category, route.params?.brand]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setAllProducts([]);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories().then(r => r.data.categories),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', selectedCategory, selectedBrand, selectedSort, debouncedSearch, page],
    queryFn: () => productsApi.getProducts({
      category: selectedCategory || undefined,
      brand:    selectedBrand    || undefined,
      sort: selectedSort,
      search: debouncedSearch || undefined,
      page, limit: 20,
    }).then(r => r.data),
  });

  const { data: promosData } = useQuery({
    queryKey: ['active-promotions'],
    queryFn:  () => activePromosApi.getActive().then(r => r.data.promotions),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!data?.products) return;
    setAllProducts(prev => page === 1 ? data.products : [...prev, ...data.products]);
  }, [data?.products]);

  const categories = categoriesData || [];
  const products   = allProducts;
  const hasMore    = data?.pagination ? data.pagination.page < data.pagination.pages : false;
  const lang       = i18n.language === 'ky' ? 'ky' : 'ru';

  // Map productId → discountPercent from active promotions
  const promoMap: Record<string, number> = {};
  (promosData || []).forEach((promo: any) => {
    if (promo.discountPercent > 0) {
      (promo.products || []).forEach((p: any) => {
        const pid = typeof p.product === 'string' ? p.product : p.product?._id;
        if (pid) promoMap[pid] = promo.discountPercent;
      });
    }
  });

  const renderProduct = ({ item }: any) => {
    const discount = promoMap[item._id] || 0;
    const salePrice = discount > 0 ? Math.round(item.price * (1 - discount / 100)) : 0;
    return (
    <Pressable
      onPress={() => navigation.navigate('Product', { id: item._id })}
      style={({ pressed }) => [styles.productCard, { transform: [{ scale: pressed ? 0.96 : 1 }], opacity: pressed ? 0.9 : 1 }]}
    >
      {item.images?.[0]
        ? <Image source={{ uri: item.images[0] }} width="100%" height={160} resizeMode="cover" />
        : <YStack width="100%" height={160} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={36} /></YStack>
      }
      {/* Discount badge — top priority */}
      {discount > 0 ? (
        <YStack position="absolute" top={8} left={8} backgroundColor={Colors.red} borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
          <Text color={Colors.white} fontSize={10} fontWeight="700">-{discount}%</Text>
        </YStack>
      ) : item.isNew ? (
        <YStack position="absolute" top={8} left={8} backgroundColor={Colors.green} borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
          <Text color={Colors.white} fontSize={10} fontWeight="700">{t('home.newBadge')}</Text>
        </YStack>
      ) : null}
      {/* Bestseller badge — top right */}
      {item.isBestseller && (
        <YStack position="absolute" top={8} right={8} backgroundColor={Colors.yellow} borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
          <Text color={Colors.black} fontSize={10} fontWeight="700">TOP</Text>
        </YStack>
      )}
      <YStack padding={10} gap={4}>
        <Text numberOfLines={2} fontSize={13} color={Colors.black}>{item[`name_${lang}`]}</Text>
        {discount > 0 ? (
          <XStack alignItems="center" gap={5} flexWrap="wrap">
            <Text fontWeight="800" color={Colors.red} fontSize={14}>{formatPrice(salePrice)}</Text>
            <Text color={Colors.gray} fontSize={11} style={{ textDecorationLine: 'line-through' }}>{formatPrice(item.price)}</Text>
          </XStack>
        ) : (
          <Text fontWeight="bold" color={Colors.green} fontSize={14}>{formatPrice(item.price)}</Text>
        )}
      </YStack>
    </Pressable>
    );
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
    <YStack flex={1} backgroundColor={Colors.bg}>
      {/* Search bar */}
      <YStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={12}>
        <XStack alignItems="center" backgroundColor={Colors.white} borderWidth={1} borderColor={Colors.border}
          borderRadius={12} paddingHorizontal={12} height={46} gap={8}>
          <Search color={Colors.gray} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('home.search')}
            placeholderTextColor={Colors.gray}
            style={{ flex: 1, fontSize: 15, color: Colors.black }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <X color={Colors.gray} size={16} />
            </TouchableOpacity>
          )}
        </XStack>
      </YStack>

      {/* Categories */}
      <YStack backgroundColor={Colors.white} marginBottom={8}>
        <FlatList
          horizontal
          data={[{ _id: '', name_ru: t('catalog.all'), name_ky: t('catalog.all') }, ...categories]}
          keyExtractor={i => i._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setCategory(item._id); setPage(1); setAllProducts([]); }}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: selectedCategory === item._id ? Colors.yellow : Colors.bg,
                borderWidth: 1, borderColor: selectedCategory === item._id ? Colors.yellow : Colors.border,
              }}
            >
              <Text color={Colors.black} fontWeight={selectedCategory === item._id ? 'bold' : '400'} fontSize={13}>
                {item[`name_${lang}`]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </YStack>

      {/* Sort + Baylanish */}
      <YStack backgroundColor={Colors.white} marginBottom={8}>
        <FlatList
          horizontal
          data={SORT_KEYS}
          keyExtractor={s => s.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate('Contacts')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                backgroundColor: Colors.yellow, marginLeft: 4,
              }}
            >
              <Phone color={Colors.black} size={13} />
              <Text color={Colors.black} fontSize={12} fontWeight="700">{t('contacts.title')}</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setSort(item.key); setPage(1); setAllProducts([]); }}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                backgroundColor: selectedSort === item.key ? Colors.black : Colors.bg,
              }}
            >
              <Text color={selectedSort === item.key ? 'white' : Colors.gray} fontSize={12}>
                {t(item.tKey)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </YStack>

      {/* Products grid */}
      {isLoading && page === 1 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color={Colors.yellow} size="large" />
        </YStack>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 8, gap: 8, paddingBottom: 20 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={renderProduct}
          onEndReached={() => { if (hasMore) setPage(p => p + 1); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" padding={40}>
              <Text color={Colors.gray}>{t('catalog.noProducts')}</Text>
            </YStack>
          }
          ListFooterComponent={
            hasMore ? (
              <YStack alignItems="center" paddingVertical={16}>
                <Spinner color={Colors.yellow} size="small" />
              </YStack>
            ) : null
          }
        />
      )}
    </YStack>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

export default CatalogScreen;
