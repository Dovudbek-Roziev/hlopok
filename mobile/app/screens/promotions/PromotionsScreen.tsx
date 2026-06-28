// Aksiyalar ro'yxati ekrani / Promotions list screen
import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Tag, Package } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { promotionsApi } from '../../api/categories';
import { useColors } from '../../theme/useColors';

const PromotionsScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsApi.getPromotions().then(r => r.data.promotions),
  });

  const promotions = data || [];

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      <XStack backgroundColor={Colors.bg} paddingTop={52} paddingHorizontal={16} paddingBottom={14}
        alignItems="center" gap={12}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.black} size={24} />
        </TouchableOpacity>
        <Text fontSize={20} fontWeight="700" color={Colors.black}>{t('home.promotions')}</Text>
      </XStack>

      {isLoading ? (
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
      ) : promotions.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={14} padding={32}>
          <Tag color={Colors.grayLight} size={72} />
          <Text color={Colors.gray} fontSize={15} textAlign="center">{t('promotions.empty')}</Text>
        </YStack>
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('PromotionDetail', { id: item._id })}
              activeOpacity={0.9}
              style={{ backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden',
                borderWidth: 1, borderColor: Colors.border }}>
              {item.image
                ? <Image source={{ uri: item.image }} width="100%" height={150} resizeMode="cover" />
                : <YStack width="100%" height={150} backgroundColor={Colors.grayLight} alignItems="center" justifyContent="center"><Tag color={Colors.gray} size={36} /></YStack>
              }
              <YStack padding={14} gap={6}>
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <Text fontWeight="700" fontSize={16} color={Colors.black} flex={1} marginRight={8}>
                    {item[`title_${lang}`]}
                  </Text>
                  {!!item.discountPercent && (
                    <YStack backgroundColor={Colors.redBg} borderRadius={20} paddingHorizontal={10} paddingVertical={4}>
                      <Text color={Colors.red} fontSize={13} fontWeight="700">-{item.discountPercent}%</Text>
                    </YStack>
                  )}
                </XStack>
                {!!item[`description_${lang}`] && (
                  <Text color={Colors.gray} fontSize={13} numberOfLines={2}>{item[`description_${lang}`]}</Text>
                )}
              </YStack>
            </TouchableOpacity>
          )}
        />
      )}
    </YStack>
    </ScreenWrapper>
  );
};

export default PromotionsScreen;
