// Parol o'zgartirish ekrani / Change password screen
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useColors } from '../../theme/useColors';

const ChangePasswordScreen = () => {
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [old_, setOld]        = useState('');
  const [newP, setNew]        = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!old_.trim())     { setError(t('auth.fillAllFields')); return; }
    if (newP !== confirm) { setError(t('auth.passwordMismatch')); return; }
    if (newP.length < 8)  { setError(t('auth.passwordTooShort')); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.changePassword(old_, newP);
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenWrapper>
      <YStack flex={1} backgroundColor={Colors.bg}>
        <XStack backgroundColor={Colors.bg} paddingTop={50} paddingHorizontal={16} paddingBottom={16} alignItems="center" gap={12}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.black} size={24} />
          </TouchableOpacity>
          <Text fontSize={18} fontWeight="bold" color={Colors.black}>{t('profile.changePassword')}</Text>
        </XStack>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 12 }}>
        <YStack backgroundColor={Colors.white} borderRadius={12} padding={16} gap={12}>
          <Input value={old_} onChangeText={(v: string) => { setOld(v); setError(''); }}
            placeholder={t('auth.currentPasswordPlaceholder')} secureTextEntry
            borderColor={Colors.border} borderRadius={10} height={48} paddingHorizontal="$4" />
          <Input value={newP} onChangeText={(v: string) => { setNew(v); setError(''); }}
            placeholder={t('auth.newPasswordPlaceholder')} secureTextEntry
            borderColor={Colors.border} borderRadius={10} height={48} paddingHorizontal="$4" />
          <Input value={confirm} onChangeText={(v: string) => { setConfirm(v); setError(''); }}
            placeholder={t('auth.confirmPassword')} secureTextEntry
            borderColor={error ? Colors.red : Colors.border} borderRadius={10} height={48} paddingHorizontal="$4" />

          {!!error && (
            <YStack backgroundColor={Colors.redBg} borderRadius={10} padding={12}>
              <Text color={Colors.red} fontSize={14}>{error}</Text>
            </YStack>
          )}
          {success && (
            <YStack backgroundColor={Colors.greenBg} borderRadius={10} padding={12}>
              <Text color={Colors.green} fontSize={14}>{t('auth.passwordChanged')}</Text>
            </YStack>
          )}

          <Button backgroundColor={Colors.yellow} borderRadius={10} height={50} onPress={handleSave} disabled={loading || success}>
            {loading ? <Spinner color={Colors.black} /> : <Text fontWeight="bold" color={Colors.black}>{t('common.save')}</Text>}
          </Button>
        </YStack>
        </ScrollView>
      </YStack>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;
