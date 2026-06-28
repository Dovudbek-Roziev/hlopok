import React, { useState, useEffect, useRef } from 'react';
import { FlatList, TouchableOpacity, Pressable, StyleSheet, Animated } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Package } from 'lucide-react-native';
import { productsApi } from '../../api/products';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';

const CategoryScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const { id, name } = route.params;
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);

  const [page, setPage]               = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', 'category', id, page],
    queryFn: () => productsApi.getProducts({ category: id, page, limit: 20 }).then(r => r.data),
  });

  useEffect(() => {
    if (!data?.products) return;
    setAllProducts(prev => page === 1 ? data.products : [...prev, ...data.products]);
  }, [data?.products]);

  const hasMore = data?.pagination ? data.pagination.page < data.pagination.pages : false;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={18} fontWeight="bold" color={Colors.black}>{name}</Text>
      </XStack>

      {isLoading && page === 1 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color={Colors.yellow} size="large" />
        </YStack>
      ) : isError ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} padding={32}>
          <Text color={Colors.gray}>{t('common.error')}</Text>
          <TouchableOpacity onPress={() => refetch()}
            style={{ backgroundColor: Colors.yellow, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}>
            <Text fontWeight="700" color={Colors.black}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </YStack>
      ) : (
        <FlatList
          data={allProducts}
          numColumns={2}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 8, gap: 8, paddingBottom: 20 }}
          columnWrapperStyle={{ gap: 8 }}
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('Product', { id: item._id })}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              {item.images?.[0]
                ? <Image source={{ uri: item.images[0] }} width="100%" height={160} resizeMode="cover" />
                : <YStack width="100%" height={160} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={36} /></YStack>
              }
              {item.isNew && (
                <YStack position="absolute" top={8} left={8} backgroundColor={Colors.green} borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
                  <Text color={Colors.white} fontSize={10} fontWeight="700">{t('home.newBadge')}</Text>
                </YStack>
              )}
              {item.isBestseller && (
                <YStack position="absolute" top={8} right={8} backgroundColor={Colors.yellow} borderRadius={6} paddingHorizontal={6} paddingVertical={2}>
                  <Text color={Colors.black} fontSize={10} fontWeight="700">TOP</Text>
                </YStack>
              )}
              <YStack padding={10} gap={4}>
                <Text numberOfLines={2} fontSize={13} color={Colors.black}>{item[`name_${lang}`]}</Text>
                <Text fontWeight="bold" color={Colors.green} fontSize={14}>{formatPrice(item.price)}</Text>
              </YStack>
            </Pressable>
          )}
        />
      )}
    </YStack>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
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

export default CategoryScreen;
