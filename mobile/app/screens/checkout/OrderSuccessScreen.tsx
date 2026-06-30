import React from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { CircleCheck, Package, House, Info } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useColors } from '../../theme/useColors';

const OrderSuccessScreen = () => {
  const Colors     = useColors();
  const { t }      = useTranslation();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();

  const { orderNumber = '' } = route.params || {};

  const resetAndGo = (tabName: string) => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Cart' }] }));
    navigation.getParent()?.navigate(tabName);
  };

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg} justifyContent="space-between">

      {/* ── Body ── */}
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={24} gap={20}>

        {/* Icon */}
        <YStack width={96} height={96} borderRadius={48}
          backgroundColor={Colors.greenBg} alignItems="center" justifyContent="center">
          <CircleCheck color={Colors.green} size={56} fill={Colors.greenBg} />
        </YStack>

        {/* Title */}
        <YStack alignItems="center" gap={8}>
          <Text fontSize={24} fontWeight="800" color={Colors.black} textAlign="center">
            {t('checkout.orderSuccess')}
          </Text>
          <Text fontSize={14} color={Colors.gray} textAlign="center" lineHeight={20}>
            {t('checkout.thankYou')}
          </Text>
        </YStack>

        {/* Order number badge */}
        <YStack backgroundColor={Colors.white} borderRadius={14} paddingHorizontal={24} paddingVertical={12}
          style={{ borderWidth: 1, borderColor: Colors.border }}>
          <Text color={Colors.gray} fontSize={12} textAlign="center" marginBottom={2}>
            {t('checkout.orderNumber')}
          </Text>
          <Text fontSize={20} fontWeight="800" color={Colors.black} textAlign="center"
            style={{ fontFamily: 'monospace', letterSpacing: 1 }}>
            #{orderNumber}
          </Text>
        </YStack>

        {/* Info card */}
        <YStack backgroundColor={Colors.blueBg} borderRadius={14} padding={16} gap={10} width="100%"
          style={{ borderWidth: 1, borderColor: Colors.blueBorder }}>
          <XStack alignItems="center" gap={8}>
            <Info color={Colors.blue} size={18} />
            <Text fontSize={13} fontWeight="700" color={Colors.blue}>{t('checkout.successInfoTitle')}</Text>
          </XStack>
          <Text fontSize={13} color={Colors.grayDark} lineHeight={20}>
            {t('checkout.successInfoBody')}
          </Text>
        </YStack>

      </YStack>

      {/* ── Bottom buttons ── */}
      <YStack padding={16} gap={10} backgroundColor={Colors.white}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 8 }}>
        <TouchableOpacity
          onPress={() => resetAndGo('OrdersTab')}
          style={{ backgroundColor: Colors.yellow, borderRadius: 14, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Package color={Colors.black} size={18} />
          <Text fontWeight="700" color={Colors.black} fontSize={16}>{t('orders.title')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => resetAndGo('HomeTab')}
          style={{ borderWidth: 2, borderColor: Colors.border, borderRadius: 14, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <House color={Colors.grayDark} size={18} />
          <Text fontWeight="700" color={Colors.grayDark} fontSize={16}>{t('home.toHome')}</Text>
        </TouchableOpacity>
      </YStack>

    </YStack>
    </ScreenWrapper>
  );
};

export default OrderSuccessScreen;
