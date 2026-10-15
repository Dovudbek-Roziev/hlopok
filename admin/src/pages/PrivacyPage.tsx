import React, { useState } from 'react';
import { Globe } from 'lucide-react';

type Language = 'ru' | 'en' | 'ky';
type PolicySection = { title: string; text: React.ReactNode };

const policies: Record<Language, { title: string; updated: string; sections: PolicySection[]; contact: string }> = {
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: 14 октября 2026 года',
    contact: 'Вопросы о данных и удалении аккаунта: ',
    sections: [
      { title: '1. Кто отвечает за данные', text: <>Сервис Hlopok — приложение и интернет-магазин одежды в Оше. По вопросам персональных данных и удаления аккаунта напишите на <a href="mailto:hlopokosh@gmail.com">hlopokosh@gmail.com</a>.</> },
      { title: '2. Какие данные используются', text: 'Мы обрабатываем данные аккаунта: номер телефона, имя, адрес электронной почты и пароль в виде защищённого хеша. Для заказа используются контактные данные, адрес доставки, товары, сумма, способ и состояние оплаты, примечание и история статусов. Также хранятся избранное, бонусные операции, фотография профиля и технические данные устройств для уведомлений. Коды подтверждения хранятся временно.' },
      { title: '3. Для чего нужны данные', text: 'Данные нужны для входа и защиты аккаунта, оформления и доставки заказов, связи с покупателем, работы бонусов, показа истории заказов, уведомлений о заказах и поддержки.' },
      { title: '4. Сервисы и подтверждение входа', text: 'Для работы используются MongoDB Atlas, Cloudinary, Expo Notifications и Nikita.kg. Коды подтверждения отправляются через Nikita.kg. Данные передаются этим сервисам только для выполнения соответствующих функций.' },
      { title: '5. Оплата и заказы', text: 'Приложение не получает и не хранит данные банковских карт. В системе сохраняются сумма заказа, выбранный способ оплаты и отметка о её подтверждении. История заказа может оставаться после удаления аккаунта в обезличенном виде для учёта и разрешения спорных ситуаций.' },
      { title: '6. Удаление аккаунта', text: 'Удаление можно запросить в приложении, если нет активных заказов. Профиль обезличивается и доступ закрывается; пароль, личные контактные данные, адреса, избранное и данные устройств для уведомлений очищаются; отзывы удаляются. Данные заказа могут сохраниться без привязки к личности. Для удаления фотографии отправляется запрос в Cloudinary.' },
      { title: '7. Защита и хранение', text: 'Пароли хранятся в виде хешей, а доступ к аккаунту защищён авторизацией. Коды подтверждения удаляются после окончания срока действия. Остальные данные хранятся столько, сколько нужно для работы магазина и обработки заказов.' },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Updated: October 14, 2026',
    contact: 'Questions about personal data or account deletion: ',
    sections: [
      { title: '1. Who handles the data', text: <>Hlopok is a clothing app and online store in Osh. For questions about personal data or account deletion, contact <a href="mailto:hlopokosh@gmail.com">hlopokosh@gmail.com</a>.</> },
      { title: '2. Data we use', text: 'We process account details such as phone number, name, email address, and a securely hashed password. Orders use contact details, delivery address, items, total, payment method and status, notes, and status history. The service also stores favorites, bonus transactions, profile photo, and technical device data needed for notifications. Verification codes are stored temporarily.' },
      { title: '3. Why we use it', text: 'Data is used to sign in and protect accounts, place and deliver orders, contact customers, manage bonuses, show order history, send order notifications, and provide support.' },
      { title: '4. Service providers and verification', text: 'The service uses MongoDB Atlas, Cloudinary, Expo Notifications, and Nikita.kg. Verification codes are sent through Nikita.kg. Data is shared with these providers only to deliver the related features.' },
      { title: '5. Payments and orders', text: 'The app does not collect or store bank-card details. It stores the order total, selected payment method, and payment confirmation status. Order history may remain in a de-identified form for records and dispute handling after an account is deleted.' },
      { title: '6. Account deletion', text: 'You can request deletion in the app when there are no active orders. The profile is de-identified and access is disabled; the password, personal contact details, addresses, favorites, and device notification data are cleared, and reviews are deleted. Order records may remain without identifying details. A request is sent to Cloudinary to delete the profile photo.' },
      { title: '7. Security and retention', text: 'Passwords are stored as hashes and account access requires authentication. Verification codes are deleted when they expire. Other data is kept for as long as needed to operate the store and handle orders.' },
    ],
  },
  ky: {
    title: 'Купуялык саясаты',
    updated: 'Жаңыртылган күнү: 14-октябрь, 2026-жыл',
    contact: 'Жеке маалыматтар жана аккаунтту өчүрүү боюнча: ',
    sections: [
      { title: '1. Маалыматтарды ким иштетет', text: <>Hlopok — Ош шаарындагы кийим дүкөнүнүн колдонмосу жана интернет-дүкөнү. Жеке маалыматтар же аккаунтту өчүрүү боюнча <a href="mailto:hlopokosh@gmail.com">hlopokosh@gmail.com</a> дарегине жазыңыз.</> },
      { title: '2. Кандай маалыматтар колдонулат', text: 'Аккаунт үчүн телефон номери, аты-жөнү, электрондук почта жана корголгон хеш түрүндөгү сырсөз иштетилет. Буйрутма үчүн байланыш маалыматы, жеткирүү дареги, товарлар, сумма, төлөм ыкмасы жана абалы, эскертүү жана абал тарыхы колдонулат. Тандалгандар, бонус операциялары, профиль сүрөтү жана билдирмелер үчүн түзмөктүн техникалык маалыматы да сакталат. Тастыктоо коддору убактылуу сакталат.' },
      { title: '3. Маалыматтар эмне үчүн керек', text: 'Маалыматтар аккаунтка кирүү жана аны коргоо, буйрутманы кабыл алуу жана жеткирүү, кардар менен байланышуу, бонустарды эсептөө, буйрутмалар тарыхын көрсөтүү, билдирмелерди жөнөтүү жана колдоо үчүн колдонулат.' },
      { title: '4. Кызмат көрсөтүүчүлөр жана тастыктоо', text: 'Кызмат MongoDB Atlas, Cloudinary, Expo Notifications жана Nikita.kg кызматтарын колдонот. Тастыктоо коддору Nikita.kg аркылуу жөнөтүлөт. Маалыматтар тиешелүү функцияларды аткаруу үчүн гана ушул кызматтарга берилет.' },
      { title: '5. Төлөм жана буйрутмалар', text: 'Колдонмо банк картасынын маалыматтарын албайт жана сактабайт. Система буйрутманын суммасын, тандалган төлөм ыкмасын жана төлөмдүн ырасталышын сактайт. Аккаунт өчүрүлгөндөн кийин буйрутмалар тарыхы эсеп жана талаштарды чечүү үчүн инсанды аныктабаган түрдө сакталышы мүмкүн.' },
      { title: '6. Аккаунтту өчүрүү', text: 'Активдүү буйрутмалар жок болсо, колдонмодон аккаунтту өчүрүүнү сурасаңыз болот. Профиль өчүрүлөт; жеке байланыш маалыматтары, даректер, тандалгандар жана түзмөктүн билдирме маалыматтары тазаланат, пикирлер өчүрүлөт. Буйрутма маалыматтары адамды аныктабаган түрдө калышы мүмкүн. Профиль сүрөтүн өчүрүү үчүн Cloudinary кызматына өтүнүч жөнөтүлөт.' },
      { title: '7. Коопсуздук жана сактоо мөөнөтү', text: 'Сырсөздөр хеш түрүндө сакталат, аккаунтка кирүү авторизация менен корголот. Тастыктоо коддору мөөнөтү бүткөндө өчүрүлөт. Башка маалыматтар дүкөндүн иши жана буйрутмаларды аткаруу үчүн зарыл болгон убакытка сакталат.' },
    ],
  },
};

