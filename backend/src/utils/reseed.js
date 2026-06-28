// To'liq tozalash va qayta seed / Full clear and reseed
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const User        = require('../models/User');
const Category    = require('../models/Category');
const Brand       = require('../models/Brand');
const Product     = require('../models/Product');
const Banner      = require('../models/Banner');
const Promotion   = require('../models/Promotion');
const Order       = require('../models/Order');
const FAQ         = require('../models/FAQ');
const { BonusSettings, BonusTransaction } = require('../models/Bonus');
const StoreSettings = require('../models/StoreSettings');

// loremflickr — tegga qarab haqiqiy rasm qaytaradi, lock=N bilan har doim bir xil
const P = (lock, tags, w = 600, h = 600) =>
  `https://loremflickr.com/${w}/${h}/${tags}?lock=${lock}`;

const reseed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌 MongoDB ulandi');

  // ─── Tozalash ────────────────────────────────────────────────────
  console.log('🗑️  Eski malumotlar ochirilmoqda...');
  await Promise.all([
    Product.deleteMany({}),
    Banner.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Promotion.deleteMany({}),
    FAQ.deleteMany({}),
    BonusSettings.deleteMany({}),
    BonusTransaction.deleteMany({}),
    Order.deleteMany({}),
    StoreSettings.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
  ]);
  console.log('✅ Eski malumotlar ochirildi');

  // ─── Admin ───────────────────────────────────────────────────────
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const qrCode = await QRCode.toDataURL(`hlopok:bonus:admin:${uuidv4()}`);
    await User.create({
      email:     process.env.ADMIN_EMAIL    || 'admin@hlopok.osh',
      password:  process.env.ADMIN_PASSWORD || 'Admin123456',
      firstName: 'Admin', lastName: 'Хлопок',
      gender: 'male', birthDate: new Date('1990-01-01'),
      role: 'admin', language: 'ru', qrCode,
    });
    console.log('✅ Admin yaratildi');
  } else {
    console.log('ℹ️  Admin saqlanib qolindi');
  }

  // ─── Do'kon sozlamalari ──────────────────────────────────────────
  await StoreSettings.create({
    phone:       process.env.STORE_PHONE || '+996222098531',
    whatsapp:    `https://wa.me/${(process.env.STORE_WHATSAPP || '+996222098531').replace(/\D/g, '')}`,
    instagram:   `https://instagram.com/${process.env.STORE_INSTAGRAM || 'hlopok_osh2'}`,
    telegram:    `https://t.me/${process.env.STORE_TELEGRAM || 'hlopokosh2'}`,
    address_ru:  process.env.STORE_ADDRESS || 'Памирская 2, Адыгене Соода борбору, Ош',
    address_ky:  process.env.STORE_ADDRESS || 'Памирская 2, Адыгене Соода борбору, Ош',
    hours_ru:    process.env.STORE_HOURS   || '9:00 – 21:00',
    hours_ky:    process.env.STORE_HOURS   || '9:00 – 21:00',
    paymentCard: '',
    paymentName: '',
  });
  console.log('✅ Dokon sozlamalari');

  // ─── Kategoriyalar ───────────────────────────────────────────────
  const cats = await Category.insertMany([
    { name_ru: 'Девочки',       name_ky: 'Кыздар',            icon: 'Heart',      order: 1 },
    { name_ru: 'Мальчики',      name_ky: 'Балдар',            icon: 'Star',       order: 2 },
    { name_ru: 'Новорождённые', name_ky: 'Жаңы төрөлгөндөр', icon: 'Baby',       order: 3 },
    { name_ru: 'Аксессуары',    name_ky: 'Аксессуарлар',      icon: 'Sparkles',   order: 4 },
    { name_ru: 'Обувь',         name_ky: 'Бут кийим',         icon: 'Footprints', order: 5 },
  ]);
  const C = Object.fromEntries(cats.map(c => [c.name_ru, c._id]));
  console.log('✅ Kategoriyalar (5)');

  // ─── Brendlar + logolar ──────────────────────────────────────────
  // picsum — har bir brend uchun o'ziga xos belgi rangi
  const brands = await Brand.insertMany([
    { name: 'Nanica',  logo: P(101,'kids,fashion,brand',300,300),  description: 'Турецкий бренд детской одежды', order: 1 },
    { name: 'Beren',   logo: P(102,'kids,clothing,brand',300,300), description: 'Качественная турецкая одежда',  order: 2 },
    { name: 'Mininio', logo: P(103,'baby,fashion,brand',300,300),  description: 'Нежные коллекции для малышей',  order: 3 },
    { name: 'Bebetto', logo: P(104,'children,style,brand',300,300),description: 'Стильная детская одежда',       order: 4 },
    { name: 'Losan',   logo: P(105,'kids,wear,brand',300,300),     description: 'Испанский бренд для детей',     order: 5 },
  ]);
  const B = Object.fromEntries(brands.map(b => [b.name, b._id]));
  console.log('✅ Brendlar (5) + logolar');

  // ─── Yordamchi funksiya: variantlar ──────────────────────────────
  const v = (sizes, colors, stock = 15) => {
    const out = [];
    for (const s of sizes)
      for (const c of (colors.length ? colors : ['']))
        out.push({ size: s, color: c, stock });
    return out;
  };

  // ─── Mahsulotlar ─────────────────────────────────────────────────
  const products = await Product.insertMany([

    // ══════════ KIZLAR ══════════
    {
      name_ru: 'Платье с цветочным принтом',
      name_ky: 'Гүлдүү принтли көйнөк',
      description_ru: 'Нежное платье из натурального хлопка с цветочным принтом. Приятное на ощупь, идеально для прогулок и праздников. Состав: 100% хлопок.',
      description_ky: 'Гүлдүү принттеги жумшак табигый калыбак көйнөк. Сейилдөө жана майрамдар үчүн идеал. Курамы: 100% калыбак.',
      price: 1590, category: C['Девочки'], brand: B['Nanica'],
      images: [P(1,'girl,dress,kids,clothing'), P(2,'girl,dress,pink,children')],
      variants: v(['86','92','98','104','110'], ['#e91e63','#ffffff','#b2dfdb']),
      isNew: true, isBestseller: false,
    },
    {
      name_ru: 'Пижамный комплект «Мишки»',
      name_ky: '«Аюулар» пижама жыйнагы',
      description_ru: 'Уютный пижамный комплект с принтом медвежат. Мягкий флис, тёплый. Состав: 80% хлопок, 20% полиэстер.',
      description_ky: 'Аюу принттеги жылуу пижама жыйнагы. Жумшак флис. Курамы: 80% калыбак, 20% полиэстер.',
      price: 1290, category: C['Девочки'], brand: B['Beren'],
      images: [P(3,'baby,pajama,kids,clothing'), P(4,'children,pajama,pink,soft')],
      variants: v(['80','86','92','98','104'], ['#e91e63','#b2dfdb','#ffd700']),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Боди с длинным рукавом (3 шт.)',
      name_ky: 'Узун жеңдүү боди (3 дана)',
      description_ru: 'Набор из 3 бодиков разных цветов. Мягкий хлопок, удобные кнопки снизу. Гипоаллергенный материал.',
      description_ky: '3 боди жыйнагы, ар түрдүү түстөр. Жумшак калыбак, ыңгайлуу баскычтар. Гипоаллергендик материал.',
      price: 980, category: C['Девочки'], brand: B['Mininio'],
      images: [P(5,'baby,bodysuit,newborn,clothing'), P(6,'infant,onesie,baby,white')],
      variants: v(['56','62','68','74','80'], ['#ffffff','#e91e63','#03a9f4']),
      isNew: false, isBestseller: true,
    },

    // ══════════ O'G'IL BOLALAR ══════════
    {
      name_ru: 'Спортивный костюм с капюшоном',
      name_ky: 'Капюшонду спорттук костюм',
      description_ru: 'Удобный спортивный костюм из плотного трикотажа. Подходит для прогулок и активных игр. Состав: 95% хлопок, 5% эластан.',
      description_ky: 'Сейилдөө жана активдүү оюндар үчүн ыңгайлуу спорттук костюм. Курамы: 95% калыбак, 5% эластан.',
      price: 2490, category: C['Мальчики'], brand: B['Bebetto'],
      images: [P(7,'boy,tracksuit,kids,sport'), P(8,'children,sportwear,boy,clothing')],
      variants: v(['86','92','98','104','110','116'], ['#9e9e9e','#1565c0','#8d6e63']),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Рубашка в клетку + джинсы',
      name_ky: 'Торчолуу көйнөк + джинс',
      description_ru: 'Стильный комплект: рубашка в клетку и джинсовые брюки. Для особых случаев и ежедневной носки.',
      description_ky: 'Стилдүү жыйнак: торчолуу көйнөк жана джинс шым. Атайын учурлар жана күнүмдүк кийим үчүн.',
      price: 2190, category: C['Мальчики'], brand: B['Losan'],
      images: [P(9,'boy,shirt,jeans,kids'), P(10,'children,boy,casual,clothing')],
      variants: v(['86','92','98','104','110'], ['#2196f3','#9e9e9e']),
      isNew: true, isBestseller: false,
    },
    {
      name_ru: 'Толстовка «Динозавр»',
      name_ky: '«Динозавр» толстовкасы',
      description_ru: 'Тёплая толстовка с ярким принтом динозавра. С капюшоном и карманом кенгуру. Дети в восторге!',
      description_ky: 'Динозавр принттеги жылуу толстовка. Капюшон жана кенгуру чөнтөгү бар. Балдарга абдан жагат!',
      price: 1390, category: C['Мальчики'], brand: B['Nanica'],
      images: [P(11,'boy,hoodie,kids,sweatshirt'), P(12,'children,hoodie,boy,grey')],
      variants: v(['92','98','104','110','116','122'], ['#9e9e9e','#4caf50','#1565c0']),
      isNew: true, isBestseller: false,
    },

    // ══════════ YANGI TUG'ILGANLAR ══════════
    {
      name_ru: 'Набор бодиков для новорождённого (5 шт.)',
      name_ky: 'Жаңы төрөлгөн үчүн боди жыйнагы (5 дана)',
      description_ru: 'Комплект из 5 бодиков. Мягкий хлопок, удобные кнопки. Идеален для первых месяцев жизни малыша.',
      description_ky: '5 боди жыйнагы. Жумшак калыбак, ыңгайлуу баскычтар. Баланын алгачкы айлары үчүн идеал.',
      price: 1590, category: C['Новорождённые'], brand: B['Beren'],
      images: [P(13,'newborn,baby,clothing,set'), P(14,'infant,baby,clothes,white')],
      variants: v(['50','56','62','68'], ['#ffffff','#03a9f4','#e91e63']),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Конверт-одеяло на выписку',
      name_ky: 'Чыгарылыш баткак-конверти',
      description_ru: 'Нарядный конверт для выписки из роддома. Тёплый и мягкий, украшен кружевом. Отличный подарок!',
      description_ky: 'Роддомдон чыгаруу үчүн кооз конверт. Жылуу жана жумшак, кружева менен кооздолгон. Сонун белек!',
      price: 2890, category: C['Новорождённые'], brand: B['Mininio'],
      images: [P(15,'baby,blanket,newborn,wrap'), P(16,'infant,swaddle,baby,soft')],
      variants: v(['50','56'], ['#ffffff','#e91e63','#03a9f4']),
      isNew: true, isBestseller: false,
    },
    {
      name_ru: 'Ползунки + распашонка (подарочный набор)',
      name_ky: 'Жылмышкычтар + распашонка (белек жыйнагы)',
      description_ru: 'Идеальный подарок для новорождённого в красивой подарочной упаковке. Состав: 100% хлопок.',
      description_ky: 'Жаңы төрөлгөн үчүн идеалдуу белек кооз таңгакта. Курамы: 100% калыбак.',
      price: 980, category: C['Новорождённые'], brand: B['Nanica'],
      images: [P(17,'baby,gift,clothing,newborn'), P(18,'infant,baby,gift,set')],
      variants: v(['50','56','62','68','74'], ['#ffffff','#ffd700','#b2dfdb']),
      isNew: false, isBestseller: false,
    },

    // ══════════ AKSESSUARLAR ══════════
    {
      name_ru: 'Набор шапочек (3 штуки)',
      name_ky: 'Тебетей жыйнагы (3 дана)',
      description_ru: 'Комплект из 3 мягких хлопковых шапочек разных цветов. Для малышей 0–12 месяцев.',
      description_ky: '3 жумшак калыбак тебетей жыйнагы, ар түрдүү түстөр. 0–12 айлык балдарга.',
      price: 690, category: C['Аксессуары'], brand: B['Bebetto'],
      images: [P(19,'baby,hat,knit,infant')],
      variants: v(['0–6 мес','6–12 мес'], []),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Носочки детские (6 пар)',
      name_ky: 'Балдар чулгуулары (6 жуп)',
      description_ru: 'Набор из 6 пар мягких носочков с рисунком. Состав: 95% хлопок, 5% эластан.',
      description_ky: '6 жуп жумшак сүрөттүү чулгуу жыйнагы. Курамы: 95% калыбак, 5% эластан.',
      price: 490, category: C['Аксессуары'], brand: B['Losan'],
      images: [P(20,'baby,socks,kids,cute')],
      variants: v(['0–6 мес','6–12 мес','12–24 мес'], []),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Повязка на голову с бантом',
      name_ky: 'Бантуу башбоо',
      description_ru: 'Нежная повязка с бантиком для маленьких принцесс. Эластичная резинка, не давит на голову.',
      description_ky: 'Кичинекей принцессалар үчүн жумшак бантуу башбоо. Эластикалык, башты кыспайт.',
      price: 290, category: C['Аксессуары'], brand: B['Nanica'],
      images: [P(21,'baby,headband,girl,bow')],
      variants: v(['One Size'], ['#ffffff','#e91e63','#9c27b0','#e53935']),
      isNew: true, isBestseller: false,
    },

    // ══════════ OYOQ KIYIM ══════════
    {
      name_ru: 'Пинетки вязаные мягкие',
      name_ky: 'Жумшак токулган пинетка',
      description_ru: 'Мягкие вязаные пинетки. Не давят на ножку. Для малышей 0–9 месяцев.',
      description_ky: 'Жумшак токулган пинетка. Буттарга кыспайт. 0–9 айлык балдарга.',
      price: 590, category: C['Обувь'], brand: B['Beren'],
      images: [P(22,'baby,booties,shoes,knit'), P(23,'infant,shoes,baby,soft')],
      variants: v(['16','17','18'], ['Белый','Розовый','Голубой']),
      isNew: false, isBestseller: false,
    },
    {
      name_ru: 'Кроссовки для девочки на липучке',
      name_ky: 'Кыз бала жабышкаак кроссовкасы',
      description_ru: 'Лёгкие кроссовки на липучках. Мягкая подошва, дышащий материал. Удобно одевать самостоятельно.',
      description_ky: 'Жеңил жабышкаактуу кроссовка. Жумшак туш, дем алдырган материал. Өз алдынча кийүүгө ыңгайлуу.',
      price: 1890, category: C['Обувь'], brand: B['Mininio'],
      images: [P(24,'girl,sneakers,kids,shoes'), P(25,'children,sneakers,pink,shoes')],
      variants: v(['22','23','24','25','26','27'], ['#ffffff','#e91e63','#ffc107']),
      isNew: false, isBestseller: true,
    },
    {
      name_ru: 'Ботинки для мальчика демисезонные',
      name_ky: 'Бала жарым мезгилдик ботинкасы',
      description_ru: 'Прочные ботинки для активных мальчиков. Защита носка, нескользящая подошва. Весна–осень.',
      description_ky: 'Активдүү балдар үчүн бекем ботинка. Учу корголгон, сырышпаган туш. Жаз–күз.',
      price: 2390, category: C['Обувь'], brand: B['Bebetto'],
      images: [P(26,'boy,boots,kids,shoes'), P(27,'children,boots,brown,shoes')],
      variants: v(['22','23','24','25','26','27'], ['#795548','#1a1a1a','#9e9e9e']),
      isNew: true, isBestseller: false,
    },
  ]);
  console.log('✅ Mahsulotlar (15)');

  // ─── Aksiyalar / Promotions ──────────────────────────────────────
  const now   = new Date();
  const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 kun
  const plus14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 kun

  // Aksiyaga qo'shish uchun mahsulotlar
  const girlProducts   = products.filter(p => p.category.toString() === C['Девочки'].toString());
  const boyProducts    = products.filter(p => p.category.toString() === C['Мальчики'].toString());
  const shoeProducts   = products.filter(p => p.category.toString() === C['Обувь'].toString());
  const newbornProducts= products.filter(p => p.category.toString() === C['Новорождённые'].toString());

  await Promotion.insertMany([
    {
      image: P(301, 'kids,fashion,spring,sale', 1200, 500),
      title_ru: '🌸 Весенняя распродажа — скидка 20%',
      title_ky: '🌸 Жазгы сатуу — 20% арзандатуу',
      description_ru: 'Весенняя распродажа детской одежды! Скидка 20% на платья, пижамы и спортивные костюмы. Успейте купить по выгодной цене!',
      description_ky: 'Балдар кийиминин жазгы сатуусу! Көйнөктөргө, пижамаларга жана спорттук костюмдарга 20% арзандатуу. Пайдалуу баада сатып алыңыз!',
      startDate: now,
      endDate:   plus30,
      isActive:  true,
      discountPercent: 20,
      products: [
        ...girlProducts.map(p => ({ product: p._id, limit: null })),
        ...boyProducts.map(p => ({ product: p._id, limit: null })),
      ],
    },
    {
      image: P(302, 'children,shoes,kids,footwear', 1200, 500),
      title_ru: '👟 Скидка 15% на всю обувь',
      title_ky: '👟 Бардык бут кийимге 15% арзандатуу',
      description_ru: 'Специальное предложение на детскую обувь! Кроссовки, ботинки и пинетки со скидкой 15%. Предложение ограничено!',
      description_ky: 'Балдар бут кийимине атайын сунуш! Кроссовкалар, ботинкалар жана пинеткалар 15% арзандатуу менен. Сунуш чектелген!',
      startDate: now,
      endDate:   plus14,
      isActive:  true,
      discountPercent: 15,
      products: shoeProducts.map(p => ({ product: p._id, limit: null })),
    },
    {
      image: P(303, 'newborn,baby,gift,clothing', 1200, 500),
      title_ru: '🎁 Подарочный набор новорождённому −10%',
      title_ky: '🎁 Жаңы төрөлгөнгө белек жыйнагы −10%',
      description_ru: 'Готовитесь к появлению малыша? Все товары для новорождённых со скидкой 10%. Идеальный подарок на рождение!',
      description_ky: 'Баланын келишине даярданып жатасызбы? Бардык жаңы төрөлгөн товарлар 10% арзандатуу менен. Туулган күнгө идеалдуу белек!',
      startDate: now,
      endDate:   plus30,
      isActive:  true,
      discountPercent: 10,
      products: newbornProducts.map(p => ({ product: p._id, limit: null })),
    },
  ]);
  console.log('✅ Aksiyalar (3)');

  // ─── Bannerlar ───────────────────────────────────────────────────
  const wa = `https://wa.me/${(process.env.STORE_WHATSAPP || '+996222098531').replace(/\D/g,'')}`;
  const tg = `https://t.me/${process.env.STORE_TELEGRAM || 'hlopokosh2'}`;

  await Banner.insertMany([
    {
      type: 'slider', order: 1, isActive: true,
      image:    P(201,'children,fashion,spring,clothing', 1200, 500),
      title_ru: '🌸 Новая коллекция весна–лето 2025',
      title_ky: '🌸 Жаны коллекция жаз–жай 2025',
      linkUrl: '',
    },
    {
      type: 'slider', order: 2, isActive: true,
      image:    P(202,'kids,sale,fashion,children', 1200, 500),
      title_ru: '⭐ Скидки до 20% — только сейчас!',
      title_ky: '⭐ Азыр гана 20% га чейин арзандатуу!',
      linkUrl: '',
    },
    {
      type: 'slider', order: 3, isActive: true,
      image:    P(203,'baby,gift,children,cute', 1200, 500),
      title_ru: '🎁 Бонусы +5% при каждой покупке',
      title_ky: '🎁 Ар бир сатып алууда +5% бонус',
      linkUrl: '',
    },
    {
      type: 'promo', order: 1, isActive: true,
      image:       P(204,'kids,fashion,store,children', 1200, 500),
      title_ru:    'Напишите нам в WhatsApp или Telegram',
      title_ky:    'Бизге WhatsApp же Telegramга жазыңыз',
      whatsappUrl: wa,
      telegramUrl: tg,
    },
  ]);
  console.log('✅ Bannerlar (4)');

  // ─── FAQ ─────────────────────────────────────────────────────────
  await FAQ.insertMany([
    {
      q_ru: 'Как оформить заказ?',
      a_ru: 'Выберите товар, нажмите «Добавить в корзину», затем «Оформить заказ». Укажите имя, телефон и нажмите «Заказать» — мы свяжемся с вами в течение 30 минут.',
      q_ky: 'Кантип буйрутма берүүгө болот?',
      a_ky: 'Товар тандап, «Себетке кошуу» баскычын, андан «Буйрутма берүү» баскычын басыңыз. Атыңызды, телефонуңузду жазып «Буйрутма» баскычын басыңыз — 30 мүнөт ичинде кайрылабыз.',
      order: 1,
    },
    {
      q_ru: 'Как узнать размер ребёнка?',
      a_ru: 'Ориентируйтесь на рост ребёнка: рост 86 см = размер 86, рост 98 = размер 98. При сомнениях берите на размер больше — дети растут быстро!',
      q_ky: 'Баланын өлчөмүн кантип билсе болот?',
      a_ky: 'Баланын бою боюнча: бою 86 см = 86 өлчөм, бою 98 = 98 өлчөм. Шектенсеңиз, бир өлчөм чоңураагын алыңыз — балдар тез өсөт!',
      order: 2,
    },
    {
      q_ru: 'Есть ли доставка по городу?',
      a_ru: 'Да! Напишите нам в WhatsApp или Telegram с номером заказа — уточним адрес и время доставки.',
      q_ky: 'Шаар ичинде жеткирүү барбы?',
      a_ky: 'Ооба! Буйрутма номери менен WhatsApp же Telegramга жазыңыз — дарек жана убакытты тактайбыз.',
      order: 3,
    },
    {
      q_ru: 'Как получить и использовать бонусы?',
      a_ru: 'Каждая покупка = +5% бонус. В магазине покажите QR-код кассиру. В приложении бонусы начисляются автоматически и можно потратить при следующем заказе.',
      q_ky: 'Бонустарды кантип алып, колдонсо болот?',
      a_ky: 'Ар бир сатып алуу = +5% бонус. Дүкөндө QR кодду кассирге көрсөтүңүз. Колдонмодо бонустар автоматтык эсептелет, кийинки буйрутмада колдонсо болот.',
      order: 4,
    },
    {
      q_ru: 'Как оплатить онлайн?',
      a_ru: 'При оформлении выберите «Онлайн» — вы перейдёте на страницу оплаты картой Mbank, ElCard, Visa или Mastercard.',
      q_ky: 'Онлайн кантип төлөш керек?',
      a_ky: 'Буйрутма бергенде «Онлайн» тандаңыз — Mbank, ElCard, Visa же Mastercard картасы менен төлөй турган бетке жиберилесиз.',
      order: 5,
    },
    {
      q_ru: 'Можно ли вернуть или обменять товар?',
      a_ru: 'Товар надлежащего качества можно обменять в течение 14 дней при наличии бирки. Напишите нам в WhatsApp для деталей.',
      q_ky: 'Товарды кайтарып же алмаштырса болобу?',
      a_ky: 'Сапаттуу товарды этикетка менен 14 күн ичинде алмаштырууга болот. Деталдары үчүн WhatsApp аркылуу жазыңыз.',
      order: 6,
    },
    {
      q_ru: 'Когда готов заказ при самовывозе?',
      a_ru: 'Обычно через 30 минут после оформления. Мы позвоним или напишем. Адрес: Памирская 2, Адыгене Соода борбору, Ош.',
      q_ky: 'Өзү алганда буйрутма качан даяр болот?',
      a_ky: 'Адатта буйрутма берилгенден 30 мүнөт өткөндөн кийин. Чалабыз же жазабыз. Дарек: Памирская 2, Адыгене Соода борбору, Ош.',
      order: 7,
    },
    {
      q_ru: 'Можно ли забронировать товар?',
      a_ru: 'Да! Напишите нам в WhatsApp или Telegram — забронируем нужный товар в вашем размере.',
      q_ky: 'Товарды алдын ала жазып алса болобу?',
      a_ky: 'Ооба! WhatsApp же Telegramга жазыңыз — керектүү өлчөмдөгү товарды жазып алабыз.',
      order: 8,
    },
  ]);
  console.log('✅ FAQ (8)');

  // ─── Bonus ───────────────────────────────────────────────────────
  await BonusSettings.create({ bonusPercent: 5, expiryDays: 90, warningDays: 7 });
  console.log('✅ Bonus sozlamalari (5%)');

  console.log('\n🎉 Reseed tugadi!');
  console.log('   📦 15 mahsulot  |  🎠 4 banner  |  🔥 3 aksiya');
  console.log('   📂 5 kategoriya |  🏷️  5 brend   |  ❓ 8 FAQ');
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => reseed())
  .then(() => { mongoose.disconnect(); process.exit(0); })
  .catch(e => { console.error('❌ XATO:', e.message); process.exit(1); });
