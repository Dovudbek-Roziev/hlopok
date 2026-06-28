<div align="center">

# 🧵 HLOPOK

### Full-Stack E-Commerce Platform for Textile Store

<img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Expo_SDK-52-000020?style=for-the-badge&logo=expo&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white"/>

<br/>

> **Production-ready** mobile commerce app with real-time order tracking, loyalty bonus system, push notifications, and a full-featured admin panel — all in Russian & Kyrgyz.

</div>

---

## 🌍 Languages / Языки / Тилдер / Tillar

- [🇬🇧 English](#-english)
- [🇷🇺 Русский](#-русский)
- [🇰🇬 Кыргызча](#-кыргызча)
- [🇺🇿 O'zbekcha](#-ozbekcha)

---

## 🇬🇧 English

### What is Hlopok?

**Hlopok** is a complete e-commerce ecosystem built for a real textile retail store in Kyrgyzstan. The platform consists of three interconnected parts: a cross-platform mobile app for customers, a web-based admin panel for store managers, and a scalable REST API backend — all deployed to the cloud and production-ready.

### ✨ Key Features

**Mobile App**
- 🛍️ Product catalog with categories, brands, search and smart filters
- 💸 Active promotions with automatic discount badges and sale prices
- 🎁 Loyalty bonus system — earn cashback on every order, pay with bonuses
- 🛒 Full cart & checkout flow with delivery or pickup options
- 📦 Real-time order status tracking via Socket.io polling
- 🔔 Push notifications for order updates (Expo Notifications)
- 🌍 Full multilingual support: Russian + Kyrgyz
- 🌙 Smooth animations and transitions throughout the app
- 👤 User profile, order history, address management

**Admin Panel**
- 📊 Dashboard with live sales statistics and charts
- 📦 Full product management (CRUD, images via Cloudinary, stock tracking)
- 🗂️ Category & brand management with image upload
- 🎯 Promotions — create sales with discount %, date range, product lists
- 🛒 Order management with status updates (triggers push notifications)
- 👥 User management — view customers, block users, reset passwords
- 🎁 Bonus system settings (cashback %, expiry days)
- 📢 Push broadcast — send notifications to all/active/bonus users
- 🏪 Store settings — address, hours, phone, payment QR codes
- ❓ FAQ management

**Backend**
- 🔐 JWT authentication with refresh tokens
- 📱 OTP login via SMS (Nikita.kg SMS gateway)
- ☁️ Image uploads via Cloudinary
- 🔄 Real-time updates via Socket.io (polling-compatible for serverless)
- 🛡️ Role-based access control (admin / user)

### 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Mobile App** | React Native 0.76, Expo SDK 52, TypeScript, Tamagui UI, TanStack React Query, React Navigation, i18next, Socket.io client, Expo Notifications |
| **Admin Panel** | React 18, TypeScript, Vite, React Router v6, TanStack Query, Lucide Icons, i18next (RU/KY) |
| **Backend API** | Node.js, Express.js, MongoDB, Mongoose ODM, Socket.io, JWT, bcrypt, Cloudinary SDK |
| **Auth & SMS** | JWT + Refresh tokens, OTP via Nikita.kg SMS gateway |
| **Media Storage** | Cloudinary (images, QR codes, banners) |
| **Database** | MongoDB Atlas (cloud) |
| **Deployment** | Vercel (backend serverless + admin SPA), EAS Build (Android/iOS APK) |
| **Dev Tools** | ESLint, TypeScript strict mode, Expo Dev Client |

### 📐 Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Admin Panel   │
│  React Native   │     │  React + Vite   │
│   Expo SDK 52   │     │   TypeScript    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │     REST API + WS     │
         ▼                       ▼
┌─────────────────────────────────────────┐
│            Backend (Node.js)            │
│         Express + Socket.io             │
│              Vercel                     │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  MongoDB    │  │  Cloudinary │
│   Atlas     │  │   Images    │
└─────────────┘  └─────────────┘
```

---

## 🇷🇺 Русский

### Что такое Hlopok?

**Hlopok** — это полноценная e-commerce экосистема для реального текстильного магазина в Кыргызстане. Платформа состоит из трёх взаимосвязанных частей: кроссплатформенного мобильного приложения для покупателей, веб-панели администратора для менеджеров магазина и масштабируемого REST API бэкенда — всё задеплоено в облаке и готово к продакшену.

### ✨ Ключевые возможности

**Мобильное приложение**
- 🛍️ Каталог товаров с категориями, брендами, поиском и фильтрами
- 💸 Акции и скидки — автоматические бейджи и зачёркнутые цены
- 🎁 Система лояльности — кэшбэк бонусами с каждого заказа, оплата бонусами
- 🛒 Корзина, оформление заказа — доставка или самовывоз
- 📦 Отслеживание статуса заказа в реальном времени через Socket.io
- 🔔 Push-уведомления при изменении статуса заказа
- 🌍 Полная мультиязычность: Русский + Кыргызский
- 🌙 Плавные анимации и переходы по всему приложению
- 👤 Профиль, история заказов, управление адресами

**Панель администратора**
- 📊 Дашборд с живой статистикой продаж и графиками
- 📦 Полное управление товарами (CRUD, загрузка фото через Cloudinary, остатки)
- 🗂️ Управление категориями и брендами с загрузкой изображений
- 🎯 Акции — создание скидок с процентом, датами и списком товаров
- 🛒 Управление заказами — смена статусов (автоматически отправляет push)
- 👥 Управление пользователями — просмотр, блокировка, сброс паролей
- 📢 Push-рассылка — отправка уведомлений всем / активным / бонусным пользователям
- 🏪 Настройки магазина — адрес, часы, телефон, QR-коды оплаты
- ❓ Управление FAQ

### 🛠️ Стек технологий

| Слой | Технологии |
|---|---|
| **Мобильное** | React Native 0.76, Expo SDK 52, TypeScript, Tamagui UI, TanStack React Query, React Navigation, i18next, Socket.io, Expo Notifications |
| **Админ-панель** | React 18, TypeScript, Vite, React Router v6, TanStack Query, Lucide Icons, i18next (RU/KY) |
| **Бэкенд** | Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, bcrypt, Cloudinary SDK |
| **Аутентификация** | JWT + Refresh-токены, OTP по SMS через Nikita.kg |
| **Хранилище медиа** | Cloudinary (изображения, QR-коды, баннеры) |
| **База данных** | MongoDB Atlas (облако) |
| **Деплой** | Vercel (бэкенд serverless + admin SPA), EAS Build (Android/iOS) |

---

## 🇰🇬 Кыргызча

### Hlopok деген эмне?

**Hlopok** — Кыргызстандагы чыныгы текстиль дүкөнү үчүн курулган толук e-commerce экосистема. Платформа үч өз ара байланышкан бөлүктөн турат: сатып алуучулар үчүн кросс-платформа мобилдик колдонмо, дүкөн менеджерлери үчүн веб-администратор панели жана булутка жайгаштырылган масштабдуу REST API бэкенд.

### ✨ Негизги мүмкүнчүлүктөр

**Мобилдик колдонмо**
- 🛍️ Категориялар, брендлер, издөө жана чыпкалар менен товарлар каталогу
- 💸 Акциялар — автоматтык арзандатуу белгилери жана сызылган баалар
- 🎁 Лоялдуулук системасы — ар бир буйрутмадан бонус, бонус менен төлөө
- 🛒 Корзина, буйрутма берүү — жеткирүү же өзү алып кетүү
- 📦 Socket.io аркылуу буйрутма статусун реалдуу убакытта кузатуу
- 🔔 Буйрутма статусу өзгөргөндө push-билдирмелер
- 🌍 Толук көп тилдүүлүк: Орусча + Кыргызча
- 👤 Профиль, буйрутмалар тарыхы, дарек башкаруу

**Администратор панели**
- 📊 Жашоо статистикасы жана диаграммалары менен дашборд
- 📦 Товарларды толук башкаруу (CRUD, Cloudinary аркылуу сүрөт жүктөө)
- 🎯 Акциялар — арзандатуу пайызы, даталар жана товарлар тизмеси
- 🛒 Буйрутмаларды башкаруу — статустарды өзгөртүү (push автоматтык жөнөтүлөт)
- 👥 Колдонуучуларды башкаруу — кароо, бөгөттөө, сырсөзді баштапкы абалга келтирүү
- 📢 Push-рассылка — бардык/активдүү/бонустуу колдонуучуларга билдирмелер

### 🛠️ Технологиялар

| Катмар | Технологиялар |
|---|---|
| **Мобилдик** | React Native 0.76, Expo SDK 52, TypeScript, Tamagui, React Query, i18next |
| **Админ панели** | React 18, TypeScript, Vite, React Router v6, TanStack Query |
| **Бэкенд** | Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, Cloudinary |
| **Жайгаштыруу** | Vercel (бэкенд + админ), EAS Build (Android/iOS APK) |

---

## 🇺🇿 O'zbekcha

### Hlopok nima?

**Hlopok** — Qirg'izistondagi real to'qimachilik do'koni uchun qurilgan to'liq e-commerce ekotizim. Platforma uch o'zaro bog'liq qismdan iborat: xaridorlar uchun kross-platforma mobil ilova, do'kon menejerlari uchun veb-admin panel va bulutga joylashtirilgan REST API backend.

### ✨ Asosiy imkoniyatlar

**Mobil ilova**
- 🛍️ Kategoriyalar, brendlar, qidiruv va filtrlar bilan mahsulotlar katalogi
- 💸 Aksiyalar — avtomatik chegirma belgilari va chizilgan narxlar
- 🎁 Sadoqat tizimi — har bir buyurtmadan bonus, bonus bilan to'lash
- 🛒 Savat, buyurtma berish — yetkazib berish yoki olib ketish
- 📦 Socket.io orqali buyurtma holatini real vaqtda kuzatish
- 🔔 Buyurtma holati o'zgarganda push bildirishnomalar
- 🌍 To'liq ko'p tillilik: Rus + Qirg'iz

**Admin panel**
- 📊 Jonli savdo statistikasi va grafiklar bilan dashboard
- 📦 Mahsulotlarni to'liq boshqarish (CRUD, Cloudinary orqali rasm yuklash)
- 🎯 Aksiyalar — chegirma foizi, sanalar va mahsulotlar ro'yxati
- 🛒 Buyurtmalarni boshqarish — holatlarni o'zgartirish (push avtomatik yuboriladi)
- 👥 Foydalanuvchilarni boshqarish — ko'rish, bloklash, parolni tiklash
- 📢 Push xabar yuborish — barcha/faol/bonus foydalanuvchilarga

### 🛠️ Texnologiyalar

| Qatlam | Texnologiyalar |
|---|---|
| **Mobil** | React Native 0.76, Expo SDK 52, TypeScript, Tamagui, React Query, i18next |
| **Admin panel** | React 18, TypeScript, Vite, React Router v6, TanStack Query |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, Cloudinary |
| **Deploy** | Vercel (backend + admin), EAS Build (Android/iOS APK) |

---

## 📁 Project Structure

```
Hlopok/
│
├── 📱 mobile/                    # React Native + Expo mobile app
│   ├── app/
│   │   ├── screens/              # 20+ app screens
│   │   │   ├── home/             # HomeScreen
│   │   │   ├── catalog/          # CatalogScreen, CategoryScreen
│   │   │   ├── product/          # ProductScreen
│   │   │   ├── cart/             # CartScreen, CheckoutScreen
│   │   │   ├── orders/           # OrdersScreen, OrderDetailScreen
│   │   │   ├── promotions/       # PromotionsScreen, PromotionDetailScreen
│   │   │   ├── profile/          # ProfileScreen, BonusScreen, etc.
│   │   │   └── auth/             # LoginScreen, RegisterScreen, OtpScreen
│   │   ├── api/                  # API client + all endpoint functions
│   │   ├── components/           # Shared UI components
│   │   ├── store/                # Zustand state management
│   │   ├── theme/                # Colors, useColors hook (dark/light)
│   │   └── i18n/                 # RU + KY translations
│   └── eas.json                  # EAS Build config
│
├── 🖥️  admin/                    # React web admin panel
│   ├── src/
│   │   ├── pages/                # 12+ admin pages
│   │   │   ├── DashboardPage     # Stats & charts
│   │   │   ├── ProductsPage      # Product CRUD
│   │   │   ├── OrdersPage        # Order management
│   │   │   ├── PromotionsPage    # Sales & discounts
│   │   │   ├── BonusPage         # Loyalty system
│   │   │   ├── UsersPage         # User management
│   │   │   ├── BannersPage       # Banner management
│   │   │   ├── FAQPage           # FAQ management
│   │   │   └── SettingsPage      # Store & account settings
│   │   ├── components/           # Shared UI (Toast, Confirm, etc.)
│   │   ├── api/                  # API client + endpoints
│   │   ├── store/                # Admin auth store
│   │   └── i18n/                 # RU + KY translations
│   └── vercel.json               # Vercel SPA routing config
│
└── ⚙️  backend/                  # Node.js REST API
    ├── src/
    │   ├── controllers/          # Business logic
    │   ├── models/               # Mongoose schemas
    │   │   ├── User, Order       # Core models
    │   │   ├── Product, Category, Brand
    │   │   ├── Promotion, Banner, Bonus
    │   │   ├── Review, FAQ, OTP
    │   ├── routes/               # Express routes
    │   ├── middleware/           # Auth, admin guards
    │   └── utils/                # SMS, push, helpers
    └── vercel.json               # Vercel serverless config
```

---

## 🚀 Deployment

| Service | Platform | Status |
|---|---|---|
| Backend API | Vercel (Serverless) | ✅ Live |
| Admin Panel | Vercel (Static SPA) | ✅ Live |
| Mobile App | EAS Build (APK) | ✅ Ready |
| Database | MongoDB Atlas | ✅ Live |
| Media Storage | Cloudinary | ✅ Live |
| SMS Gateway | Nikita.kg | ✅ Connected |

---

<div align="center">

**Built with passion for Hlopok textile store 🧵**

*React Native • Node.js • MongoDB • Vercel*

</div>
