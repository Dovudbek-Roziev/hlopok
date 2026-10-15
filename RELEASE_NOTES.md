# Hlopok — main’даги release тузатишлари

Асос: `6fd189a` — Prepare Hlopok v2. Янги ишчи branch очилмади.
Ҳақиқий базага уланилмади, OTP/push юборилмади, deploy қилинмади.

## Кодда бажарилди

- Checkout: буюртма, омбор, акция ва бонус битта MongoDB транзакциясида.
- Такрорий сўров бир буюртмани қайтаради; мазмун ўзгарса 409.
- Охирги акция донасида чегирма сақланади; эски акцияга checkout рад этилади.
- Такрорий вариант ва каср омбор сони рад этилади.
- Маҳсулот/акция таҳририда эски формани сақлашдан ҳимоя.
- Cashback сарфланган бўлса автоматик cancellation 409; дўкон билан қўлда ҳисоблаш керак. Манфий баланс ёки автоматик пул қайтариш қўшилмади.
- Қўлда бонус қўшиш баланс ва тарих билан транзакцияда.
- Мавжуд бизнес қоидаси сақланди: бонус муддати аккаунт бўйича; ҳар хариддан янги 90 кун бошланмайди. Ready — буюртма тайёр; бу автоматик тўлов эмас.
- Logout барча JWT сессиялари ва push token’ларни бекор қилади. Socket ҳар 30 сонияда қайта текширилади.
- OTP юбориш учун базага сақланадиган IP/телефон лимити ва атомик cooldown. Рўйхатдан ўтиш proof ва user билан транзакцияда.
- Парол билан аккаунт ўчириш, шахсий маълумотларни транзакцияда тозалаш, пароль hash’ини олиб ташлаш. Фақат шахсни аниқламайдиган user/order/bonus ҳисоб ёзувлари қолади.
- Cloudinary cleanup навбати: ўчириш муваффақиятсиз бўлса maintenance қайта уринади.
- Янги изоҳлар аввал админ тасдиғидан ўтади. Қоидалар розилиги, report, block/unblock, админ модерация саҳифаси.
- Буюртма, бонус ва изоҳ тарихларида кейинги саҳифалар.
- Профилда privacy, marketing opt-in, blocklist ва deletion экрани.
- Маркетинг push фақат алоҳида розилик берганларга. Order push’ларига бу чеклов қўлланмайди.
- Бонус cron startup’да ва ҳар 15 дақиқада catch-up; кунлик ҳисоблар Bishkek бўйича.
- Расмларни decode қилиш, 25MP чегара, resize/JPEG; маҳсулот учун 4×5MB.
- Админ lazy-loading, sessionStorage ва CSP/security header’лар.
- Кераксиз Android storage/overlay/camera/microphone рўхсатлари ва iOS FaceID изоҳи блокланди.
- Mobile: 1.0.1, Android versionCode 3, iOS buildNumber 2. Console’да бу рақамлар аввал ишлатилмаганини текшириш шарт.

## Release’дан олдин

1. Production backup олинг ва тиклашни текширинг. Бу ерда бажарилмади.
2. Node 22+; Render’да NODE_ENV=production, MONGODB_URI, JWT_SECRET 32+ белги, Nikita/Cloudinary ва admin URL’ларини текширинг. Сирларни GitHub’га қўйманг.
3. Базани текшириш учун алоҳида рухсатдан кейин `cd backend && node scripts/release-check.js`. Default фақат ўқийди. Production autoIndex/autoCreate ўчирилган: индексларни release’дан олдин тайёрлаш керак. Duplicate’ларни автоматик ўчирмайди.
4. Backup ва рухсатдан кейин шу скриптнинг `--apply-indexes` варианти индексларни яратади. Бу иш ҳали бажарилмаган. Ҳақиқий база индекслари бор деб ҳисобламанг.
5. Изоляцияланган staging replica-set’да parallel checkout, duplicate retry, cancellation/payment/bonus, account deletion ва OTP’ни тўлиқ синаш керак. Unit тестлар ҳақиқий MongoDB транзакциясини исботламайди.
6. Backend/admin/mobile’ни мувофиқ чиқаринг: янги admin expectedUpdatedAt юборади, янги mobile review қоидаларини ва deletion паролини юборади. Эски mobile’да review/deletion учун тушунарли хато чиқиши мумкин; эски версияни production’да синамай туриб API’ни алмаштирманг.
7. Эски изоҳларда approved йўқ: улар модерация рўйхатида қолади, ўз-ўзидан оммага чиқмайди. Админ кўриб тасдиқлайди.
8. Мавжуд мижозларда marketingPush=false; янги розиликсиз реклама юборилмайди.
9. Privacy оператори, retention муддати, deletion email’ини кузатиш тартибини дўкон тасдиқлайди. Store Data Safety/App Privacy’ни ҳақиқий data flow’га мос тўлдиринг.
10. Реал телефонда OTP, push cold-start, checkout, bonus, deletion; AAB/IPA ва merged manifest’ни текширинг. Store қабул қилиши кафолатланмайди.

## Nikita

Мавжуд SMS XML API сақланди. WhatsApp’га етказиш Nikita аккаунти созламасига боғлиқ. Ҳақиқий етказиш текширилмади. SMS/WhatsApp канал танлаш API’си тасдиқланмагани учун сохта канал тугмалари қўшилмади. Play Marketга чиқиш SMS’ни автоматик ёқмайди.

## Чегаралар

- Ҳақиқий база ва provider’лар синови алоҳида рухсат талаб қилади.
- Render Free уйқуси/лимитлари сақланади; user capacity/load-test қилинмади.
- Offline logout серверга етиб бормаса revocation кафолатланмайди.
- SessionStorage HttpOnly эмас; XSS’дан мутлақ ҳимоя эмас.
- Expo/Metro build занжирида upstream npm advisories қолиши мумкин; SDK’ни 44’га мажбурий тушириш қилинмади.
- Push acceptance етказиш кафолати эмас; durable order push outbox ҳали қўшилмаган.

## Бажарилган текширувлар

- 16 та backend unit/regression тести базасиз mock билан ўтди.
- Admin production build ва mobile TypeScript ўтди.
- Android/iOS Hermes экспорт ўтди. Имзоланган native build эмас.
- Браузерда RU/KY deletion саҳифаси, 390px overflow, guest redirect ва админ moderation publish/refresh mock API билан текширилди.
- Backend/admin npm audit: 0. Mobile critical: 0; 22 та upstream огоҳлантириш (14 high, 8 moderate) қолган, асосан Expo/Metro build занжирида. Улар алоҳида баҳоланади.
- Ҳақиқий MongoDB, реал OTP/push, AAB/IPA ва store console текширилмади.

## Локал текшириш

`backend`: npm ci, npm test. Тестлар базасиз mock билан.

`admin`: npm ci, npm run build.

`mobile`: npm ci, npx tsc --noEmit, CI=1 EXPO_OFFLINE=1 npx expo export --platform all --max-workers 2.
