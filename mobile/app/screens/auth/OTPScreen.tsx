import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View, StatusBar, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useColors } from '../../theme/useColors';
import { AuthStackParamList } from '../../navigation/types';

type Nav   = StackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'OTPVerify'>;

const RESEND_DELAY = 60;

const OTPScreen = () => {
  const Colors     = useColors();
  const { t }      = useTranslation();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { phone }  = route.params;

  const [localPhone, setLocalPhone] = useState(phone.replace(/\D/g, '').slice(0, 10));
  const [digits, setDigits]         = useState(['', '', '', '']);
  const [sending, setSending]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [error, setError]           = useState('');
  const [codeSent, setCodeSent]     = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const inputs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const handleSend = async () => {
    if (sending || countdown > 0) return;
    if (localPhone.length !== 10 || !localPhone.startsWith('0')) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setSending(true);
    setError('');
    try {
      await authApi.sendOTP(localPhone);
      setCodeSent(true);
      setDigits(['', '', '', '']);
      setCountdown(RESEND_DELAY);
      setTimeout(() => inputs[0].current?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 3) inputs[index + 1].current?.focus();
    if (digit && index === 3) {
      const code = [...next.slice(0, 3), digit].join('');
      if (code.length === 4) handleVerify(code);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const fullCode = code || digits.join('');
    if (fullCode.length < 4) { setError(t('auth.otpInvalid')); return; }
    setVerifying(true);
    setError('');
    try {
      await authApi.verifyOTP(localPhone, fullCode);
      navigation.replace('Register', { phone: localPhone, verified: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.otpInvalid'));
      setDigits(['', '', '', '']);
      setTimeout(() => inputs[0].current?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  const codeComplete = digits.every(d => d !== '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD700" />

      {/* ── Yellow header ── */}
      <YStack backgroundColor="#FFD700" paddingTop={52} paddingHorizontal={20} paddingBottom={40} alignItems="center">
        <XStack width="100%" alignItems="center" marginBottom={24}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft color="#1A1A1A" size={20} />
          </TouchableOpacity>
          <Text fontSize={17} fontWeight="700" color="#1A1A1A" marginLeft={12}>{t('auth.otpTitle')}</Text>
        </XStack>

        <YStack width={68} height={68} borderRadius={34}
          backgroundColor="rgba(0,0,0,0.10)" alignItems="center" justifyContent="center" marginBottom={14}>
          <MessageSquare color="#1A1A1A" size={30} />
        </YStack>
        <Text fontSize={15} fontWeight="700" color="#1A1A1A" textAlign="center">
          {codeSent ? t('auth.otpDesc') : t('auth.phone')}
        </Text>
        {codeSent && (
          <Text fontSize={16} fontWeight="800" color="#1A1A1A" marginTop={4}>
            +996 {localPhone.slice(0, 3)} {localPhone.slice(3, 6)} {localPhone.slice(6)}
          </Text>
        )}
      </YStack>

      {/* ── White card ── */}
      <YStack flex={1} backgroundColor="#FFFFFF"
        borderTopLeftRadius={28} borderTopRightRadius={28} marginTop={-24}>
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 }}>

        {/* Phone input (only before code sent) */}
        {!codeSent && (
          <YStack gap={6} marginBottom={24}>
            <Text fontSize={13} fontWeight="600" color="#6B7280">{t('auth.phone')}</Text>
            <TextInput
              value={localPhone}
              onChangeText={v => {
                setLocalPhone(v.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              placeholder="0XXXXXXXXX"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={10}
              style={{
                height: 54, borderRadius: 14,
                borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E5E7EB',
                backgroundColor: '#F9FAFB',
                paddingHorizontal: 18, fontSize: 18, fontWeight: '700',
                color: '#1A1A1A', textAlign: 'center', letterSpacing: 2,
              }}
            />
          </YStack>
        )}

        {/* OTP boxes */}
        {codeSent && (
          <YStack alignItems="center" gap={8} marginBottom={24}>
            <Text fontSize={13} color="#9CA3AF" textAlign="center" marginBottom={16}>
              {t('auth.otpPlaceholder')}
            </Text>
            <XStack gap={14} justifyContent="center">
              {digits.map((d, i) => (
                <View key={i} style={[
                  styles.box,
                  { borderColor: error ? '#EF4444' : d ? '#FFD700' : '#E5E7EB',
                    backgroundColor: d ? '#FFFBEB' : '#F9FAFB' },
                ]}>
                  <TextInput
                    ref={inputs[i]}
                    value={d}
                    onChangeText={v => handleDigit(i, v)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={[styles.boxText, { color: '#1A1A1A' }]}
                  />
                </View>
              ))}
            </XStack>
          </YStack>
        )}

        {!!error && (
          <YStack backgroundColor="#FEF2F2" borderRadius={12} padding={12} marginBottom={16}
            borderWidth={1} borderColor="#FECACA">
            <Text color="#EF4444" fontSize={13} textAlign="center">{error}</Text>
          </YStack>
        )}

        {!codeSent ? (
          <TouchableOpacity onPress={handleSend} disabled={sending}
            style={{ backgroundColor: '#FFD700', borderRadius: 16, height: 56,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#D4AF00', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
            {sending
              ? <Spinner color="#1A1A1A" />
              : <Text fontWeight="800" color="#1A1A1A" fontSize={16}>{t('auth.otpSend')}</Text>}
          </TouchableOpacity>
        ) : (
          <YStack gap={16} alignItems="center">
            <TouchableOpacity onPress={() => handleVerify()} disabled={!codeComplete || verifying}
              style={{ backgroundColor: codeComplete ? '#FFD700' : '#E5E7EB',
                borderRadius: 16, height: 56, width: '100%',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: codeComplete ? '#D4AF00' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 8, elevation: codeComplete ? 6 : 0 }}>
              {verifying
                ? <Spinner color="#1A1A1A" />
                : <Text fontWeight="800" fontSize={16}
                    color={codeComplete ? '#1A1A1A' : '#9CA3AF'}>
                    {t('auth.otpVerify')}
                  </Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSend} disabled={countdown > 0 || sending}
              style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
              <Text fontSize={14} fontWeight="600"
                color={countdown > 0 ? '#9CA3AF' : '#16A34A'} textAlign="center">
                {countdown > 0
                  ? t('auth.otpResendIn', { sec: countdown })
                  : t('auth.otpResend')}
              </Text>
            </TouchableOpacity>
          </YStack>
        )}

      </ScrollView>
      </YStack>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  box: {
    width: 64,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
  },
});

export default OTPScreen;