const PrivacyPage = () => {
  const [language, setLanguage] = useState<Language>('ru');
  const policy = policies[language];

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px 48px', fontFamily: 'sans-serif', color: '#1A1A1A', lineHeight: 1.7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
        <div style={{ fontWeight: 800, fontSize: 22 }}>Hlopok</div>
        <div role="group" aria-label="Language" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 5, border: '1px solid #D1D5DB', borderRadius: 10, background: '#F9FAFB' }}>
          <Globe size={20} color="#4B5563" style={{ margin: '0 6px' }} />
          {(['ru', 'en', 'ky'] as const).map(code => (
            <button key={code} type="button" aria-pressed={language === code} onClick={() => setLanguage(code)}
              style={{ minWidth: 58, minHeight: 42, padding: '8px 12px', border: 0, borderRadius: 7, background: language === code ? '#FDE68A' : 'transparent', color: '#111827', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <header style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: '0 0 8px', fontWeight: 800 }}>{policy.title}</h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>{policy.updated}</p>
      </header>

      <aside id="delete-account" style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2>{language === 'ru' ? 'Удалить аккаунт Hlopok' : language === 'ky' ? 'Hlopok аккаунтун өчүрүү' : 'Delete your Hlopok account'}</h2>
        <p>{language === 'ru' ? 'В приложении: Профиль → Данные и настройки. Если приложение недоступно или есть активный заказ, отправьте запрос на удаление по email. Укажите номер аккаунта; пароль и OTP не отправляйте. Поддержка подтвердит владение аккаунтом и сообщит порядок удаления и обязательного хранения данных.' : language === 'ky' ? 'Колдонмодо: Профиль → Маалыматтар жана жөндөөлөр. Колдонмо жеткиликсиз же активдүү буйрутма болсо, email аркылуу өчүрүү өтүнүчүн жөнөтүңүз. Аккаунттун номерин жазыңыз; сырсөздү жана OTP кодду жөнөтпөңүз. Колдоо аккаунтту текшерип, өчүрүү жана милдеттүү сактоо тартибин билдирет.' : 'In the app: Profile → Data and settings. If the app is unavailable or an order is active, email a deletion request with your account phone number. Do not send passwords or OTP codes. Support will verify ownership and explain deletion and required retention.'}</p>
        <a href="mailto:hlopokosh@gmail.com?subject=Hlopok%20account%20deletion">hlopokosh@gmail.com</a>
      </aside>
      {policy.sections.map(section => (
        <section key={section.title} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>{section.title}</h2>
          <div style={{ fontSize: 15, color: '#374151' }}>{section.text}</div>
        </section>
      ))}

      <footer style={{ marginTop: 32, paddingTop: 18, borderTop: '1px solid #E5E7EB', color: '#6B7280', fontSize: 14 }}>
        {policy.contact}<a href="mailto:hlopokosh@gmail.com">hlopokosh@gmail.com</a>
      </footer>
    </main>
  );
};

export default PrivacyPage;
