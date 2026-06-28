import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

import RegisterScreen       from '../screens/auth/RegisterScreen';
import LoginScreen          from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPScreen            from '../screens/auth/OTPScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login"          component={LoginScreen} />
    <Stack.Screen name="OTPVerify"      component={OTPScreen} />
    <Stack.Screen name="Register"       component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
