import React, { useState } from 'react';
import { useHeaderTopPadding } from '../../utils/useHeaderTopPadding';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Input, Spinner } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Phone, Shield, User } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';

const EditProfileScreen = () => {
  const headerTopPadding = useHeaderTopPadding();
  const Colors = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirst] = useState(user?.firstName || '');
  const [lastName, setLast]   = useState(user?.lastName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.updateProfile({ firstName, lastName });
      updateUser(res.data.user);
      navigation.goBack();
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

        {/* ── Yellow header ── */}
        <YStack backgroundColor={Colors.yellow} paddingTop={headerTopPadding} paddingHorizontal={16} paddingBottom={32}>
          <XStack alignItems="center" gap={10} marginBottom={24}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft color={Colors.black} size={24} />
            </TouchableOpacity>
            <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('profile.editProfile')}</Text>
          </XStack>

          {/* Fixed profile icon */}
          <YStack alignItems="center">
            <YStack width={90} height={90} borderRadius={45} backgroundColor="rgba(0,0,0,0.12)"
              alignItems="center" justifyContent="center"
              style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)' }}>
              <User color={Colors.black} size={40} strokeWidth={1.8} />
            </YStack>
          </YStack>
        </YStack>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* Name fields */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={14}>
            <YStack gap={6}>
              <Text fontSize={13} fontWeight="600" color={Colors.grayDark}>{t('auth.firstName')}</Text>
              <Input value={firstName} onChangeText={setFirst}
                placeholder={t('auth.firstNamePlaceholder')}
                borderColor={Colors.border} backgroundColor={Colors.bg}
                borderRadius={12} height={50} paddingHorizontal="$4" />
            </YStack>
            <YStack gap={6}>
              <Text fontSize={13} fontWeight="600" color={Colors.grayDark}>{t('auth.lastName')}</Text>
              <Input value={lastName} onChangeText={setLast}
                placeholder={t('auth.lastNamePlaceholder')}
                borderColor={Colors.border} backgroundColor={Colors.bg}
                borderRadius={12} height={50} paddingHorizontal="$4" />
            </YStack>
          </YStack>

          {/* Phone (read-only) */}
          <YStack backgroundColor={Colors.white} borderRadius={14} padding={16} gap={6}>
            <Text fontSize={13} fontWeight="600" color={Colors.grayDark}>{t('auth.phone')}</Text>
            <XStack alignItems="center" backgroundColor={Colors.bg} borderRadius={12}
              height={50} paddingHorizontal={16} borderWidth={1} borderColor={Colors.border}>
              <Text flex={1} color={Colors.gray} fontSize={14}>
                {user?.phone || user?.email?.replace(/@hlopok\.kg$/, '') || '—'}
              </Text>
              <Phone color={Colors.grayLight} size={17} />
            </XStack>
          </YStack>

          {/* Privacy note */}
          <XStack backgroundColor={Colors.white} borderRadius={14} padding={14} gap={10} alignItems="flex-start">
            <Shield color={Colors.green} size={18} style={{ marginTop: 1 }} />
            <Text flex={1} color={Colors.gray} fontSize={12} lineHeight={18}>
              {t('profile.privacyNote')}
            </Text>
          </XStack>

          {!!error && (
            <YStack backgroundColor={Colors.redBg} borderRadius={10} padding={12}>
              <Text color={Colors.red} fontSize={13}>{error}</Text>
            </YStack>
          )}

          <TouchableOpacity onPress={handleSave} disabled={loading}
            style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
              alignItems: 'center', justifyContent: 'center' }}>
            {loading
              ? <Spinner color={Colors.black} />
              : <Text fontWeight="700" color={Colors.black} fontSize={16}>{t('common.save')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </YStack>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;
