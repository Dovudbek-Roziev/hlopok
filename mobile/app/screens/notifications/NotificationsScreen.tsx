import React, { useCallback } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Bell, Trash2, ChevronLeft, Package } from 'lucide-react-native';
import { useAppStore, AppNotification } from '../../store/appStore';
import { useColors } from '../../theme/useColors';
import ScreenWrapper from '../../components/ScreenWrapper';

const STATUS_BG: Record<string, string> = {
  pending:   '#FFF3DC',
  confirmed: '#DCF0FF',
  preparing: '#F0DCFF',
  ready:     '#DCFFE8',
  cancelled: '#FFE5E5',
};
const STATUS_TEXT: Record<string, string> = {
  pending:   '#E6A800',
  confirmed: '#0077CC',
  preparing: '#7700CC',
  ready:     '#00A63E',
  cancelled: '#CC0000',
};

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const Colors = useColors();
  const { notifications, clearNotif, removeNotif, clearAllNotifs } = useAppStore();

  useFocusEffect(useCallback(() => { clearNotif(); }, []));

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return t('notifications.justNow');
    if (mins < 60) return t('notifications.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('notifications.daysAgo', { count: days });
  };

  const handlePress = (item: AppNotification) => {
    removeNotif(item.id);
    navigation.navigate('OrdersTab', { screen: 'OrderDetail', params: { id: item.orderId } });
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.7}>
      <XStack
        backgroundColor={Colors.white}
        borderRadius={12}
        padding={14}
        marginBottom={10}
        borderWidth={1}
        borderColor={Colors.border}
        alignItems="center"
        gap={12}
      >
        <YStack
          width={44} height={44} borderRadius={22}
          backgroundColor={STATUS_BG[item.status] || '#F0F0F0'}
          alignItems="center" justifyContent="center" flexShrink={0}
        >
          <Package size={20} color={STATUS_TEXT[item.status] || '#9E9E9E'} />
        </YStack>

        <YStack flex={1}>
          <Text fontSize={14} fontWeight="600" color={Colors.black}>
            {t('notifications.orderTitle', { number: item.orderNumber })}
          </Text>
          <XStack alignItems="center" gap={6} marginTop={4}>
            <YStack
              paddingHorizontal={8} paddingVertical={2} borderRadius={20}
              backgroundColor={STATUS_BG[item.status] || '#F0F0F0'}
            >
              <Text fontSize={11} fontWeight="700" color={STATUS_TEXT[item.status] || '#9E9E9E'}>
                {t(`orders.status_${item.status}`)}
              </Text>
            </YStack>
            <Text fontSize={11} color={Colors.gray}>{formatTime(item.time)}</Text>
          </XStack>
        </YStack>

        <TouchableOpacity onPress={() => removeNotif(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={Colors.gray} />
        </TouchableOpacity>
      </XStack>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>
      {/* Header */}
      <XStack
        backgroundColor={Colors.white}
        paddingTop={52} paddingBottom={14}
        paddingHorizontal={16}
        borderBottomWidth={1} borderBottomColor={Colors.border}
        alignItems="center" justifyContent="space-between"
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text fontSize={17} fontWeight="700" color={Colors.black}>
          {t('notifications.title')}
        </Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={clearAllNotifs}>
            <Text fontSize={13} color={Colors.gray}>{t('notifications.clearAll')}</Text>
          </TouchableOpacity>
        ) : (
          <YStack width={40} />
        )}
      </XStack>

      {/* List */}
      {notifications.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Bell size={52} color={Colors.border} />
          <Text fontSize={15} color={Colors.gray}>{t('notifications.empty')}</Text>
        </YStack>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
    </ScreenWrapper>
  );
};

export default NotificationsScreen;
