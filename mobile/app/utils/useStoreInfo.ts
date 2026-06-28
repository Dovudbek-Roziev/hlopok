import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storeSettingsApi } from '../api/categories';

const FALLBACK = {
  phone:        '+996222098531',
  whatsapp:     'https://wa.me/996222098531',
  instagram:    'https://www.instagram.com/hlopok_osh2',
  telegram:     'https://t.me/hlopokosh2',
  address_ru:   'Памирская 2, Адыгене Соода борбору, Ош',
  address_ky:   'Памирская 2, Адыгене Соода борбору, Ош',
  hours_ru:     '9:00 - 21:00',
  hours_ky:     '9:00 - 21:00',
  paymentCard:  '',
  paymentName:  '',
  paymentQR:    '',
  paymentName2: '',
  paymentCard2: '',
  paymentQR2:   '',
  paymentLink:  '',
  paymentLink2: '',
};

export const useStoreInfo = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const { data } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => storeSettingsApi.getSettings().then(r => r.data.settings),
    staleTime: 30 * 60 * 1000,
  });

  const settings = data || FALLBACK;

  return {
    phone:       settings.phone || FALLBACK.phone,
    whatsapp:    settings.whatsapp || FALLBACK.whatsapp,
    instagram:   settings.instagram || FALLBACK.instagram,
    telegram:    settings.telegram || FALLBACK.telegram,
    address:     (lang === 'ky' ? settings.address_ky : settings.address_ru) || (lang === 'ky' ? FALLBACK.address_ky : FALLBACK.address_ru),
    hours:       (lang === 'ky' ? settings.hours_ky : settings.hours_ru) || (lang === 'ky' ? FALLBACK.hours_ky : FALLBACK.hours_ru),
    paymentCard:  settings.paymentCard  || FALLBACK.paymentCard,
    paymentName:  settings.paymentName  || FALLBACK.paymentName,
    paymentQR:    settings.paymentQR    || FALLBACK.paymentQR,
    paymentName2: settings.paymentName2 || FALLBACK.paymentName2,
    paymentCard2: settings.paymentCard2 || FALLBACK.paymentCard2,
    paymentQR2:   settings.paymentQR2   || FALLBACK.paymentQR2,
    paymentLink:  settings.paymentLink  || FALLBACK.paymentLink,
    paymentLink2: settings.paymentLink2 || FALLBACK.paymentLink2,
  };
};
