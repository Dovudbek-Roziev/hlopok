// Sevimlilar ekrani / Favorites screen
import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, X, Package } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatPrice } from '../../utils/format';
import { toast } from '../../store/toastStore';

const FavoritesScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const lang        = i18n.language === 'ky' ? 'ky' : 'ru';
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => authApi.getFavorites().then(r => r.data.favorites),
  });

  const favorites = data || [];

  const handleRemove = async (productId: string) => {
    // Optimistic — darhol olib tashlash
    const prev = queryClient.getQueryData<any[]>(['favorites']) || [];
    queryClient.setQueryData(['favorites'], prev.filter((f: any) => f._id !== productId));
    updateUser({ favorites: prev.filter((f: any) => f._id !== productId).map((f: any) => f._id) });
    try {
      const res = await authApi.toggleFavorite(productId);
      updateUser({ favorites: res.data.favorites });
    } catch {
      // Rollback
      queryClient.setQueryData(['favorites'], prev);
      updateUser({ favorites: prev.map((f: any) => f._id) });
    }
  };

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={18} fontWeight="bold" color={Colors.black}>{t('profile.favorites')}</Text>
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={Colors.yellow} size="large" /></YStack>
      ) : favorites.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Heart color={Colors.grayLight} size={80} />
          <Text color={Colors.gray}>{t('profile.noFavorites')}</Text>
        </YStack>
      ) : (
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(i: any) => i._id}
          contentContainerStyle={{ padding: 8, gap: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }: any) => {
            const unavailable = item.isActive === false;
            return (
              <TouchableOpacity
                onPress={() => unavailable
                  ? toast.info(t('profile.productUnavailable'))
                  : navigation.navigate('Product', { id: item._id })}
                activeOpacity={unavailable ? 1 : 0.85}
                style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
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
                <TouchableOpacity onPress={() => handleRemove(item._id)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13,
                    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                  <X color="#fff" size={14} />
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
