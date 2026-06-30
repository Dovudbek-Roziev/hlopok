import React, { useState, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Eye, EyeOff, Phone, Lock, X } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import HlopokLogo from '../../components/HlopokLogo';
import { AuthStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<AuthStackParamList>;

const Field = ({ label, icon: Icon, error, ...props }: any) => (
  <YStack gap={6}>
    <Text fontSize={13} fontWeight="600" color="#6B7280">{label}</Text>
    <XStack alignItems="center">
      <YStack position="absolute" left={14} zIndex={1}>
        <Icon color={error ? '#EF4444' : '#9CA3AF'} size={18} />
      </YStack>
      <TextInput
        {...props}
        style={{
          flex: 1, height: 52, borderRadius: 14,
          borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E5E7EB',
          backgroundColor: '#F9FAFB', paddingLeft: 44, paddingRight: 48,
          fontSize: 15, color: '#1A1A1A', fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
        }}
        placeholderTextColor="#9CA3AF"
      />
      {props.rightEl}
    </XStack>
  </YStack>
);

const LoginScreen = () => {
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { setUser } = useAuthStore();

  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError(t('auth.invalidPhone')); return; }
    if (!password)           { setError(t('auth.emptyFields'));  return; }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.loginByPhone(digits, password);
      setUser(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD700" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* ── Yellow hero ── */}
        <YStack backgroundColor="#FFD700" paddingTop={54} paddingBottom={52} alignItems="center" gap={6}>
          <TouchableOpacity
            onPress={() => navigation.getParent?.()?.goBack?.()}
            style={{ position: 'absolute', top: 54, right: 20, width: 36, height: 36,
              borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)',
              alignItems: 'center', justifyContent: 'center' }}>
            <X color="#1A1A1A" size={18} />
          </TouchableOpacity>
          <HlopokLogo size="lg" />
          <Text fontSize={13} color="rgba(0,0,0,0.55)" marginTop={4} textAlign="center" paddingHorizontal={32}>
            {t('auth.loginToAccountDesc')}
          </Text>
        </YStack>

        {/* ── White card ── */}
        <Animated.View style={{
          flex: 1, backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          marginTop: -24,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40,
          shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05, elevation: 4,
        }}>

          <Text fontSize={22} fontWeight="800" color="#1A1A1A" marginBottom={6}>
            {t('auth.loginToAccount')}
          </Text>
          <Text fontSize={13} color="#9CA3AF" marginBottom={28}>{t('auth.phone')} {t('auth.password').toLowerCase()}</Text>

          <YStack gap={16}>

            <Field
              label={t('auth.phone')}
              icon={Phone}
              error={!!error}
              value={phone}
              onChangeText={(v: string) => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setError(''); }}
              placeholder="0XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Field
              label={t('auth.password')}
              icon={Lock}
              error={!!error}
              value={password}
              onChangeText={(v: string) => { setPassword(v); setError(''); }}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry={!showPwd}
              rightEl={
                <TouchableOpacity onPress={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 14 }}>
                  {showPwd ? <EyeOff color="#9CA3AF" size={20} /> : <Eye color="#9CA3AF" size={20} />}
                </TouchableOpacity>
              }
            />

          </YStack>

          <XStack justifyContent="flex-end" marginTop={10} marginBottom={20}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text color="#16A34A" fontSize={13} fontWeight="600">{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </XStack>

          {!!error && (
            <YStack backgroundColor="#FEF2F2" borderRadius={12} padding={12} marginBottom={16}
              borderWidth={1} borderColor="#FECACA">
              <Text color="#EF4444" fontSize={13}>{error}</Text>
            </YStack>
          )}

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ backgroundColor: '#FFD700', borderRadius: 16, height: 56,
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              shadowColor: '#D4AF00', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            {loading
              ? <Spinner color="#1A1A1A" />
              : <Text fontWeight="800" color="#1A1A1A" fontSize={16}>{t('auth.login')}</Text>}
          </TouchableOpacity>

          <XStack justifyContent="center" gap={4}>
            <Text color="#9CA3AF" fontSize={14}>{t('auth.noAccountPrefix')}?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OTPVerify', { phone: phone.trim() })}>
              <Text color="#16A34A" fontWeight="700" fontSize={14}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </XStack>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
