import './app/i18n';

import { useEffect, useRef } from 'react';
import { StatusBar as NativeStatusBar } from 'react-native';
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
import { savePushToken } from './app/utils/storage';
import { useAuthStore } from './app/store/authStore';
import {
  registerForPushNotifications,
  savePushTokenToServer,
  addNotificationListeners,
} from './app/utils/pushNotifications';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<any>(null);
  const pendingPush = useRef<{ orderId?: string; screen?: string } | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  const openPush = (destination: { orderId?: string; screen?: string }) => {
    if (!navigationRef.current?.isReady?.()) {
      pendingPush.current = destination;
      return;
    }
    if (destination.orderId) {
      navigationRef.current.navigate('MainApp', {
        screen: 'OrdersTab',
        params: { screen: 'OrderDetail', params: { id: destination.orderId } },
      });
    } else if (destination.screen === 'BonusCard') {
      navigationRef.current.navigate('MainApp', {
        screen: 'ProfileTab',
        params: { screen: 'BonusCard' },
      });
    } else if (destination.screen === 'HomeTab') {
      navigationRef.current.navigate('MainApp', {
        screen: 'HomeTab',
        params: { screen: 'Home' },
      });
    }
  };

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const register = async () => {
      const lang = user?.language || 'ru';
      const token = await registerForPushNotifications(lang);
      if (token) {
        await savePushToken(token);
        await savePushTokenToServer(token);
      }
    };

    // Ask once when the authenticated session starts; do not nag on every resume.
    register();

    const removeListeners = addNotificationListeners(
      (orderId) => {
        queryClient.invalidateQueries({ queryKey: ['my-orders'] });
        if (orderId) queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      },
      openPush,
    );

    return () => {
      removeListeners();
    };
  }, [isAuthenticated, user?.language]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FBF5EC' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NativeStatusBar barStyle="dark-content" backgroundColor="#FBF5EC" />
          <StatusBar style="dark" />
          <AppNavigator navigationRef={navigationRef} onReady={() => {
            if (pendingPush.current) {
              const destination = pendingPush.current;
              pendingPush.current = null;
              openPush(destination);
            }
          }} />
          <Toast />
          <ConfirmDialog />
          <OrderSocketListener />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
