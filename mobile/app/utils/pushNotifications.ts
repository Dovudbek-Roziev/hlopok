import Constants from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';
import api from '../api/client';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

const TEXTS = {
  ru: {
    title: 'Разрешите уведомления',
    message: 'Включите уведомления, чтобы получать информацию о заказах и акциях.',
    settings: 'Открыть настройки',
    cancel: 'Позже',
  },
  ky: {
    title: 'Билдирүүлөргө уруксат бериңиз',
    message: 'Буйрутмалар жана акциялар жөнүндө билдирүү алуу үчүн билдирүүлөрдү жандырыңыз.',
    settings: 'Жөндөөлөрдү ачуу',
    cancel: 'Кийинчерээк',
  },
};

const showSettingsAlert = (lang: string) => {
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
      // Ruxsat bor — token olish
    } else if (canAskAgain) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showSettingsAlert(lang);
        return null;
      }
    } else {
      // Doimiy rad etilgan — sozlamalarga yo'naltir
      showSettingsAlert(lang);
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
