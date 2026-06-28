import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle, AlertCircle, HelpCircle } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '../../theme/useColors';
import api from '../../api/client';

const FaqItem = ({ item, lang }: any) => {
  const Colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(!open)}
      style={{ backgroundColor: Colors.white, borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
      <XStack padding={16} alignItems="center" justifyContent="space-between">
        <Text fontWeight="600" color={Colors.black} flex={1} marginRight={8} fontSize={14}>
          {item[`q_${lang}`]}
        </Text>
        <YStack width={28} height={28} borderRadius={14} backgroundColor={open ? Colors.yellow : Colors.bg}
          alignItems="center" justifyContent="center">
          {open
            ? <ChevronUp color={Colors.black} size={16} />
            : <ChevronDown color={Colors.grayDark} size={16} />}
        </YStack>
      </XStack>
      {open && (
        <YStack paddingHorizontal={16} paddingBottom={16}>
          <YStack height={1} backgroundColor={Colors.border} marginBottom={12} />
          <Text color={Colors.grayDark} lineHeight={22} fontSize={14}>{item[`a_${lang}`]}</Text>
        </YStack>
      )}
    </TouchableOpacity>
  );
};

const FAQScreen = () => {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const navigation  = useNavigation<any>();
  const lang        = i18n.language === 'ky' ? 'ky' : 'ru';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.get('/faqs').then(r => r.data.faqs),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const faqs = Array.isArray(data) ? data : [];

  return (
    <ScreenWrapper>
    <YStack flex={1} backgroundColor={Colors.bg}>

      {/* Header */}
      <YStack backgroundColor={Colors.yellow} paddingTop={50} paddingHorizontal={16} paddingBottom={20}>
        <XStack alignItems="center" gap={10} marginBottom={14}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.black} size={24} />
          </TouchableOpacity>
          <Text fontSize={18} fontWeight="700" color={Colors.black}>{t('profile.faq')}</Text>
        </XStack>

        {/* Banner */}
        <YStack backgroundColor="rgba(0,0,0,0.08)" borderRadius={16} height={90}
          alignItems="center" justifyContent="center" gap={6}>
          <HelpCircle color={Colors.black} size={30} />
          <Text fontSize={13} fontWeight="600" color={Colors.black}>
            {t('faq.title')}
          </Text>
        </YStack>
      </YStack>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>

        {isLoading ? (
          <YStack alignItems="center" paddingVertical={48}>
            <ActivityIndicator color={Colors.yellow} size="large" />
          </YStack>
        ) : isError ? (
          <YStack alignItems="center" paddingVertical={48} gap={8}>
            <AlertCircle color={Colors.gray} size={40} />
            <Text color={Colors.grayDark} fontSize={14} textAlign="center">{t('faq.empty')}</Text>
          </YStack>
        ) : faqs.length === 0 ? (
          <YStack alignItems="center" paddingVertical={48} gap={8}>
            <HelpCircle color={Colors.gray} size={40} />
            <Text color={Colors.grayDark} fontSize={14} textAlign="center">{t('faq.empty')}</Text>
          </YStack>
        ) : (
          faqs.map((f: any) => <FaqItem key={f._id} item={f} lang={lang} />)
        )}

        {/* CTA */}
        <YStack backgroundColor={Colors.yellow} borderRadius={16} padding={20} alignItems="center" gap={10} marginTop={8}>
          <Text fontSize={15} fontWeight="700" color={Colors.black} textAlign="center">
            {t('faq.moreQuestions')}
          </Text>
          <Text fontSize={13} color="rgba(0,0,0,0.6)" textAlign="center">
            {t('faq.operatorHelp')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('HomeTab', { screen: 'Support' })}
            style={{ backgroundColor: Colors.black, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <MessageCircle color="#fff" size={18} />
            <Text fontWeight="700" color="#fff" fontSize={14}>{t('faq.contactOperator')}</Text>
          </TouchableOpacity>
        </YStack>

      </ScrollView>
    </YStack>
    </ScreenWrapper>
  );
};

export default FAQScreen;
