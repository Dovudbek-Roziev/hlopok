# Hlopok

## Русский

Hlopok — интернет-магазин детской одежды. В проект входят мобильное приложение для покупателей, веб-панель магазина и сервер API.

- `mobile/` — приложение на Expo и React Native. Интерфейс: русский и кыргызский языки.
- `admin/` — панель управления товарами, заказами, складом, акциями, пользователями и бонусами.
- `backend/` — API на Node.js и Express, база MongoDB, загрузка изображений и служебные уведомления.
- Коды подтверждения входа отправляются через Nikita.kg.
- Фотографии хранятся в Cloudinary. Push-уведомления отправляются через Expo Notifications.
- Оплату подтверждает магазин; приложение не обрабатывает данные банковских карт.
- Бонусные правила настраиваются в панели управления.

### Запуск на компьютере

Установите Node.js, затем установите зависимости в каждой папке:

```sh
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

Создайте локальный `backend/.env` с настройками MongoDB, JWT, Nikita.kg и Cloudinary. Не публикуйте секреты и не запускайте команды заполнения базы на рабочей базе.

Запускайте каждую часть в отдельном терминале:

```sh
cd backend && npm run dev
cd admin && npm run dev
cd mobile && npm start
```

Для мобильного приложения задайте `EXPO_PUBLIC_API_URL` и `EXPO_PUBLIC_SOCKET_URL`, если сервер API работает не по адресу по умолчанию.

---

## English

Hlopok is an online children's clothing store. The project includes a customer mobile app, a store administration website, and an API server.

- `mobile/` — Expo and React Native app. The app interface is in Russian and Kyrgyz.
- `admin/` — tools for products, orders, inventory, promotions, customers, and bonuses.
- `backend/` — Node.js and Express API, MongoDB database, image uploads, and service notifications.
- Sign-in verification codes are delivered through Nikita.kg.
- Product images are stored in Cloudinary. Push notifications use Expo Notifications.
- The store confirms payments; the app does not process bank-card details.
- Bonus rules are managed in the admin panel.

### Run locally

Install Node.js, then install dependencies in each folder:

```sh
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

Create a local `backend/.env` with MongoDB, JWT, Nikita.kg, and Cloudinary settings. Keep secrets private, and do not run database-seeding commands against a live store database.

Run each part in a separate terminal:

```sh
cd backend && npm run dev
cd admin && npm run dev
cd mobile && npm start
```

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` for the mobile app when the API is not using its default address.

---

## Кыргызча

Hlopok — балдар кийимдеринин интернет-дүкөнү. Долбоор кардарлар үчүн мобилдик колдонмодон, дүкөндүн башкаруу панелинен жана API серверинен турат.

- `mobile/` — Expo жана React Native менен жасалган колдонмо. Колдонмонун тили орусча жана кыргызча.
- `admin/` — товарларды, буйрутмаларды, кампаны, акцияларды, кардарларды жана бонустарды башкаруу панели.
- `backend/` — Node.js жана Express API, MongoDB базасы, сүрөт жүктөө жана кызматтык билдирмелер.
- Кирүүнү тастыктоо коддору Nikita.kg аркылуу жөнөтүлөт.
- Товарлардын сүрөттөрү Cloudinary'де сакталат. Push-билдирмелер Expo Notifications аркылуу жөнөтүлөт.
- Төлөмдү дүкөн ырастайт; колдонмо банк картасынын маалыматтарын иштетпейт.
- Бонустардын эрежелери башкаруу панелинен жөндөлөт.

### Компьютерде иштетүү

Node.js орнотуп, ар бир папкада көз карандылыктарды орнотуңуз:

```sh
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

MongoDB, JWT, Nikita.kg жана Cloudinary жөндөөлөрү менен жергиликтүү `backend/.env` файлын түзүңүз. Жашыруун маалыматтарды жарыялабаңыз жана базаны толтуруучу буйруктарды иштеп жаткан дүкөндүн базасында колдонбоңуз.

Ар бир бөлүктү өзүнчө терминалда иштетиңиз:

```sh
cd backend && npm run dev
cd admin && npm run dev
cd mobile && npm start
```

API серверинин демейки дареги башка болсо, мобилдик колдонмого `EXPO_PUBLIC_API_URL` жана `EXPO_PUBLIC_SOCKET_URL` маанилерин бериңиз.
