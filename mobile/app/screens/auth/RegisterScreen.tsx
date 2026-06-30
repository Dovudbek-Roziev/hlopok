import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Eye, EyeOff, Phone, User, Lock, Check, Venus, Mars } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { AuthStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'Register'>;

const Field = ({ label, icon: Icon, rightEl, error, ...props }: any) => (
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
          backgroundColor: '#F9FAFB', paddingLeft: 44, paddingRight: rightEl ? 48 : 16,
          fontSize: 15, color: '#1A1A1A',
          fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
        }}
        placeholderTextColor="#9CA3AF"
      />
      {rightEl}
    </XStack>
  </YStack>
);

const RegisterScreen = () => {
  const Colors     = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { setUser } = useAuthStore();

  const verified = route.params?.verified === true;

  const [form, setForm] = useState({
    phone:           route.params?.phone || '',
    firstName:       '',
    lastName:        '',
    gender:          'female' as 'male' | 'female',
    password:        '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd]   = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const update = (key: string, value: string) => {
    setError('');
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleRegister = async () => {
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10)  { setError(t('auth.invalidPhone')); return; }
    if (!verified) {
      navigation.replace('OTPVerify', { phone: form.phone });
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) { setError(t('auth.fillAllFields')); return; }
    if (!form.password)                                   { setError(t('auth.fillAllFields')); return; }
    if (form.password !== form.confirmPassword)           { setError(t('auth.passwordMismatch')); return; }
    if (form.password.length < 8)                        { setError(t('auth.passwordTooShort')); return; }
    setLoading(true);
    try {
      const res = await authApi.register({
        phone:     form.phone.trim(),
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        gender:    form.gender,
        password:  form.password,
        language:  (i18n.language === 'ky' ? 'ky' : 'ru') as 'ru' | 'ky',
      });
      setUser(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD700" />

      {/* ── Yellow header ── */}
      <YStack backgroundColor="#FFD700" paddingTop={52} paddingHorizontal={20} paddingBottom={32}>
        <XStack alignItems="center" gap={12} marginBottom={16}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft color="#1A1A1A" size={20} />
          </TouchableOpacity>
          <Text fontSize={17} fontWeight="700" color="#1A1A1A">{t('auth.register')}</Text>
        </XStack>
        <YStack>
          <Text fontSize={24} fontWeight="800" color="#1A1A1A">{t('auth.createAccount')}</Text>
          <Text fontSize={13} color="rgba(0,0,0,0.55)" marginTop={4}>{t('auth.createAccountHint')}</Text>
        </YStack>
      </YStack>

      {/* ── White body ── */}
      <YStack flex={1} backgroundColor="#FFFFFF" borderTopLeftRadius={28} borderTopRightRadius={28} marginTop={-20}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 20 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Phone */}
          <YStack gap={6}>
            <Text fontSize={13} fontWeight="600" color="#6B7280">{t('auth.phone')}</Text>
            <XStack alignItems="center">
              <YStack position="absolute" left={14} zIndex={1}>
                <Phone color={verified ? '#16A34A' : '#9CA3AF'} size={18} />
              </YStack>
              <TextInput
                value={form.phone}
                onChangeText={v => !verified && update('phone', v.replace(/\D/g, '').slice(0, 10))}
                placeholder="0XXXXXXXXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!verified}
                style={{
                  flex: 1, height: 52, borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: verified ? '#16A34A' : '#E5E7EB',
                  backgroundColor: verified ? '#F0FDF4' : '#F9FAFB',
                  paddingLeft: 44, paddingRight: verified ? 48 : 16,
                  fontSize: 15, color: '#1A1A1A',
                }}
              />
              {verified && (
                <YStack position="absolute" right={14}
                  width={24} height={24} borderRadius={12}
                  backgroundColor="#16A34A" alignItems="center" justifyContent="center">
                  <Check color="#fff" size={14} />
                </YStack>
              )}
            </XStack>
          </YStack>

          {/* Name row */}
          <XStack gap={12}>
            <YStack flex={1} gap={6}>
              <Text fontSize={13} fontWeight="600" color="#6B7280">{t('auth.firstName')}</Text>
              <XStack alignItems="center">
                <YStack position="absolute" left={14} zIndex={1}>
                  <User color="#9CA3AF" size={18} />
                </YStack>
                <TextInput
                  value={form.firstName}
                  onChangeText={v => update('firstName', v)}
                  placeholder={t('auth.firstNamePlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    flex: 1, height: 52, borderRadius: 14,
                    borderWidth: 1.5, borderColor: '#E5E7EB',
                    backgroundColor: '#F9FAFB', paddingLeft: 44, paddingRight: 12,
                    fontSize: 15, color: '#1A1A1A',
                  }}
                />
              </XStack>
            </YStack>
            <YStack flex={1} gap={6}>
              <Text fontSize={13} fontWeight="600" color="#6B7280">{t('auth.lastName')}</Text>
              <TextInput
                value={form.lastName}
                onChangeText={v => update('lastName', v)}
                placeholder={t('auth.lastNamePlaceholder')}
                placeholderTextColor="#9CA3AF"
                style={{
                  height: 52, borderRadius: 14,
                  borderWidth: 1.5, borderColor: '#E5E7EB',
                  backgroundColor: '#F9FAFB', paddingHorizontal: 14,
                  fontSize: 15, color: '#1A1A1A',
                }}
              />
            </YStack>
          </XStack>

          {/* Gender */}
          <YStack gap={8}>
            <Text fontSize={13} fontWeight="600" color="#6B7280">{t('auth.gender')}</Text>
            <XStack gap={10}>
              {(['female', 'male'] as const).map(g => {
                const active = form.gender === g;
                const Icon   = g === 'female' ? Venus : Mars;
                return (
                  <TouchableOpacity key={g} onPress={() => update('gender', g)}
                    style={{ flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5,
                      borderColor: active ? '#FFD700' : '#E5E7EB',
                      backgroundColor: active ? '#FFD700' : '#F9FAFB',
                      alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 8 }}>
                    <Icon color={active ? '#1A1A1A' : '#9CA3AF'} size={18} />
                    <Text fontWeight={active ? '700' : '500'} color={active ? '#1A1A1A' : '#6B7280'} fontSize={14}>
                      {g === 'female' ? t('auth.female') : t('auth.male')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </XStack>
          </YStack>

          {/* Password */}
          <Field
            label={t('auth.password')}
            icon={Lock}
            value={form.password}
            onChangeText={(v: string) => update('password', v)}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry={!showPwd}
            rightEl={
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 14 }}>
                {showPwd ? <EyeOff color="#9CA3AF" size={20} /> : <Eye color="#9CA3AF" size={20} />}
              </TouchableOpacity>
            }
          />

          {/* Confirm password */}
          <Field
            label={t('auth.confirmPassword')}
            icon={Lock}
            value={form.confirmPassword}
            onChangeText={(v: string) => update('confirmPassword', v)}
            placeholder={t('auth.confirmPassword')}
            secureTextEntry={!showPwd2}
            rightEl={
              <TouchableOpacity onPress={() => setShowPwd2(v => !v)}
                style={{ position: 'absolute', right: 14 }}>
                {showPwd2 ? <EyeOff color="#9CA3AF" size={20} /> : <Eye color="#9CA3AF" size={20} />}
              </TouchableOpacity>
            }
          />

          {!!error && (
            <YStack backgroundColor="#FEF2F2" borderRadius={12} padding={12}
              borderWidth={1} borderColor="#FECACA">
              <Text color="#EF4444" fontSize={13}>{error}</Text>
            </YStack>
          )}

          <TouchableOpacity onPress={handleRegister} disabled={loading}
            style={{ backgroundColor: '#FFD700', borderRadius: 16, height: 56,
              alignItems: 'center', justifyContent: 'center', marginTop: 4,
              shadowColor: '#D4AF00', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            {loading
              ? <Spinner color="#1A1A1A" />
              : <Text fontWeight="800" color="#1A1A1A" fontSize={16}>{t('auth.register')}</Text>}
          </TouchableOpacity>

          <XStack justifyContent="center" gap={4}>
            <Text color="#9CA3AF" fontSize={14}>{t('auth.haveAccountPrefix')}?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text color="#16A34A" fontWeight="700" fontSize={14}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </XStack>

        </ScrollView>
      </YStack>

      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
