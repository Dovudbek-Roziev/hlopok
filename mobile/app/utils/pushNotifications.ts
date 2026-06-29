import Constants from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';
import api from '../api/client';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

const TEXTS = {
  ru: {
    title: '🔔 Включите уведомления',
    message:
      'Уведомления нужны, чтобы:\n\n• Вы знали статус вашего заказа\n• Получали информацию об акциях и скидках\n• Не пропускали важные новости магазина\n\nПожалуйста, разрешите уведомления в настройках.',
    settings: 'Открыть настройки',
    cancel: 'Позже',
  },
  ky: {
    title: '🔔 Билдирүүлөрдү жандырыңыз',
    message:
      'Билдирүүлөр зарыл, себеби:\n\n• Буйрутмаңыздын абалын билесиз\n• Акциялар жана арзандатуулар жөнүндө кабар аласыз\n• Дүкөндүн маанилүү жаңылыктарын өткөрүп жибербейсиз\n\nАдалыктар жөндөөсүнөн билдирүүлөргө уруксат бериңиз.',
    settings: 'Жөндөөлөрдү ачуу',
    cancel: 'Кийинчерээк',
  },
};

const showEducationalAlert = (lang: string) => {
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.ru;
  Alert.alert(t.title, t.message, [
    { text: t.cancel, style: 'cancel' },
    { text: t.settings, onPress: () => Linking.openSettings() },
  ]);
};

export const registerForPushNotifications = async (lang = 'ru'): Promise<string | null> => {
  if (isExpoGo) return null;

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert:  true,
        shouldPlaySound:  true,
        shouldSetBadge:   true,
        shouldShowBanner: true,
        shouldShowList:   true,
      }),
    });

    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      // Ruxsat bor — token olamiz
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Заказы / Буйрутмалар',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {}
      );
      return token.data;
    }

    if (canAskAgain) {
      // Tizim dialogi chiqarish
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Rad etdi — tushuntirish alertini ko'rsatish
        showEducationalAlert(lang);
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Заказы / Буйрутмалар',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
      }
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {}
      );
      return token.data;
    }

    // Doimiy rad etilgan — sozlamalarga yo'naltir
    showEducationalAlert(lang);
    return null;
  } catch {
    return null;
  }
};

export const savePushTokenToServer = async (token: string) => {
  try {
    await api.put('/auth/push-token', { token });
  } catch {}
};

export const addNotificationListeners = (
  onReceived: () => void,
  onResponse: (orderId: string) => void,
) => {
  if (isExpoGo) return () => {};

  let receivedSub: any;
  let responseSub: any;

  import('expo-notifications').then(Notifications => {
    receivedSub = Notifications.addNotificationReceivedListener(onReceived);
    responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.orderId) onResponse(data.orderId);
    });
  });

  return () => {
    receivedSub?.remove();
    responseSub?.remove();
  };
};
