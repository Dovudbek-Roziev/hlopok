import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/client';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

const TEXTS = {
  ru: {
    title: 'Включить уведомления?',
    message: 'Уведомления сообщат об изменении статуса заказа и важных новостях магазина.',
    settings: 'Открыть настройки',
    cancel: 'Позже',
    channel: 'Заказы и новости',
  },
  ky: {
    title: 'Билдирмелерди күйгүзөсүзбү?',
    message: 'Билдирмелер буйрутманын абалы жана дүкөндүн маанилүү жаңылыктары тууралуу кабарлайт.',
    settings: 'Жөндөөлөрдү ачуу',
    cancel: 'Кийинчерээк',
    channel: 'Буйрутмалар жана жаңылыктар',
  },
};

export const registerForPushNotifications = async (lang = 'ru'): Promise<string | null> => {
  if (isExpoGo) return null;

  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.ru;
      await Notifications.setNotificationChannelAsync('orders', {
        name: t.channel, importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250], lightColor: '#FFD700', sound: 'default',
      });
    }
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      if (!canAskAgain || await AsyncStorage.getItem('push-permission-requested')) return null;
      await AsyncStorage.setItem('push-permission-requested', '1');
      const requested = await Notifications.requestPermissionsAsync();
      if (requested.status !== 'granted') return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
    return token.data;
  } catch {
    return null;
  }
};

export const savePushTokenToServer = async (token: string) => {
  try {
    await api.put('/auth/push-token', { token });
  } catch {
    // Push delivery is optional; an API failure must not interrupt app use.
  }
};

export const addNotificationListeners = (
  onReceived: (orderId?: string) => void,
  onResponse: (destination: { orderId?: string; screen?: string }) => void,
) => {
  if (isExpoGo) return () => {};

  let cancelled = false;
  let receivedSub: { remove: () => void } | undefined;
  let responseSub: { remove: () => void } | undefined;
  const handled = new Set<string>();

  import('expo-notifications').then(Notifications => {
    if (cancelled) return;
    const handleResponse = (response: { notification: { request: { identifier: string; content: { data?: Record<string, unknown> } } } }) => {
      const id = response.notification.request.identifier;
      if (handled.has(id)) return;
      const data = response.notification.request.content.data as { orderId?: string; screen?: string };
      if (!data?.orderId && data?.screen !== 'BonusCard' && data?.screen !== 'HomeTab') return;
      handled.add(id);
      onResponse(data);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    receivedSub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as { orderId?: string };
      onReceived(data?.orderId);
    });
    responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then(response => { if (!cancelled && response) handleResponse(response); })
      .catch(() => {});
  }).catch(() => {});

  return () => {
    cancelled = true;
    receivedSub?.remove();
    responseSub?.remove();
  };
};
