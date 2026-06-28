require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const { BonusSettings } = require('../models/Bonus');
const FAQ = require('../models/FAQ');

// Demo rasm URL lari (picsum.photos — har doim ishlaydi)
const img = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const runSeed = async () => {
  try {
    // ─── Admin ──────────────────────────────────────────────────────
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@hlopok.com' });
    if (!adminExists) {
      const qrData = `hlopok:bonus:admin:${uuidv4()}`;
      const qrCode = await QRCode.toDataURL(qrData);
      await User.create({
        email: process.env.ADMIN_EMAIL || 'admin@hlopok.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
        firstName: 'Admin',
        lastName: 'Хлопок',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        role: 'admin',
        language: 'ru',
        qrCode,
      });
      console.log('✅ Admin yaratildi');
    } else {
      console.log('ℹ️  Admin allaqachon mavjud');
    }

    // ─── Kategoriyalar / Categories ──────────────────────────────────
    const categoriesCount = await Category.countDocuments();
    if (categoriesCount === 0) {
      await Category.insertMany([
        { name_ru: 'Девочки',        name_ky: 'Кыздар',              icon: 'Heart',      order: 1 },
        { name_ru: 'Мальчики',       name_ky: 'Балдар',              icon: 'Star',       order: 2 },
        { name_ru: 'Новорождённые',  name_ky: 'Жаңы төрөлгөндөр',   icon: 'Baby',       order: 3 },
        { name_ru: 'Аксессуары',     name_ky: 'Аксессуарлар',        icon: 'Sparkles',   order: 4 },
        { name_ru: 'Обувь',          name_ky: 'Бут кийим',           icon: 'Footprints', order: 5 },
      ]);
      console.log('✅ Kategoriyalar qoʼshildi');
    }

    // ─── Brendlar / Brands ───────────────────────────────────────────
    const brandsCount = await Brand.countDocuments();
    if (brandsCount === 0) {
      await Brand.insertMany([
        { name: 'Nanica',  order: 1 },
        { name: 'Beren',   order: 2 },
        { name: 'Mininio', order: 3 },
        { name: 'Bebetto', order: 4 },
        { name: 'Losan',   order: 5 },
      ]);
      console.log('✅ Brendlar qoʼshildi');
    }

    // ─── Demo mahsulotlar / Demo products ───────────────────────────
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      const cats   = await Category.find();
      const brands = await Brand.find();

      const cat = (name) => cats.find(c => c.name_ru === name)?._id;
      const brd = (name) => brands.find(b => b.name === name)?._id;

      const variants = (sizes, colors, stock = 10) => {
        const result = [];
        for (const size of sizes) {
          if (colors.length === 0) {
            result.push({ size, color: '', stock });
          } else {
            for (const color of colors) {
              result.push({ size, color, stock });
            }
          }
        }
        return result;
      };

      await Product.insertMany([
        // ── Кыздар (Girls) ─────────────────────────────────────────
        {
          name_ru: 'Платье с цветочным принтом',
          name_ky: 'Гүлдүү принтли кийим',
          description_ru: 'Нежное платье из натурального хлопка с цветочным принтом. Удобно и стильно для маленькой принцессы.',
          description_ky: 'Гүлдүү принттеги жумшак калыбак кийим. Кичинекей принцесса үчүн ыңгайлуу жана стилдүү.',
          price: 1590,
          category: cat('Девочки'),
          brand: brd('Nanica'),
          images: [img('girl-dress-1'), img('girl-dress-2')],
          variants: variants(['86', '92', '98', '104', '110'], ['Розовый', 'Белый', 'Мятный']),
          isNew: true,
        },
        {
          name_ru: 'Пижамный комплект с мишками',
          name_ky: 'Аюулуу пижама жыйнагы',
          description_ru: 'Уютный пижамный комплект с принтом мишек. Мягкий и гипоаллергенный материал.',
          description_ky: 'Аюу принттеги жылуу пижама жыйнагы. Жумшак жана гипоаллергендик материал.',
          price: 1290,
          category: cat('Девочки'),
          brand: brd('Beren'),
          images: [img('girl-pyjama-1'), img('girl-pyjama-2')],
          variants: variants(['80', '86', '92', '98', '104'], ['Розовый', 'Мятный']),
          isBestseller: true,
        },
        {
          name_ru: 'Боди с длинным рукавом',
          name_ky: 'Узун жеңдүү боди',
          description_ru: 'Классический боди из 100% хлопка. Идеален для ежедневной носки.',
          description_ky: '100% калыбактан жасалган классикалык боди. Күнүмдүк кийим үчүн идеал.',
          price: 890,
          category: cat('Девочки'),
          brand: brd('Mininio'),
          images: [img('girl-bodysuit-1'), img('girl-bodysuit-2')],
          variants: variants(['56', '62', '68', '74', '80'], ['Белый', 'Голубой', 'Розовый']),
        },

        // ── Балдар (Boys) ─────────────────────────────────────────
        {
          name_ru: 'Спортивный костюм с капюшоном',
          name_ky: 'Капюшонду спорттук костюм',
          description_ru: 'Удобный спортивный костюм из плотного трикотажа. Подходит для прогулок и активных игр.',
          description_ky: 'Сейилдөө жана активдүү оюндар үчүн ыңгайлуу спорттук костюм.',
          price: 2490,
          category: cat('Мальчики'),
          brand: brd('Bebetto'),
          images: [img('boy-tracksuit-1'), img('boy-tracksuit-2')],
          variants: variants(['86', '92', '98', '104', '110', '116'], ['Серый', 'Тёмно-синий', 'Хаки']),
          isBestseller: true,
        },
        {
          name_ru: 'Рубашка в клетку с джинсами',
          name_ky: 'Торчолуу көйнөк джинс менен',
          description_ru: 'Стильный комплект: рубашка в клетку + джинсовые брюки. Для особых случаев.',
          description_ky: 'Стилдүү жыйнак: торчолуу көйнөк + джинс шым. Атайын учурлар үчүн.',
          price: 2190,
          category: cat('Мальчики'),
          brand: brd('Losan'),
          images: [img('boy-shirt-1'), img('boy-shirt-2')],
          variants: variants(['86', '92', '98', '104', '110'], ['Синий', 'Серый']),
          isNew: true,
        },
        {
          name_ru: 'Толстовка с принтом динозавра',
          name_ky: 'Динозавр принттеги толстовка',
          description_ru: 'Тёплая толстовка с ярким принтом динозавра. Детям очень нравится!',
          description_ky: 'Динозавр принттеги жылуу толстовка. Балдарга абдан жагат!',
          price: 1390,
          category: cat('Мальчики'),
          brand: brd('Nanica'),
          images: [img('boy-hoodie-1'), img('boy-hoodie-2')],
          variants: variants(['92', '98', '104', '110', '116', '122'], ['Серый', 'Зелёный']),
        },

        // ── Жаңы төрөлгөндөр (Newborns) ───────────────────────────
        {
          name_ru: 'Набор бодиков (3 штуки)',
          name_ky: 'Боди жыйнагы (3 дана)',
          description_ru: 'Комплект из 3 бодиков разных цветов. Мягкий хлопок, удобные кнопки снизу.',
          description_ky: '3 түстүү боди жыйнагы. Жумшак калыбак, ыңгайлуу баскычтар.',
          price: 1590,
          category: cat('Новорождённые'),
          brand: brd('Beren'),
          images: [img('newborn-set-1'), img('newborn-set-2')],
          variants: variants(['56', '62', '68'], ['Белый', 'Голубой', 'Розовый']),
          isBestseller: true,
        },
        {
          name_ru: 'Конверт-одеяло на выписку',
          name_ky: 'Чыгарылыш баткак-конверти',
          description_ru: 'Нарядный конверт для выписки. Тёплый и мягкий, украшен кружевом.',
          description_ky: 'Кооз чыгарылыш конверти. Жылуу жана жумшак, кружева менен кооздолгон.',
          price: 2890,
          category: cat('Новорождённые'),
          brand: brd('Mininio'),
          images: [img('newborn-blanket-1'), img('newborn-blanket-2')],
          variants: variants(['56'], ['Белый', 'Розовый', 'Голубой']),
          isNew: true,
        },
        {
          name_ru: 'Ползунки + распашонка в подарочной коробке',
          name_ky: 'Жылмышкычтар + распашонка белек кутусунда',
          description_ru: 'Идеальный подарок для новорождённого. Ползунки и распашонка в красивой коробке.',
          description_ky: 'Жаңы төрөлгөн үчүн идеалдуу белек. Жылмышкычтар жана распашонка кооз кутуда.',
          price: 980,
          category: cat('Новорождённые'),
          brand: brd('Nanica'),
          images: [img('newborn-gift-1'), img('newborn-gift-2')],
          variants: variants(['56', '62', '68', '74'], ['Белый', 'Жёлтый', 'Мятный']),
        },

        // ── Аксессуарлар (Accessories) ────────────────────────────
        {
          name_ru: 'Набор шапочек (3 штуки)',
          name_ky: 'Тебетей жыйнагы (3 дана)',
          description_ru: 'Комплект из 3 хлопковых шапочек разных цветов. Для малышей от 0 до 12 месяцев.',
          description_ky: '3 түстүү калыбак тебетей жыйнагы. 0дон 12 айга чейинки балдарга.',
          price: 690,
          category: cat('Аксессуары'),
          brand: brd('Bebetto'),
          images: [img('accessories-hats-1')],
          variants: variants(['0-6 мес', '6-12 мес'], []),
        },
        {
          name_ru: 'Носочки детские (6 пар)',
          name_ky: 'Балдар чулгуулары (6 жуп)',
          description_ru: 'Набор из 6 пар мягких носочков. Разные расцветки, состав: 95% хлопок.',
          description_ky: '6 жуп жумшак чулгуу жыйнагы. Ар түрдүү түстөр, 95% калыбак.',
          price: 490,
          category: cat('Аксессуары'),
          brand: brd('Losan'),
          images: [img('accessories-socks-1')],
          variants: variants(['0-6 мес', '6-12 мес', '12-24 мес'], []),
          isBestseller: true,
        },
        {
          name_ru: 'Повязка на голову с бантом',
          name_ky: 'Бантуу башбоо',
          description_ru: 'Нежная повязка с бантиком для маленьких принцесс. Эластичная, не давит.',
          description_ky: 'Кичинекей принцессалар үчүн жумшак бантуу башбоо. Эластикалык, кыспайт.',
          price: 290,
          category: cat('Аксессуары'),
          brand: brd('Nanica'),
          images: [img('accessories-headband-1')],
          variants: variants(['One Size'], ['Белый', 'Розовый', 'Фиолетовый', 'Красный']),
          isNew: true,
        },

        // ── Бут кийим (Shoes) ─────────────────────────────────────
        {
          name_ru: 'Пинетки вязаные мягкие',
          name_ky: 'Жумшак токулган пинетка',
          description_ru: 'Мягкие вязаные пинетки. Не давят на ножку, удобны для малышей.',
          description_ky: 'Жумшак токулган пинетка. Буттарга кыспайт, балдарга ыңгайлуу.',
          price: 590,
          category: cat('Обувь'),
          brand: brd('Beren'),
          images: [img('shoes-booties-1'), img('shoes-booties-2')],
          variants: variants(['16', '17', '18'], ['Белый', 'Розовый', 'Голубой']),
        },
        {
          name_ru: 'Кроссовки для девочки',
          name_ky: 'Кыз бала кроссовкасы',
          description_ru: 'Лёгкие кроссовки на липучках. Мягкая подошва, дышащий материал.',
          description_ky: 'Жеңил жабышкаактуу кроссовка. Жумшак туш, дем алдырган материал.',
          price: 1890,
          category: cat('Обувь'),
          brand: brd('Mininio'),
          images: [img('shoes-girl-1'), img('shoes-girl-2')],
          variants: variants(['22', '23', '24', '25', '26', '27'], ['Белый', 'Розовый', 'Золотой']),
          isBestseller: true,
        },
        {
          name_ru: 'Ботинки для мальчика',
          name_ky: 'Бала ботинкасы',
          description_ru: 'Прочные ботинки для активных мальчиков. Защита носка, нескользящая подошва.',
          description_ky: 'Активдүү балдар үчүн бекем ботинка. Учу корголгон, сырышпаган туш.',
          price: 2390,
          category: cat('Обувь'),
          brand: brd('Bebetto'),
          images: [img('shoes-boy-1'), img('shoes-boy-2')],
          variants: variants(['22', '23', '24', '25', '26', '27'], ['Коричневый', 'Чёрный', 'Серый']),
          isNew: true,
        },
      ]);
      console.log('✅ Demo mahsulotlar qoʼshildi (15 ta)');
    }

    // ─── Demo bannerlar / Demo banners ───────────────────────────────
    const bannersCount = await Banner.countDocuments();
    if (bannersCount === 0) {
      const wa = process.env.STORE_WHATSAPP
        ? `https://wa.me/${process.env.STORE_WHATSAPP.replace(/\D/g, '')}`
        : '';
      const tg = process.env.STORE_TELEGRAM
        ? `https://t.me/${process.env.STORE_TELEGRAM}`
        : '';

      await Banner.insertMany([
        {
          type: 'slider',
          image: img('banner-kids-1', 1200, 500),
          title_ru: 'Новая коллекция весна–лето 2025',
          title_ky: 'Жаңы коллекция жаз–жай 2025',
          linkUrl: '',
          order: 1,
          isActive: true,
        },
        {
          type: 'slider',
          image: img('banner-kids-2', 1200, 500),
          title_ru: 'Скидки до 30% на детскую одежду',
          title_ky: 'Балдар кийимдерине 30% чейин арзандатуу',
          linkUrl: '',
          order: 2,
          isActive: true,
        },
        {
          type: 'slider',
          image: img('banner-kids-3', 1200, 500),
          title_ru: 'Бесплатные бонусы при каждой покупке',
          title_ky: 'Ар бир сатып алууда акысыз бонустар',
          linkUrl: '',
          order: 3,
          isActive: true,
        },
        {
          type: 'promo',
          image: img('banner-promo-1', 1200, 500),
          title_ru: 'Напишите нам в WhatsApp',
          title_ky: 'Бизге WhatsApp жазыңыз',
          whatsappUrl: wa,
          telegramUrl: tg,
          order: 1,
          isActive: true,
        },
      ]);
      console.log('✅ Demo bannerlar qoʼshildi (4 ta)');
    }

    // ─── FAQ savol-javoblar / FAQ ─────────────────────────────────────
    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      await FAQ.insertMany([
        {
          q_ru: 'Как оформить заказ?',
          a_ru: 'Выберите товар, добавьте в корзину, нажмите «Оформить заказ». Укажите своё имя и телефон, затем нажмите «Заказать».',
          q_ky: 'Кантип буйрутма берүүгө болот?',
          a_ky: 'Товар тандап, себетке кошуп, «Буйрутма берүү» баскычын басыңыз. Атыңызды жана телефонуңузду жазып, «Буйрутма» баскычын басыңыз.',
          order: 1,
        },
        {
          q_ru: 'Когда будет готов заказ?',
          a_ru: 'Мы свяжемся с вами в течение 30 минут. Режим работы: 9:00–21:00.',
          q_ky: 'Буйрутма качан даяр болот?',
          a_ky: '30 мүнөт ичинде биз сиз менен байланышабыз. Иш убактысы: 9:00–21:00.',
          order: 2,
        },
        {
          q_ru: 'Как получить бонусы?',
          a_ru: 'Каждая покупка = +5% бонус в сомах. Покажите QR-код кассиру для начисления в магазине.',
          q_ky: 'Бонустарды кантип алуу керек?',
          a_ky: 'Ар бир сатып алуу = +5% бонус сомдо. Дүкөндө QR кодду кассирге көрсөтүңүз.',
          order: 3,
        },
        {
          q_ru: 'Есть ли доставка?',
          a_ru: 'Для доставки напишите нам в WhatsApp или Telegram — уточним детали и стоимость.',
          q_ky: 'Жеткирүү барбы?',
          a_ky: 'Жеткирүү үчүн WhatsApp же Telegram аркылуу жазыңыз — деталдарды жана баасын тактайбыз.',
          order: 4,
        },
        {
          q_ru: 'Можно ли вернуть товар?',
          a_ru: 'Товар надлежащего качества обменивается в течение 14 дней при наличии бирки.',
          q_ky: 'Товарды кайтарса болобу?',
          a_ky: 'Сапаттуу товар 14 күн ичинде этикетка менен алмаштырылат.',
          order: 5,
        },
        {
          q_ru: 'Как оплатить онлайн?',
          a_ru: 'Выберите «Онлайн» при оформлении заказа. Вы будете перенаправлены на страницу оплаты, где можно оплатить картой Mbank, ElCard или Visa/Mastercard.',
          q_ky: 'Онлайн кантип төлөш керек?',
          a_ky: 'Буйрутма бергенде «Онлайн» тандаңыз. Mbank, ElCard же Visa/Mastercard картасы менен төлөй турган бетке жиберилесиз.',
          order: 6,
        },
        {
          q_ru: 'Как узнать размер ребёнка?',
          a_ru: 'Основной ориентир — рост ребёнка. Например: рост 86 см = размер 86, рост 98 см = размер 98. При сомнениях лучше выбрать на размер больше.',
          q_ky: 'Баланын өлчөмүн кантип билсе болот?',
          a_ky: 'Негизги белги — баланын бою. Мисалы: бою 86 см = 86 өлчөм, бою 98 см = 98 өлчөм. Шектенсеңиз, бир өлчөм чоңураагын тандаган жакшы.',
          order: 7,
        },
        {
          q_ru: 'Можно ли забронировать товар?',
          a_ru: 'Да, напишите нам в WhatsApp или Telegram — забронируем для вас.',
          q_ky: 'Товарды алдын ала жазып алса болобу?',
          a_ky: 'Ооба, WhatsApp же Telegramга жазыңыз — сиз үчүн жазып алабыз.',
          order: 8,
        },
      ]);
      console.log('✅ FAQ qoʼshildi (8 ta)');
    }

    // ─── Bonus sozlamalari / Bonus settings ─────────────────────────
    const settingsExists = await BonusSettings.findOne();
    if (!settingsExists) {
      await BonusSettings.create({ bonusPercent: 5, expiryDays: 90, warningDays: 7 });
      console.log('✅ Bonus sozlamalari yaratildi');
    }

    console.log('🎉 Seed muvaffaqiyatli bajarildi!');
    return { success: true };
  } catch (error) {
    console.error('❌ Seed xatosi:', error);
    throw error;
  }
};

module.exports = { runSeed };

// Mustaqil ishga tushirish: node src/utils/seed.js
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => runSeed())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
