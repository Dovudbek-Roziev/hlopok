import React, { useState } from 'react';
import { TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock, Phone, KeyRound, CircleCheck } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';
import { API_URL } from '../../utils/config';

type Step = 'phone' | 'code' | 'password' | 'success';

const ForgotPasswordScreen = () => {
  const Colors     = useColors();
  const { t }      = useTranslation();
  const navigation = useNavigation<any>();

  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError]       = useState('');

  const inp = {
    height: 52, borderRadius: 12, paddingHorizontal: 16,
    fontSize: 16, color: Colors.black,
    backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border,
  };

  const startCountdown = () => {
    setCountdown(60);
    const id = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(id); return 0; } return prev - 1; });
    }, 1000);
  };

  const sendCode = async (resend = false) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError(t('auth.forgotPhone') + ' — 0XXXXXXXXX');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/auth/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message || t('common.error')); return; }
      startCountdown();
      if (!resend) setStep('code');
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const verifyAndReset = async () => {
    if (code.length !== 4) {
      setError(t('auth.forgotCodePlaceholder'));
      return;
    }
    if (newPwd.length < 6) {
      setError(t('auth.forgotNewPasswordPlaceholder'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const clean = phone.replace(/\D/g, '');
      const r = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, code, newPassword: newPwd }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message || t('common.error')); return; }
      setStep('success');
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenWrapper>
      <YStack flex={1} backgroundColor={Colors.white}>

        {/* Header */}
        <XStack paddingTop={52} paddingHorizontal={16} paddingBottom={8} alignItems="center" gap={10}>
          {step !== 'success' && (
            <TouchableOpacity
              onPress={() => step === 'phone' ? navigation.goBack() : setStep(step === 'code' ? 'phone' : 'code')}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg,
                alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft color={Colors.black} size={22} />
            </TouchableOpacity>
          )}
          <Text fontSize={16} fontWeight="700" color={Colors.black}>{t('auth.forgotPassword')}</Text>
        </XStack>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <YStack flex={1} paddingHorizontal={24} paddingTop={24} gap={28}>

            {/* ── Step: phone ── */}
            {step === 'phone' && (
              <>
                <YStack alignItems="center" gap={14}>
                  <YStack width={80} height={80} borderRadius={40} backgroundColor={Colors.yellow}
                    alignItems="center" justifyContent="center"
                    style={{ shadowColor: Colors.yellow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
                    <Lock color={Colors.black} size={36} />
                  </YStack>
                  <YStack gap={6} alignItems="center">
                    <Text fontSize={22} fontWeight="800" color={Colors.black} textAlign="center">
                      {t('auth.forgotTitle')}
                    </Text>
                    <Text fontSize={14} color={Colors.gray} textAlign="center" lineHeight={22}>
                      {t('auth.forgotDesc')}
                    </Text>
                  </YStack>
                </YStack>

                <YStack gap={10}>
                  <Text fontSize={13} fontWeight="600" color={Colors.black}>{t('auth.forgotPhone')}</Text>
                  <XStack alignItems="center" gap={8}
                    style={{ ...inp, flexDirection: 'row', alignItems: 'center' }}>
                    <Phone color={Colors.gray} size={18} />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="0700 000 000"
                      placeholderTextColor={Colors.gray}
                      keyboardType="phone-pad"
                      style={{ flex: 1, fontSize: 16, color: Colors.black, marginLeft: 8 }}
                    />
                  </XStack>
                </YStack>

                {!!error && (
                  <YStack backgroundColor={Colors.redBg} borderRadius={12} padding={12}
                    borderWidth={1} borderColor={Colors.red}>
                    <Text color={Colors.red} fontSize={13}>{error}</Text>
                  </YStack>
                )}
                <TouchableOpacity onPress={() => { setError(''); sendCode(false); }} disabled={loading}
                  style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
                    alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                  <Text fontWeight="800" color={Colors.black} fontSize={15}>
                    {loading ? '...' : t('auth.forgotSendCode')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Step: code + password ── */}
            {step === 'code' && (
              <>
                <YStack alignItems="center" gap={14}>
                  <YStack width={80} height={80} borderRadius={40} backgroundColor={Colors.greenBg}
                    alignItems="center" justifyContent="center">
                    <KeyRound color={Colors.green} size={36} />
                  </YStack>
                  <Text fontSize={14} color={Colors.gray} textAlign="center" lineHeight={22}>
                    {t('auth.forgotCodeSent', { phone })}
                  </Text>
                </YStack>

                <YStack gap={16}>
                  <YStack gap={8}>
                    <Text fontSize={13} fontWeight="600" color={Colors.black}>{t('auth.forgotCode')}</Text>
                    <TextInput
                      value={code}
                      onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder={t('auth.forgotCodePlaceholder')}
                      placeholderTextColor={Colors.gray}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={{ ...inp, textAlign: 'center', fontSize: 28, fontWeight: '700',
                        letterSpacing: 12, color: Colors.black }}
                    />
                  </YStack>

                  <YStack gap={8}>
                    <Text fontSize={13} fontWeight="600" color={Colors.black}>{t('auth.forgotNewPassword')}</Text>
                    <TextInput
                      value={newPwd}
                      onChangeText={setNewPwd}
                      placeholder={t('auth.forgotNewPasswordPlaceholder')}
                      placeholderTextColor={Colors.gray}
                      secureTextEntry
                      style={{ ...inp, color: Colors.black }}
                    />
                  </YStack>
                </YStack>

                <YStack gap={12}>
                  {!!error && (
                    <YStack backgroundColor={Colors.redBg} borderRadius={12} padding={12}
                      borderWidth={1} borderColor={Colors.red}>
                      <Text color={Colors.red} fontSize={13}>{error}</Text>
                    </YStack>
                  )}
                  <TouchableOpacity onPress={verifyAndReset} disabled={loading}
                    style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
                      alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                    <Text fontWeight="800" color={Colors.black} fontSize={15}>
                      {loading ? '...' : t('auth.forgotSave')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => sendCode(true)} disabled={countdown > 0 || loading}>
                    <Text textAlign="center" fontSize={13}
                      color={countdown > 0 ? Colors.gray : Colors.green} fontWeight="600">
                      {countdown > 0
                        ? `${t('auth.forgotResend')} (${countdown}с)`
                        : t('auth.forgotResend')}
                    </Text>
                  </TouchableOpacity>
                </YStack>
              </>
            )}

            {/* ── Step: success ── */}
            {step === 'success' && (
              <YStack flex={1} alignItems="center" justifyContent="center" gap={24}>
                <YStack width={100} height={100} borderRadius={50} backgroundColor={Colors.greenBg}
                  alignItems="center" justifyContent="center"
                  style={{ shadowColor: Colors.green, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }}>
                  <CircleCheck color={Colors.green} size={56} />
                </YStack>
                <YStack gap={8} alignItems="center">
                  <Text fontSize={22} fontWeight="800" color={Colors.black} textAlign="center">
                    {t('auth.forgotSuccess')}
                  </Text>
                  <Text fontSize={14} color={Colors.gray} textAlign="center">
                    {t('auth.forgotSuccessDesc')}
                  </Text>
                </YStack>
                <TouchableOpacity onPress={() => navigation.replace('Login')}
                  style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
                    width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text fontWeight="800" color={Colors.black} fontSize={15}>{t('auth.forgotToLogin')}</Text>
                </TouchableOpacity>
              </YStack>
            )}

          </YStack>
        </ScrollView>
      </YStack>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
