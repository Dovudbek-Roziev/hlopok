import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Image } from 'tamagui';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  Package, Heart, QrCode, Store, HelpCircle,
  Globe, Lock, LogOut, ChevronRight, Pencil,
  User, MessageCircle, Sparkles,
} from 'lucide-react-native';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useConfirmStore } from '../../store/confirmStore';
import { useColors } from '../../theme/useColors';
import { formatPrice, getInitials, formatPhone } from '../../utils/format';

/* ─── Yordamchi komponentlar ─── */

const MenuItem = ({ icon: Icon, label, onPress, right, danger }: any) => {
  const Colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
      <XStack alignItems="center" paddingHorizontal={18} paddingVertical={15} gap={14}>
        <YStack width={36} height={36} borderRadius={10}
          backgroundColor={danger ? Colors.redBg : Colors.bg}
          alignItems="center" justifyContent="center">
          <Icon color={danger ? Colors.red : Colors.grayDark} size={18} />
        </YStack>
        <Text flex={1} fontSize={15} color={danger ? Colors.red : Colors.black} fontWeight="500">
          {label}
        </Text>
        {right ?? <ChevronRight color={Colors.grayLight} size={16} />}
      </XStack>
    </TouchableOpacity>
  );
};

const Divider = () => {
  const Colors = useColors();
  return <YStack height={0.5} backgroundColor={Colors.border} marginLeft={68} />;
};

/* ─── Kirish ekrani (not logged in) ─── */

const GuestView = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg} alignItems="center" justifyContent="center"
      gap={16} paddingHorizontal={32}>
      <YStack width={96} height={96} borderRadius={48} backgroundColor={Colors.yellow}
        alignItems="center" justifyContent="center">
        <User color={Colors.black} size={44} />
      </YStack>
      <YStack alignItems="center" gap={6}>
        <Text fontSize={20} fontWeight="800" color={Colors.black}>{t('auth.loginToAccount')}</Text>
        <Text fontSize={13} color={Colors.gray} textAlign="center" lineHeight={20}>
          {t('auth.loginToAccountDesc')}
        </Text>
      </YStack>
      <XStack gap={8} marginTop={4}>
        {(['ru', 'ky'] as const).map(l => (
          <TouchableOpacity key={l} onPress={() => i18n.changeLanguage(l)}
            style={{
              paddingHorizontal: 28, paddingVertical: 10, borderRadius: 10,
              backgroundColor: i18n.language === l ? Colors.yellow : Colors.white,
              borderWidth: 1.5, borderColor: i18n.language === l ? Colors.yellow : Colors.border,
            }}>
            <Text fontWeight={i18n.language === l ? '700' : '400'} color={Colors.black} fontSize={14}>
              {l === 'ru' ? 'RU' : 'KY'}
            </Text>
          </TouchableOpacity>
        ))}
      </XStack>
      <TouchableOpacity onPress={() => navigation.navigate('AuthNavigator')}
        style={{
          backgroundColor: Colors.yellow, borderRadius: 14,
          height: 52, width: '100%', alignItems: 'center', justifyContent: 'center',
        }}>
        <Text fontWeight="800" color={Colors.black} fontSize={16}>{t('auth.login')}</Text>
      </TouchableOpacity>
    </YStack>
    </ScreenWrapper>
  );
};

/* ─── Asosiy ekran ─── */

const ProfileScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return <GuestView />;

  const handleLogout = () => {
    useConfirmStore.getState().ask({
      title: t('auth.logout'),
      message: t('auth.logoutConfirm'),
      confirmLabel: t('auth.logout'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: logout,
    });
  };

  const LangToggle = () => (
    <XStack gap={6}>
      {(['ru', 'ky'] as const).map(l => (
        <TouchableOpacity key={l}
          onPress={async () => {
            await i18n.changeLanguage(l);
            authApi.updateProfile({ language: l }).catch(() => {});
          }}
          style={{
            paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
            backgroundColor: i18n.language === l ? Colors.black : 'transparent',
            borderWidth: 1, borderColor: i18n.language === l ? Colors.black : Colors.border,
          }}>
          <Text fontSize={12} fontWeight="700"
            color={i18n.language === l ? Colors.white : Colors.grayDark}>
            {l === 'ru' ? 'RU' : 'KY'}
          </Text>
        </TouchableOpacity>
      ))}
    </XStack>
  );

  return (
    <ScreenWrapper>
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <YStack backgroundColor={Colors.yellow} paddingTop={60} paddingBottom={40} paddingHorizontal={20}>

        {/* Avatar + tahrirlash */}
        <YStack alignItems="center" gap={12}>
          <YStack position="relative">
            <YStack width={88} height={88} borderRadius={44} overflow="hidden"
              backgroundColor="rgba(0,0,0,0.1)"
              style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} width={88} height={88} resizeMode="cover" />
              ) : (
                <YStack flex={1} alignItems="center" justifyContent="center">
                  <Text fontSize={30} fontWeight="800" color={Colors.black}>
                    {getInitials(user.firstName, user.lastName)}
                  </Text>
                </YStack>
              )}
            </YStack>
            {/* Kichik tahrirlash tugmasi */}
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}
              style={{
                position: 'absolute', bottom: 0, right: -2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: Colors.white,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: Colors.yellow,
              }}>
              <Pencil color={Colors.black} size={13} />
            </TouchableOpacity>
          </YStack>

          <YStack alignItems="center" gap={3}>
            <Text fontSize={20} fontWeight="800" color={Colors.black}>
              {user.firstName} {user.lastName}
            </Text>
            <Text fontSize={13} color="rgba(0,0,0,0.5)">
              {formatPhone(user.phone || '')}
            </Text>
          </YStack>
        </YStack>
      </YStack>

      {/* ── Bonus karta (sariq ostidan chiqib turadi) ── */}
      <TouchableOpacity onPress={() => navigation.navigate('BonusCard')} activeOpacity={0.8}>
        <XStack marginHorizontal={16} marginTop={-20} borderRadius={20}
          backgroundColor={Colors.white} padding={20} alignItems="center"
          style={{ elevation: 6, shadowColor: '#C49A00', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}>

          {/* Bonus */}
          <YStack flex={1} gap={3}>
            <XStack alignItems="center" gap={5}>
              <Sparkles color={Colors.brand} size={13} />
              <Text color={Colors.gray} fontSize={11} fontWeight="600" letterSpacing={0.5}>
                {t('profile.bonus').toUpperCase()}
              </Text>
            </XStack>
            <Text color={Colors.black} fontSize={24} fontWeight="800">
              {formatPrice(user.bonusBalance)}
            </Text>
          </YStack>

          {/* Ajratuvchi */}
          <YStack width={1} height={40} backgroundColor={Colors.border} marginHorizontal={16} />

          {/* Tejaldi */}
          <YStack flex={1} gap={3} alignItems="flex-end">
            <Text color={Colors.gray} fontSize={11} fontWeight="600" letterSpacing={0.5}>
              {t('profile.saved').toUpperCase()}
            </Text>
            <Text color={Colors.green} fontSize={24} fontWeight="800">
              {formatPrice(user.totalSaved ?? 0)}
            </Text>
          </YStack>

          <ChevronRight color={Colors.grayLight} size={16} style={{ marginLeft: 8 }} />
        </XStack>
      </TouchableOpacity>

      {/* ── Menyu 1: Buyurtmalar ── */}
      <YStack backgroundColor={Colors.white} marginHorizontal={16} marginTop={16}
        borderRadius={18} overflow="hidden">
        <MenuItem icon={Package} label={t('profile.myOrders')}
          onPress={() => navigation.navigate('OrdersTab')} />
        <Divider />
        <MenuItem icon={Heart} label={t('profile.favorites')}
          onPress={() => navigation.navigate('Favorites')} />
        <Divider />
        <MenuItem icon={QrCode} label={t('profile.bonusCard')}
          onPress={() => navigation.navigate('BonusCard')} />
      </YStack>

      {/* ── Menyu 2: Do'kon ── */}
      <YStack backgroundColor={Colors.white} marginHorizontal={16} marginTop={10}
        borderRadius={18} overflow="hidden">
        <MenuItem icon={Store} label={t('profile.storeAddress')}
          onPress={() => navigation.navigate('StoreInfo')} />
        <Divider />
        <MenuItem icon={MessageCircle} label={t('store.supportTitle')}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Support' })} />
        <Divider />
        <MenuItem icon={HelpCircle} label={t('profile.faq')}
          onPress={() => navigation.navigate('FAQ')} />
      </YStack>

      {/* ── Menyu 3: Sozlamalar ── */}
      <YStack backgroundColor={Colors.white} marginHorizontal={16} marginTop={10}
        borderRadius={18} overflow="hidden">
        <MenuItem icon={Globe} label={t('profile.language')}
          onPress={() => {}} right={<LangToggle />} />
        <Divider />
        <MenuItem icon={Lock} label={t('profile.changePassword')}
          onPress={() => navigation.navigate('ChangePassword')} />
      </YStack>

      {/* ── Chiqish ── */}
      <YStack backgroundColor={Colors.white} marginHorizontal={16} marginTop={10}
        borderRadius={18} overflow="hidden" marginBottom={4}>
        <MenuItem icon={LogOut} label={t('auth.logout')}
          onPress={handleLogout} danger right={null} />
      </YStack>

      <Text color={Colors.grayLight} fontSize={11} textAlign="center" marginVertical={20}>
        {t('profile.developer')}
      </Text>
    </ScrollView>
    </ScreenWrapper>
  );
};

export default ProfileScreen;
