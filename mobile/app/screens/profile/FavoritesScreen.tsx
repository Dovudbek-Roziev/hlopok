// Sevimlilar ekrani / Favorites screen
import React, { useState } from 'react';
import { useHeaderTopPadding } from '../../utils/useHeaderTopPadding';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, X, Package, Trash2, ArrowRight, RefreshCw } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { toast } from '../../store/toastStore';
import { useConfirmStore } from '../../store/confirmStore';

const FavoritesScreen = () => {
  const headerTopPadding = useHeaderTopPadding();
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const lang        = i18n.language === 'ky' ? 'ky' : 'ru';
  const queryClient = useQueryClient();
  const { updateUser, user } = useAuthStore();
  const [clearing, setClearing] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => authApi.getFavorites().then(r => r.data.favorites),
  });

  const favorites = data || [];

  const handleRemove = async (productId: string) => {
    if (clearing || removingIds.length > 0) return;
    setRemovingIds(ids => [...ids, productId]);
    const prev = queryClient.getQueryData<any[]>(['favorites']) || [];
    const next = prev.filter((f: any) => f._id !== productId);
    queryClient.setQueryData(['favorites'], next);
    updateUser({ favorites: next.map((f: any) => f._id) });
    try {
      const res = await authApi.toggleFavorite(productId);
      updateUser({ favorites: res.data.favorites });
    } catch {
      queryClient.setQueryData(['favorites'], prev);
      updateUser({ favorites: user?.favorites || prev.map((f: any) => f._id) });
      toast.error(t('common.error'));
    } finally {
      setRemovingIds(ids => ids.filter(id => id !== productId));
    }
  };

  const clearAll = async () => {
    if (clearing || removingIds.length > 0 || favorites.length === 0) return;
    setClearing(true);
    const previousItems = favorites;
    const previousIds = user?.favorites || favorites.map((item: any) => item._id);
    queryClient.setQueryData(['favorites'], []);
    updateUser({ favorites: [] });
    try {
      const response = await authApi.clearFavorites();
      updateUser({ favorites: response.data.favorites });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(t('profile.favoritesCleared'));
    } catch {
      queryClient.setQueryData(['favorites'], previousItems);
      updateUser({ favorites: previousIds });
      toast.error(t('common.error'));
    } finally {
      setClearing(false);
    }
  };

  const confirmClearAll = () => useConfirmStore.getState().ask({
    title: t('profile.clearFavoritesTitle'),
    message: t('profile.clearFavoritesConfirm', { count: favorites.length }),
    confirmLabel: t('profile.clearFavorites'),
    cancelLabel: t('common.cancel'),
    destructive: true,
    onConfirm: clearAll,
  });

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={headerTopPadding} paddingHorizontal={16} paddingBottom={12} alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={10}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <YStack flex={1}>
          <Text fontSize={18} fontWeight="bold" color={Colors.black}>{t('profile.favorites')}</Text>
          {!isLoading && <Text fontSize={12} color={Colors.gray}>{t('profile.favoriteCount', { count: favorites.length })}</Text>}
        </YStack>
        {favorites.length > 0 && (
          <TouchableOpacity onPress={confirmClearAll} disabled={clearing || removingIds.length > 0}
            accessibilityRole="button" accessibilityLabel={t('profile.clearFavorites')} hitSlop={8}
            style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#FFF0F0', opacity: clearing || removingIds.length > 0 ? 0.5 : 1 }}>
            {clearing ? <Spinner size="small" color={Colors.red} /> : <Trash2 size={16} color={Colors.red} />}
            <Text color={Colors.red} fontSize={12} fontWeight="700">{t('profile.clearFavorites')}</Text>
          </TouchableOpacity>
        )}
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack>
      ) : isError ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingHorizontal={28}>
          <Heart color={Colors.grayLight} size={56} />
          <Text color={Colors.gray} textAlign="center">{t('profile.favoritesLoadError')}</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button"
            style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} color={Colors.black} />
            <Text color={Colors.black} fontSize={14} fontWeight="700">{t('profile.retry')}</Text>
          </TouchableOpacity>
        </YStack>
      ) : favorites.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingHorizontal={28}>
          <Heart color={Colors.grayLight} size={80} />
          <Text color={Colors.black} fontSize={16} fontWeight="700">{t('profile.noFavorites')}</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('CatalogTab')} accessibilityRole="button"
            style={{ minHeight: 46, paddingHorizontal: 18, borderRadius: 12, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text color={Colors.black} fontSize={14} fontWeight="700">{t('profile.browseProducts')}</Text>
            <ArrowRight size={16} color={Colors.black} />
          </TouchableOpacity>
        </YStack>
      ) : (
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(i: any) => i._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 28, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }: any) => {
            const unavailable = item.isActive === false;
            return (
              <TouchableOpacity
                onPress={() => unavailable
                  ? toast.info(t('profile.productUnavailable'))
                  : navigation.navigate('Product', { id: item._id })}
                activeOpacity={unavailable ? 1 : 0.85}
                style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden',
                  borderWidth: 1, borderColor: Colors.border,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <YStack opacity={unavailable ? 0.5 : 1}>
                  {item.images?.[0]
                    ? <Image source={{ uri: item.images[0] }} width="100%" height={150} resizeMode="cover" />
                    : <YStack width="100%" height={150} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Package color={Colors.gray} size={32} /></YStack>
                  }
                  <YStack padding={10} gap={4}>
                    <Text numberOfLines={2} fontSize={13} color={Colors.black}>{item[`name_${lang}`]}</Text>
                    {unavailable ? (
                      <Text fontSize={12} color={Colors.red} fontWeight="600">{t('profile.productUnavailable')}</Text>
                    ) : (
                      <Text fontWeight="bold" color={Colors.green}>{formatPrice(item.price)}</Text>
                    )}
                  </YStack>
                </YStack>
                <TouchableOpacity onPress={() => handleRemove(item._id)} disabled={clearing || removingIds.length > 0}
                  accessibilityRole="button" accessibilityLabel={t('profile.removeFavorite', { name: item[`name_${lang}`] })} hitSlop={4}
                  style={{ position: 'absolute', top: 6, right: 6, width: 36, height: 36, borderRadius: 18,
                    backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center', opacity: removingIds.includes(item._id) ? 0.65 : 1 }}>
                  {removingIds.includes(item._id) ? <Spinner size="small" color="#fff" /> : <X color="#fff" size={17} />}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </YStack>
    </ScreenWrapper>
  );
};

export default FavoritesScreen;
