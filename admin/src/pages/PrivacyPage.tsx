const PrivacyPage = () => (
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', color: '#1A1A1A', lineHeight: 1.7 }}>
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>Х</div>
        <span style={{ fontWeight: 800, fontSize: 20 }}>Хлопок</span>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>Политика конфиденциальности</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Последнее обновление: июнь 2025</p>
    </div>

    <Section title="1. Общие положения">
      Настоящая Политика конфиденциальности описывает, как приложение <b>Хлопок</b> (детская одежда, г. Ош) собирает, использует и защищает персональные данные пользователей мобильного приложения.
    </Section>

    <Section title="2. Какие данные мы собираем">
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li><b>Номер телефона</b> — для регистрации и входа через OTP-код</li>
        <li><b>Имя и фамилия</b> — для оформления заказов</li>
        <li><b>Дата рождения и пол</b> — для персонализации</li>
        <li><b>История заказов</b> — для отображения в приложении</li>
        <li><b>Push-токен устройства</b> — для отправки уведомлений о заказах</li>
        <li><b>Фото профиля</b> — загружается по желанию пользователя</li>
        <li><b>Адрес доставки</b> — при оформлении доставки</li>
      </ul>
    </Section>

    <Section title="3. Как мы используем данные">
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Обработка и доставка заказов</li>
        <li>Начисление и списание бонусов</li>
        <li>Отправка уведомлений о статусе заказа</li>
        <li>Улучшение качества сервиса</li>
      </ul>
      Мы <b>не продаём</b> и <b>не передаём</b> ваши данные третьим лицам в маркетинговых целях.
    </Section>

    <Section title="4. Сторонние сервисы">
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li><b>Nikita.kg</b> — отправка SMS-кодов для входа</li>
        <li><b>Expo Push Notifications</b> — push-уведомления</li>
        <li><b>Cloudinary</b> — хранение фотографий товаров и профиля</li>
        <li><b>MongoDB Atlas</b> — хранение данных приложения</li>
      </ul>
    </Section>

    <Section title="5. Хранение данных">
      Данные хранятся на защищённых серверах. Данные пользователя удаляются по запросу на электронную почту ниже.
    </Section>

    <Section title="6. Права пользователя">
      Вы вправе:
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Запросить удаление своего аккаунта и данных</li>
        <li>Отказаться от push-уведомлений в настройках телефона</li>
        <li>Изменить или удалить фото профиля</li>
      </ul>
    </Section>

    <Section title="7. Контакты">
      По вопросам конфиденциальности свяжитесь с нами:<br />
      <a href="mailto:rozievdovudbek2@gmail.com" style={{ color: '#2563EB' }}>rozievdovudbek2@gmail.com</a><br />
      г. Ош, Памирская 2, Адыгене Соода борбору
    </Section>

    <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
      © 2025 Хлопок. Все права защищены.
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#111827' }}>{title}</h2>
    <div style={{ fontSize: 15, color: '#374151' }}>{children}</div>
  </div>
);

export default PrivacyPage;
