import React, { useCallback, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { YStack, XStack, Text, Image, Spinner } from 'tamagui';
import ScreenWrapper from '../../components/ScreenWrapper';
import HlopokLogo from '../../components/HlopokLogo';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ShoppingCart, CreditCard, Gift, Clock, RotateCcw, Info, Star } from 'lucide-react-native';
import { bonusApi } from '../../api/categories';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../theme/useColors';
import { formatPrice, formatDate } from '../../utils/format';

const TX_CONFIG: Record<string, { icon: any; bg: string; color: string; sign: string }> = {
  earned:    { icon: ShoppingCart, bg: '#DCFCE7', color: '#16A34A', sign: '+' },
  used:      { icon: CreditCard,   bg: '#FEE2E2', color: '#DC2626', sign: '-' },
  refund:    { icon: RotateCcw,    bg: '#DBEAFE', color: '#2563EB', sign: '+' },
  admin_add: { icon: Gift,         bg: '#FEF9C3', color: '#CA8A04', sign: '+' },
  expired:   { icon: Clock,        bg: '#F3F4F6', color: '#9CA3AF', sign: '-' },
};

const BonusScreen = () => {
  const Colors     = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const insets      = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const lang        = i18n.language === 'ky' ? 'ky' : 'ru';

  useFocusEffect(useCallback(() => {
    let active = true;
    authApi.getMe().then(response => {
      if (active) updateUser(response.data.user);
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['bonus-history'] });
    return () => { active = false; };
  }, [queryClient, updateUser]));

  const { data: txList, isLoading } = useQuery({
    queryKey: ['bonus-history'],
    queryFn: () => bonusApi.getMyHistory().then(r => r.data.transactions),
  });

  const { data: bonusSettings } = useQuery({
    queryKey: ['bonus-settings'],
    queryFn: () => bonusApi.getSettings().then(r => r.data.settings),
    staleTime: 10 * 60 * 1000,
  });

  const qrQuery = useQuery({
    queryKey: ['bonus-qr', user?._id],
    queryFn: () => authApi.getMe().then(r => r.data.user),
    enabled: !!user && !user.qrCode,
    retry: false,
  });

  useEffect(() => {
    if (qrQuery.data) updateUser(qrQuery.data);
  }, [qrQuery.data, updateUser]);

  const bonusWindowOpen = !user?.bonusExpiresAt || new Date(user.bonusExpiresAt) > new Date();
  const bonusPct     = bonusWindowOpen ? (bonusSettings?.bonusPercent ?? 5) : 0;
  const transactions = txList || [];
  const fullName     = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Хлопок';
  const balance      = bonusWindowOpen ? (user?.bonusBalance || 0) : 0;
  const totalSaved   = user?.totalSaved   || 0;

  const howItWorks = [
    { n: '1', text: t('bonus.step1', { pct: bonusPct }) },
    { n: '2', text: t('bonus.step2') },
    { n: '3', text: t('bonus.step3') },
  ];

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* Header */}
      <XStack paddingTop={Math.max(insets.top, 8)} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={10}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Profile')}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
          <ChevronLeft color={Colors.black} size={22} />
        </TouchableOpacity>
        <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('bonus.title')}</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Bonus Card ── */}
        <YStack paddingHorizontal={16} paddingBottom={16} paddingTop={4}>
          <View style={{
            borderRadius: 20, overflow: 'hidden',
            shadowColor: '#0F3460', shadowOpacity: 0.24, shadowRadius: 14,
            shadowOffset: { width: 0, height: 10 }, elevation: 14,
          }}>
            {/* Dark blue card */}
            <View style={{ backgroundColor: '#0F3460', padding: 20 }}>

              {/* Top row */}
              <XStack justifyContent="space-between" alignItems="center" marginBottom={18}>
                <HlopokLogo size="compact" tone="light" />
                <XStack backgroundColor="rgba(255,215,0,0.15)" borderRadius={20}
                  paddingHorizontal={12} paddingVertical={5} alignItems="center" gap={5}
                  style={{ borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' }}>
                  <Star color={Colors.yellow} size={12} fill={Colors.yellow} />
                  <Text style={{ color: Colors.yellow, fontSize: 12, fontWeight: '700' }}>
                    {bonusPct}% {t('bonus.cashback')}
                  </Text>
                </XStack>
              </XStack>

              {/* QR code */}
              <YStack alignItems="center" marginBottom={18}>
                {user?.qrCode || qrQuery.data?.qrCode ? (
                  <View style={{ width: 196, height: 196, backgroundColor: '#fff', borderRadius: 12, padding: 8,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: Colors.yellow, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }}>
                    <Image source={{ uri: user?.qrCode || qrQuery.data?.qrCode }} width={180} height={180} />
                  </View>
                ) : !user ? (
                  <TouchableOpacity onPress={() => navigation.navigate('AuthNavigator')}
                    style={{ width: 164, minHeight: 164, backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 14,
                      borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.2)' }}>
                    <Text style={{ color: Colors.yellow, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                      {t('auth.login')}
                    </Text>
                  </TouchableOpacity>
                ) : qrQuery.isError || qrQuery.isSuccess ? (
                  <TouchableOpacity onPress={() => qrQuery.refetch()} disabled={qrQuery.isFetching}
                    style={{ width: 164, minHeight: 164, backgroundColor: 'rgba(255,255,255,0.06)',
                      borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 14,
                      borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.2)' }}>
                    <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
                      {t('bonus.qrLoadError')}
                    </Text>
                    <Text style={{ color: Colors.yellow, fontSize: 13, fontWeight: '700' }}>
                      {qrQuery.isFetching ? t('bonus.qrLoading') : t('common.retry')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 164, height: 164, backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.2)' }}>
                    <Spinner color={Colors.yellow} size="large" />
                  </View>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
                  {t('bonus.qrHint')}
                </Text>
              </YStack>

              {/* Bottom row */}
              <XStack justifyContent="space-between" alignItems="flex-end">
                <YStack>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>
                    {t('bonus.cardOwner').toUpperCase()}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>
                    {fullName.toUpperCase()}
                  </Text>
                </YStack>
                <YStack alignItems="flex-end">
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>
                    {t('bonus.balance').toUpperCase()}
                  </Text>
                  <Text style={{ color: Colors.yellow, fontSize: 24, fontWeight: '900' }}>
                    {formatPrice(balance)}
                  </Text>
                </YStack>
              </XStack>

            </View>

            {/* Yellow bottom stripe */}
            <View style={{ backgroundColor: Colors.yellow, paddingVertical: 12, paddingHorizontal: 24,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '700' }}>
                {t('bonus.cashback')} {bonusPct}%
              </Text>
              <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '700' }}>
                {t('bonus.savedAmount')} {formatPrice(totalSaved)}
              </Text>
            </View>
          </View>
        </YStack>

        {/* ── Stats row ── */}
        <XStack gap={12} paddingHorizontal={16} marginBottom={16}>
          <YStack flex={1} backgroundColor={Colors.white} borderRadius={16} padding={16} gap={4}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
            <Text color={Colors.gray} fontSize={11} fontWeight="600">{t('bonus.balance')}</Text>
            <Text color={Colors.green} fontSize={22} fontWeight="800">{formatPrice(balance)}</Text>
            <Text color={Colors.gray} fontSize={11}>
              {t('bonus.perOrder')} {bonusPct}%
            </Text>
          </YStack>
          <YStack flex={1} backgroundColor={Colors.white} borderRadius={16} padding={16} gap={4}
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
            <Text color={Colors.gray} fontSize={11} fontWeight="600">{t('bonus.totalSaved')}</Text>
            <Text color={Colors.yellow} fontSize={22} fontWeight="800">{formatPrice(totalSaved)}</Text>
            <Text color={Colors.gray} fontSize={11}>
              {t('bonus.totalSavedHint')}
            </Text>
          </YStack>
        </XStack>

        {/* ── How it works ── */}
        <YStack marginHorizontal={16} marginBottom={16} backgroundColor={Colors.white}
          borderRadius={16} overflow="hidden"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
          <XStack padding={16} alignItems="center" gap={8}
            style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Info color={Colors.yellow} size={18} />
            <Text fontSize={15} fontWeight="700" color={Colors.black}>
              {t('bonus.howItWorks')}
            </Text>
          </XStack>
          <YStack padding={16} gap={14}>
            {howItWorks.map(step => (
              <XStack key={step.n} alignItems="flex-start" gap={12}>
                <YStack width={28} height={28} borderRadius={14} backgroundColor={Colors.yellow}
                  alignItems="center" justifyContent="center" flexShrink={0}>
                  <Text fontSize={13} fontWeight="800" color={Colors.black}>{step.n}</Text>
                </YStack>
                <Text flex={1} fontSize={13} color={Colors.grayDark} lineHeight={20}>{step.text}</Text>
              </XStack>
            ))}
          </YStack>
        </YStack>

        {/* ── Transaction history ── */}
        <YStack marginHorizontal={16}>
          <Text fontSize={16} fontWeight="700" color={Colors.black} marginBottom={12}>
            {t('bonus.history')}
          </Text>

          {isLoading ? (
            <YStack alignItems="center" padding={32}><Spinner color={Colors.yellow} /></YStack>
          ) : transactions.length === 0 ? (
            <YStack backgroundColor={Colors.white} borderRadius={16} padding={32} alignItems="center" gap={10}>
              <YStack width={56} height={56} borderRadius={28} backgroundColor={Colors.bg}
                alignItems="center" justifyContent="center">
                <Gift color={Colors.gray} size={26} />
              </YStack>
              <Text color={Colors.gray} fontSize={14} textAlign="center">{t('bonus.noHistory')}</Text>
            </YStack>
          ) : (
            <YStack gap={8}>
              {transactions.map((tx: any) => {
                const cfg      = TX_CONFIG[tx.type] || TX_CONFIG.earned;
                const IconComp = cfg.icon;
                const isNeg    = tx.type === 'used' || tx.type === 'expired';
                return (
                  <XStack key={tx._id} backgroundColor={Colors.white} borderRadius={14}
                    padding={14} alignItems="center" gap={12}
                    style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
                    <YStack width={44} height={44} borderRadius={22}
                      style={{ backgroundColor: cfg.bg }}
                      alignItems="center" justifyContent="center" flexShrink={0}>
                      <IconComp color={cfg.color} size={20} />
                    </YStack>
                    <YStack flex={1}>
                      <Text color={Colors.black} fontSize={14} fontWeight="600" numberOfLines={1}>
                        {tx[`description_${lang}`] || t(`bonus.${tx.type}`)}
                      </Text>
                      <Text color={Colors.gray} fontSize={12} marginTop={2}>{formatDate(tx.createdAt)}</Text>
                    </YStack>
                    <YStack alignItems="flex-end">
                      <Text fontWeight="800" fontSize={16}
                        style={{ color: isNeg ? '#DC2626' : '#16A34A' }}>
                        {cfg.sign}{formatPrice(tx.amount)}
                      </Text>
                    </YStack>
                  </XStack>
                );
              })}
            </YStack>
          )}
        </YStack>

      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default BonusScreen;
