import './app/i18n';

import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import AppNavigator from './app/navigation/AppNavigator';
import Toast from './app/components/Toast';
import ConfirmDialog from './app/components/ConfirmDialog';
import OrderSocketListener from './app/components/OrderSocketListener';
import { queryClient } from './app/utils/queryClient';
import { useAuthStore } from './app/store/authStore';
import {
  registerForPushNotifications,
  savePushTokenToServer,
  addNotificationListeners,
} from './app/utils/pushNotifications';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef    = useRef<any>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const register = async () => {
      const token = await registerForPushNotifications();
      if (token) await savePushTokenToServer(token);
    };
    register();

    const removeListeners = addNotificationListeners(
      () => {
        queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      },
      (orderId) => {
        if (navigationRef.current) {
          navigationRef.current.navigate('OrdersTab');
          setTimeout(() => {
            navigationRef.current?.navigate('OrderDetail', { id: orderId });
          }, 300);
        }
      },
    );

    return removeListeners;
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AppNavigator navigationRef={navigationRef} />
          <Toast />
          <ConfirmDialog />
          <OrderSocketListener />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
