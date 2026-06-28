import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { getToken, getLang } from '../utils/storage';
import i18n from '../i18n';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashAnimation from '../components/SplashAnimation';

const LightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FFFFFF' },
};

const RootStack = createStackNavigator();

// Closes the auth modal automatically when user logs in
const AuthListener = () => {
  const navigation    = useNavigation<any>();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const prevAuth      = useRef(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      navigation.navigate('MainApp');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  return null;
};

// Wraps MainNavigator with the auth listener (both rendered inside NavigationContainer)
const MainScreen = () => (
  <>
    <AuthListener />
    <MainNavigator />
  </>
);

const AppNavigator = ({ navigationRef }: { navigationRef?: React.MutableRefObject<any> }) => {
  const { isLoading, setUser, setLoading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, lang] = await Promise.all([getToken(), getLang()]);
        if (lang) i18n.changeLanguage(lang);
        if (token) {
          const response = await authApi.getMe();
          setUser(response.data.user, token);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    checkAuth();

    // Keep splash until auth check AND minimum duration both complete
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);


  if (isLoading || showSplash) {
    return <SplashAnimation />;
  }

  return (
    <NavigationContainer theme={LightTheme} ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainApp" component={MainScreen} />
        <RootStack.Screen
          name="AuthNavigator"
          component={AuthNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
