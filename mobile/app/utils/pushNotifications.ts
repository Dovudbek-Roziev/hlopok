import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/client';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

export const registerForPushNotifications = async (): Promise<string | null> => {
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

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

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
