# Hlopok

### Children's clothing store | Mobile app, admin panel, and API

Hlopok is a multilingual commerce project for browsing children's clothing, placing orders, and managing store operations. It brings the customer experience, store administration, and backend services together in one codebase.

## Product

- **Mobile app** — product catalog, search and filters, favorites, cart, checkout, order history, bonus card, and push notification support.
- **Admin panel** — dashboard, products, inventory, orders, promotions, customers, reviews, store settings, and bonus rules.
- **Backend API** — authentication, catalog and inventory, order lifecycle, bonuses, reviews, image handling, and real-time events.
- **Languages** — Russian and Kyrgyz in the mobile app and API messages; Russian, Kyrgyz, and English in project documentation.

## Technology

| Area | Stack |
| --- | --- |
| Mobile | React Native, Expo SDK 57, TypeScript, React Navigation, Zustand |
| Admin | React, TypeScript, Vite, TanStack Query |
| Backend | Node.js 22+, Express, MongoDB, Mongoose, Socket.IO |
| Integrations | Nikita.kg OTP delivery, Cloudinary media storage, Expo Notifications |

## Repository

```text
admin/      Store administration web app
backend/    Express API and database models
mobile/     Expo mobile application
```

## Local development

Use Node.js 22 or later for the backend. Install dependencies separately in each application:

```sh
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install
```

Configure the required local environment variables in `backend/.env` and the mobile API URL in the Expo environment. Keep credentials and service keys out of version control. Use a dedicated development database for local work.

Run each service in its own terminal:

```sh
cd backend && npm run dev
cd admin && npm run dev
cd mobile && npm start
```

## Русский

Hlopok — проект интернет-магазина детской одежды: мобильное приложение для покупателей, веб-панель управления и сервер API.

- **Приложение:** каталог, поиск, избранное, корзина, оформление и история заказов, бонусная карта и поддержка push-уведомлений.
- **Панель управления:** товары, склад, заказы, акции, клиенты, отзывы, настройки магазина и бонусные правила.
- **Сервер:** авторизация, каталог и остатки, обработка заказов, бонусы, отзывы, изображения и события в реальном времени.
- **Технологии:** React Native, Expo SDK 57, React, TypeScript, Vite, Node.js, Express, MongoDB и Socket.IO.
- **Интеграции:** доставка кодов подтверждения через Nikita.kg, хранение изображений в Cloudinary, push через Expo Notifications.

Для локальной разработки требуется Node.js 22 или новее. Установите зависимости отдельно в `backend/`, `admin/` и `mobile/`, настройте локальные переменные окружения и запускайте каждую часть своей командой из раздела выше. Не добавляйте ключи и пароли в Git.

## Кыргызча

Hlopok — балдар кийимдеринин интернет-дүкөнү үчүн түзүлгөн долбоор. Ал кардарлардын мобилдик колдонмосун, башкаруу панелин жана API серверин бириктирет.

- **Мобилдик колдонмо:** товарлар каталогу, издөө, тандалгандар, себет, буйрутма берүү жана тарыхы, бонус картасы жана push-билдирмелерди колдоо.
- **Башкаруу панели:** товарлар, кампа, буйрутмалар, акциялар, кардарлар, пикирлер, дүкөн жөндөөлөрү жана бонус эрежелери.
- **Сервер:** кирүү, каталог жана калдыктар, буйрутмаларды иштетүү, бонустар, пикирлер, сүрөттөр жана реалдуу убакыттагы окуялар.
- **Технологиялар:** React Native, Expo SDK 57, React, TypeScript, Vite, Node.js, Express, MongoDB жана Socket.IO.
- **Интеграциялар:** тастыктоо коддору Nikita.kg аркылуу жөнөтүлөт, сүрөттөр Cloudinary'де сакталат, push-билдирмелер Expo Notifications аркылуу колдоого алынат.

Жергиликтүү иштеп чыгуу үчүн Node.js 22 же андан жаңы версиясы керек. `backend/`, `admin/` жана `mobile/` папкаларындагы көз карандылыктарды өз-өзүнчө орнотуп, жергиликтүү жөндөөлөрдү конфигурациялаңыз. Сырсөздөрдү жана ачкычтарды Git'ке кошпоңуз.
