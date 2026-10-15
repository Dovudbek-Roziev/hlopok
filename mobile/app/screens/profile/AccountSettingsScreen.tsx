import { useState } from 'react';
import { Linking, ScrollView, Switch, TextInput, TouchableOpacity } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useHeaderTopPadding } from '../../utils/useHeaderTopPadding';
import { useColors } from '../../theme/useColors';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { useConfirmStore } from '../../store/confirmStore';

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const top = useHeaderTopPadding();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { user, updateUser, logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const blocks = useQuery({ queryKey: ['blocked-users'], queryFn: () => authApi.getBlocks().then(r => r.data.users), enabled: !!user });
  const remove = () => useConfirmStore.getState().ask({
    title: t('profile.deleteAccount'), message: t('release.deleteInfo'),
    confirmLabel: t('common.delete'), cancelLabel: t('common.cancel'), destructive: true,
    onConfirm: async () => {
      setBusy(true); setError('');
      try { await authApi.deleteAccount(password); await logout(false); navigation.navigate('Profile'); }
      catch (e: any) { setError(e.response?.data?.message || t('common.error')); }
      finally { setBusy(false); setPassword(''); }
    },
  });
  return <ScreenWrapper><ScrollView contentContainerStyle={{ padding: 20, paddingTop: top, gap: 20 }}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text color={colors.black}>← {t('release.accountSettings')}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL('https://hlopok-admin.vercel.app/privacy')}><Text color={colors.black}>{t('release.privacy')}</Text></TouchableOpacity>
    {!!error && <Text color={colors.red}>{error}</Text>}
    <XStack alignItems="center" justifyContent="space-between" gap={12}>
      <Text flex={1} color={colors.black}>{t('release.marketing')}</Text>
      <Switch value={!!user?.marketingPush} disabled={busy} onValueChange={async value => {
        setBusy(true); setError('');
        try { const response = await authApi.updateProfile({ marketingPush: value }); updateUser(response.data.user); }
        catch { setError(t('common.error')); } finally { setBusy(false); }
      }} />
    </XStack>
    <YStack gap={12}><Text color={colors.black} fontWeight="700">{t('release.blocked')}</Text>
      {blocks.isError && <TouchableOpacity onPress={() => blocks.refetch()}><Text color={colors.red}>{t('common.retry')}</Text></TouchableOpacity>}
      {blocks.data?.map((person: any) => <XStack key={person._id} gap={12} alignItems="center">
        <Text flex={1} color={colors.black}>{person.firstName} {person.lastName}</Text>
        <TouchableOpacity disabled={busy} onPress={async () => {
          setBusy(true);
          try { await authApi.setBlock(person._id, false); await qc.invalidateQueries({ queryKey: ['blocked-users'] }); qc.invalidateQueries({ queryKey: ['review-list'] }); }
          catch { setError(t('common.error')); } finally { setBusy(false); }
        }}><Text color={colors.black}>{t('release.unblock')}</Text></TouchableOpacity>
      </XStack>)}
    </YStack>
    <YStack gap={14}>
      <Text color={colors.black}>{t('release.deleteInfo')}</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder={t('release.deletePassword')}
        placeholderTextColor={colors.gray} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.black }} />
      <TouchableOpacity disabled={busy || !password} onPress={remove} style={{ paddingVertical: 16 }}>
        <Text color={colors.red}>{t('profile.deleteAccount')}</Text>
      </TouchableOpacity>
    </YStack>
  </ScrollView></ScreenWrapper>;
}
