export type SupportLanguage = 'en' | 'ps' | 'fa' | 'ar' | 'uk';
export type LocalizedCopy = Record<SupportLanguage, string>;

export const supportLanguages: Record<SupportLanguage, { label: string; native: string; dir: 'ltr' | 'rtl'; status: 'verified-source' | 'ai-draft' }> = {
  en: { label: 'English', native: 'English', dir: 'ltr', status: 'verified-source' },
  ps: { label: 'Pashto', native: 'پښتو', dir: 'rtl', status: 'ai-draft' },
  fa: { label: 'Persian/Farsi', native: 'فارسی', dir: 'rtl', status: 'ai-draft' },
  ar: { label: 'Arabic', native: 'العربية', dir: 'rtl', status: 'ai-draft' },
  uk: { label: 'Ukrainian', native: 'Українська', dir: 'ltr', status: 'ai-draft' },
};

export const sharedCopy = {
  supportLanguage: {
    en: 'Support language', ps: 'د مرستې ژبه', fa: 'زبان پشتیبان', ar: 'لغة الدعم', uk: 'Мова підтримки',
  },
  supportDescription: {
    en: 'German stays visible. Explanations and available translations follow your selection.',
    ps: 'الماني متن تل ښکاري. تشریحات او شته ژباړې ستاسو له ټاکنې سره بدلېږي.',
    fa: 'متن آلمانی همیشه دیده می‌شود. توضیح‌ها و ترجمه‌های موجود با انتخاب شما تغییر می‌کنند.',
    ar: 'يبقى النص الألماني ظاهرًا. تتغير الشروح والترجمات المتاحة حسب اختيارك.',
    uk: 'Німецький текст завжди залишається видимим. Пояснення й доступні переклади змінюються відповідно до вибору.',
  },
  aiDraft: {
    en: 'English source', ps: 'د AI مسوده · بیاکتنې ته اړتیا لري', fa: 'پیش‌نویس هوش مصنوعی · نیازمند بازبینی', ar: 'مسودة بالذكاء الاصطناعي · تحتاج مراجعة', uk: 'Чернетка ШІ · потребує перевірки',
  },
  englishFallback: {
    en: 'Verified English source',
    ps: 'پښتو ژباړه لا نه ده ارزول شوې؛ باوري انګلیسي متن ښودل کېږي.',
    fa: 'ترجمهٔ فارسی هنوز بازبینی نشده است؛ متن معتبر انگلیسی نمایش داده می‌شود.',
    ar: 'لم تُراجع الترجمة العربية بعد؛ يُعرض النص الإنجليزي الموثق.',
    uk: 'Український переклад ще не перевірено; показано перевірений англійський текст.',
  },
  meaning: { en: 'Meaning', ps: 'مانا', fa: 'معنی', ar: 'المعنى', uk: 'Значення' },
  example: { en: 'Example', ps: 'بېلګه', fa: 'مثال', ar: 'مثال', uk: 'Приклад' },
  grammarForms: { en: 'Grammar and forms', ps: 'ګرامر او بڼې', fa: 'دستور و شکل‌ها', ar: 'القواعد والصيغ', uk: 'Граматика і форми' },
  hint: { en: 'Hint', ps: 'لارښوونه', fa: 'راهنمایی', ar: 'تلميح', uk: 'Підказка' },
  strongerHint: { en: 'Show another hint', ps: 'بله لارښوونه وښایئ', fa: 'راهنمایی بعدی', ar: 'إظهار تلميح آخر', uk: 'Показати ще одну підказку' },
  closeHint: { en: 'Close hint', ps: 'لارښوونه بنده کړئ', fa: 'بستن راهنمایی', ar: 'إغلاق التلميح', uk: 'Закрити підказку' },
  transcript: { en: 'German transcript', ps: 'الماني لیکلی متن', fa: 'متن آلمانی', ar: 'النص الألماني', uk: 'Німецький текст' },
} satisfies Record<string, LocalizedCopy>;

export const g01Support = {
  situation: {
    en: 'Mila sends her friend a short update after the weekend. She says what she did, and her friend asks what happened on Sunday.',
    ps: 'میلا له اونۍ پای وروسته خپل ملګري ته لنډ خبر ورکوي. هغه وایي څه یې کړي دي، او ملګری یې پوښتي چې د یکشنبې په ورځ څه وشول.',
    fa: 'میلا پس از آخر هفته خبر کوتاهی برای دوستش می‌فرستد. او می‌گوید چه کارهایی انجام داده و دوستش می‌پرسد یکشنبه چه اتفاقی افتاد.',
    ar: 'ترسل ميلا إلى صديقها تحديثًا قصيرًا بعد عطلة نهاية الأسبوع. تخبره بما فعلته، ويسألها عمّا حدث يوم الأحد.',
    uk: 'Після вихідних Міла надсилає другові коротке повідомлення. Вона розповідає, що зробила, а друг запитує, що сталося в неділю.',
  },
  objective: {
    en: 'Build the Perfekt with the correct present-tense form of haben and place the supplied participle at the end.',
    ps: 'Perfekt د haben له سمې اوسنۍ بڼې سره جوړ کړئ او ورکړل شوی Partizip د جملې په پای کې کېږدئ.',
    fa: 'Perfekt را با شکل درست زمان حالِ haben بسازید و Partizip داده‌شده را در پایان جمله قرار دهید.',
    ar: 'كوّن Perfekt باستعمال صيغة الحاضر الصحيحة من haben، وضع اسم المفعول المعطى في نهاية الجملة.',
    uk: 'Утворюйте Perfekt із правильною формою haben у теперішньому часі та ставте поданий Partizip у кінці речення.',
  },
  steps: [
    {
      heading: { en: 'Meaning first', ps: 'لومړی مانا', fa: 'نخست معنا', ar: 'المعنى أولًا', uk: 'Спочатку значення' },
      body: {
        en: 'Use the Perfekt for a completed familiar action. In everyday conversation it commonly answers “Was hast du gemacht?”',
        ps: 'Perfekt د یوې بشپړې شوې پېژندل شوې کړنې لپاره وکاروئ. په ورځنیو خبرو کې دا ډېری وخت د «Was hast du gemacht?» ځواب دی.',
        fa: 'برای کاری آشنا که کامل شده است از Perfekt استفاده کنید. در گفت‌وگوی روزمره معمولاً پاسخ «Was hast du gemacht?» است.',
        ar: 'استخدم Perfekt لعمل مألوف اكتمل. وفي الحديث اليومي يأتي غالبًا جوابًا عن «Was hast du gemacht?»',
        uk: 'Використовуйте Perfekt для завершеної знайомої дії. У повсякденній розмові це звична відповідь на «Was hast du gemacht?».',
      },
    },
    {
      heading: { en: 'Add the helping verb haben', ps: 'مرستندوی فعل haben ورزیات کړئ', fa: 'فعل کمکی haben را اضافه کنید', ar: 'أضف الفعل المساعد haben', uk: 'Додайте допоміжне дієслово haben' },
      body: {
        en: 'The finite form matches the subject: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
        ps: 'صرف شوې بڼه له فاعل سره سمون لري: ich habe، du hast، er/sie/es hat، wir haben، ihr habt، sie/Sie haben.',
        fa: 'شکل صرف‌شده با فاعل هماهنگ است: ich habe، du hast، er/sie/es hat، wir haben، ihr habt، sie/Sie haben.',
        ar: 'تطابق الصيغة المصرفة الفاعل: ich habe، du hast، er/sie/es hat، wir haben، ihr habt، sie/Sie haben.',
        uk: 'Особова форма узгоджується з підметом: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
      },
    },
    {
      heading: { en: 'Put the participle at the end', ps: 'Partizip په پای کې کېږدئ', fa: 'Partizip را در پایان بگذارید', ar: 'ضع اسم المفعول في النهاية', uk: 'Поставте Partizip у кінці' },
      body: {
        en: 'The participle names the completed action. In “Ich habe am Samstag gearbeitet”, habe is near the front and gearbeitet closes the sentence.',
        ps: 'Partizip بشپړه شوې کړنه ښيي. په «Ich habe am Samstag gearbeitet» کې habe مخ ته دی او gearbeitet جمله پای ته رسوي.',
        fa: 'Partizip کار کامل‌شده را بیان می‌کند. در «Ich habe am Samstag gearbeitet»، واژهٔ habe نزدیک آغاز و gearbeitet در پایان است.',
        ar: 'يدل اسم المفعول على الفعل المكتمل. في «Ich habe am Samstag gearbeitet» تأتي habe قرب البداية وتغلق gearbeitet الجملة.',
        uk: 'Partizip називає завершену дію. У «Ich habe am Samstag gearbeitet» habe стоїть ближче до початку, а gearbeitet завершує речення.',
      },
    },
    {
      heading: { en: 'Notice the sentence bracket', ps: 'د جملې چوکاټ ته پام وکړئ', fa: 'به قاب جمله توجه کنید', ar: 'لاحظ إطار الجملة', uk: 'Зверніть увагу на рамку речення' },
      body: {
        en: 'The two verb parts make a frame: Ich | habe | am Samstag lange | gearbeitet. Time, people or objects can stand inside it.',
        ps: 'د فعل دوه برخې چوکاټ جوړوي: Ich | habe | am Samstag lange | gearbeitet. وخت، کسان یا څیزونه د چوکاټ په منځ کې راتلای شي.',
        fa: 'دو بخش فعل یک قاب می‌سازند: Ich | habe | am Samstag lange | gearbeitet. زمان، شخص یا مفعول می‌تواند میان آن‌ها بیاید.',
        ar: 'يصنع جزآ الفعل إطارًا: Ich | habe | am Samstag lange | gearbeitet. ويمكن أن تأتي معلومات الزمن أو الأشخاص أو الأشياء داخله.',
        uk: 'Дві дієслівні частини утворюють рамку: Ich | habe | am Samstag lange | gearbeitet. Усередині можуть стояти обставини часу, люди або об’єкти.',
      },
    },
    {
      heading: { en: 'Make questions', ps: 'پوښتنې جوړې کړئ', fa: 'پرسش بسازید', ar: 'كوّن أسئلة', uk: 'Утворюйте запитання' },
      body: {
        en: 'In a W-question the question word comes first and haben second. A yes/no question begins with haben. The participle stays at the end.',
        ps: 'په W-پوښتنه کې پوښتنیزه کلمه لومړی او haben دوهم راځي. هو/نه پوښتنه له haben پیلېږي. Partizip په پای کې پاتې کېږي.',
        fa: 'در پرسش W، واژهٔ پرسشی نخست و haben دوم می‌آید. پرسش بله/خیر با haben آغاز می‌شود. Partizip در پایان می‌ماند.',
        ar: 'في سؤال W تأتي أداة السؤال أولًا وhaben ثانيًا. يبدأ سؤال نعم/لا بـhaben، ويبقى اسم المفعول في النهاية.',
        uk: 'У W-запитанні питальне слово стоїть першим, а haben — другим. Запитання так/ні починається з haben. Partizip залишається в кінці.',
      },
    },
  ],
};

export const g01Patterns = [
  {
    function: { en: 'Statement', ps: 'خبري جمله', fa: 'جملهٔ خبری', ar: 'جملة خبرية', uk: 'Розповідне речення' },
    formula: 'Subject + finite haben + middle information + Partizip II',
    example: ['Ich', 'habe', 'gestern', 'gelernt.'],
    meaning: { en: 'I studied yesterday.', ps: 'ما پرون زده کړه وکړه.', fa: 'من دیروز درس خواندم.', ar: 'درستُ أمس.', uk: 'Я вчився / вчилася вчора.' },
  },
  {
    function: { en: 'W-question', ps: 'W-پوښتنه', fa: 'پرسش W', ar: 'سؤال بأداة استفهام', uk: 'W-запитання' },
    formula: 'Question word + finite haben + subject + middle information + Partizip II?',
    example: ['Was', 'hast', 'du', 'gemacht?'],
    meaning: { en: 'What did you do?', ps: 'تا څه وکړل؟', fa: 'چه کار کردی؟', ar: 'ماذا فعلت؟', uk: 'Що ти робив / робила?' },
  },
  {
    function: { en: 'Yes/no question', ps: 'هو/نه پوښتنه', fa: 'پرسش بله/خیر', ar: 'سؤال نعم/لا', uk: 'Запитання так/ні' },
    formula: 'Finite haben + subject + middle information + Partizip II?',
    example: ['Hast', 'du', 'den Film', 'gesehen?'],
    meaning: { en: 'Did you see the film?', ps: 'ایا تا فلم ولید؟', fa: 'آیا فیلم را دیدی؟', ar: 'هل شاهدتَ الفيلم؟', uk: 'Ти бачив / бачила фільм?' },
  },
];

export const hintLibrary: Record<string, { first: LocalizedCopy; second?: LocalizedCopy }> = {
  grammarVerbParts: {
    first: {
      en: 'Look for the conjugated form of haben and a past participle near the end.',
      ps: 'د haben صرف شوې بڼه او د پای خوا ته Partizip ولټوئ.',
      fa: 'شکل صرف‌شدهٔ haben و یک Partizip را نزدیک پایان جمله پیدا کنید.',
      ar: 'ابحث عن صيغة haben المصرفة واسم المفعول قرب نهاية الجملة.',
      uk: 'Знайдіть особову форму haben і Partizip ближче до кінця речення.',
    },
    second: {
      en: 'The first verb part is habe. Now find the completed-action form that closes the sentence.',
      ps: 'د فعل لومړۍ برخه habe ده. اوس هغه بڼه ومومئ چې بشپړه شوې کړنه ښيي او جمله پای ته رسوي.',
      fa: 'بخش نخست فعل habe است. حالا شکلی را پیدا کنید که کار کامل‌شده را نشان می‌دهد و جمله را می‌بندد.',
      ar: 'الجزء الأول من الفعل هو habe. ابحث الآن عن الصيغة التي تدل على الفعل المكتمل وتغلق الجملة.',
      uk: 'Перша дієслівна частина — habe. Тепер знайдіть форму завершеної дії, яка закриває речення.',
    },
  },
  vocabulary: {
    first: {
      en: 'Say the German word aloud, then recall the meaning before opening the example.',
      ps: 'الماني کلمه په لوړ غږ ووایئ، بیا د بېلګې له پرانیستلو مخکې یې مانا په یاد کړئ.',
      fa: 'واژهٔ آلمانی را با صدای بلند بگویید، سپس پیش از باز کردن مثال معنی را به یاد بیاورید.',
      ar: 'انطق الكلمة الألمانية بصوت مرتفع، ثم تذكّر معناها قبل فتح المثال.',
      uk: 'Вимовте німецьке слово вголос, а потім пригадайте значення, перш ніж відкривати приклад.',
    },
  },
  listening: {
    first: {
      en: 'On the first listen, follow only the main event and the order words. Save details for the second listen.',
      ps: 'په لومړي ځل یوازې اصلي پېښه او د ترتیب کلمې تعقیب کړئ. جزئیات دوهم ځل ته پرېږدئ.',
      fa: 'در بار نخست فقط رویداد اصلی و واژه‌های ترتیب را دنبال کنید. جزئیات را برای بار دوم بگذارید.',
      ar: 'في الاستماع الأول ركّز على الحدث الرئيسي وكلمات الترتيب فقط. اترك التفاصيل للمرة الثانية.',
      uk: 'Під час першого прослуховування стежте лише за головною подією та словами послідовності. Деталі залиште на друге прослуховування.',
    },
  },
  podcast: {
    first: {
      en: 'Use the chapter title and timestamp to predict the next event before you listen.',
      ps: 'له اورېدو مخکې د څپرکي له سرلیک او وخت څخه د راتلونکې پېښې اټکل وکړئ.',
      fa: 'پیش از گوش دادن، با عنوان فصل و زمان آن رویداد بعدی را پیش‌بینی کنید.',
      ar: 'استخدم عنوان الفصل ووقته لتتوقع الحدث التالي قبل الاستماع.',
      uk: 'Перед прослуховуванням спрогнозуйте наступну подію за назвою розділу й часовою позначкою.',
    },
  },
  revision: {
    first: {
      en: 'Start with the items due today. Recall first, then check the model only after your attempt.',
      ps: 'له هغو توکو پیل وکړئ چې نن یې وخت دی. لومړی یې په یاد کړئ، بیا له خپلې هڅې وروسته نمونه وګورئ.',
      fa: 'با مواردی شروع کنید که امروز موعدشان است. نخست از یاد پاسخ دهید و سپس الگو را بررسی کنید.',
      ar: 'ابدأ بالعناصر المستحقة اليوم. حاول التذكر أولًا، ثم افحص النموذج بعد محاولتك.',
      uk: 'Почніть із матеріалу, запланованого на сьогодні. Спершу пригадайте, а модель перевіряйте лише після спроби.',
    },
  },
};

// The English fields are approved source content. The four added languages are AI-authored
// learner-support drafts and are deliberately labelled as requiring qualified review.
export const vocabularyMeaningDrafts: Record<string, LocalizedCopy> = {
  'A2-U01-V01-X01': { en: 'trip; excursion', ps: 'سفر؛ چکر', fa: 'سفر کوتاه؛ گردش', ar: 'رحلة؛ نزهة', uk: 'поїздка; екскурсія' },
  'A2-U01-V01-X02': { en: 'visit', ps: 'لیدنه', fa: 'دیدار', ar: 'زيارة', uk: 'візит' },
  'A2-U01-V01-X03': { en: 'event; organized public activity', ps: 'پېښه؛ تنظیم شوی عامه فعالیت', fa: 'رویداد؛ برنامهٔ عمومی سازمان‌یافته', ar: 'فعالية؛ نشاط عام منظّم', uk: 'подія; організований публічний захід' },
  'A2-U01-V01-X04': { en: 'to tidy up', ps: 'مرتبول', fa: 'مرتب کردن', ar: 'يرتّب', uk: 'прибирати; упорядковувати' },
  'A2-U01-V01-X05': { en: 'to visit; attend', ps: 'لیدنه کول؛ ګډون کول', fa: 'دیدن؛ شرکت کردن', ar: 'يزور؛ يحضر', uk: 'відвідувати' },
  'A2-U01-V01-X06': { en: 'to take care of; complete', ps: 'ترسره کول؛ بشپړول', fa: 'رسیدگی کردن؛ انجام دادن', ar: 'ينجز؛ يهتمّ بـ', uk: 'виконувати; залагоджувати' },
  'A2-U01-V01-X07': { en: 'to cook', ps: 'پخول', fa: 'آشپزی کردن', ar: 'يطبخ', uk: 'готувати' },
  'A2-U01-V01-X08': { en: 'to clean', ps: 'پاکول', fa: 'تمیز کردن', ar: 'ينظّف', uk: 'чистити; прибирати' },
  'A2-U01-V01-X09': { en: 'to go for a walk', ps: 'چکر ته تلل', fa: 'پیاده‌روی کردن', ar: 'يذهب في نزهة', uk: 'ходити на прогулянку' },
  'A2-U01-V01-X10': { en: 'to meet; meet up', ps: 'سره لیدل', fa: 'ملاقات کردن', ar: 'يلتقي', uk: 'зустрічатися' },
  'A2-U01-V01-X11': { en: 'yesterday', ps: 'پرون', fa: 'دیروز', ar: 'أمس', uk: 'учора' },
  'A2-U01-V01-X12': { en: 'last weekend', ps: 'تېر د اونۍ پای', fa: 'آخر هفتهٔ گذشته', ar: 'عطلة نهاية الأسبوع الماضية', uk: 'минулих вихідних' },
  'A2-U01-V01-X13': { en: 'activity; outing', ps: 'فعالیت؛ چکر', fa: 'فعالیت؛ گردش', ar: 'نشاط؛ نزهة', uk: 'заняття; прогулянка' },
  'A2-U01-V01-X14': { en: 'cosy; relaxed and comfortable', ps: 'ارام او هوسا', fa: 'دنج؛ آرام و راحت', ar: 'مريح ودافئ', uk: 'затишний; невимушений' },
  'A2-U01-V01-X15': { en: 'to be out and about; be on the way', ps: 'بهر په کارونو بوخت اوسېدل؛ په لاره کې اوسېدل', fa: 'بیرون و در رفت‌وآمد بودن', ar: 'يكون في الخارج أو في الطريق', uk: 'бути в дорозі; бути десь у справах' },
  'A2-U01-V02-X01': { en: 'experience; memorable event', ps: 'تجربه؛ د یاد وړ پېښه', fa: 'تجربه؛ رویداد به‌یادماندنی', ar: 'تجربة؛ حدث لا يُنسى', uk: 'враження; пам’ятна подія' },
  'A2-U01-V02-X02': { en: 'memory; recollection', ps: 'خاطره؛ یاد', fa: 'خاطره؛ یاد', ar: 'ذكرى', uk: 'спогад' },
  'A2-U01-V02-X03': { en: 'birthday', ps: 'کلیزه', fa: 'تولد', ar: 'عيد ميلاد', uk: 'день народження' },
  'A2-U01-V02-X04': { en: 'exam; examination', ps: 'ازموینه', fa: 'امتحان', ar: 'امتحان', uk: 'іспит' },
  'A2-U01-V02-X05': { en: 'to pass an exam or test', ps: 'په ازموینه کې بریالی کېدل', fa: 'در امتحان قبول شدن', ar: 'ينجح في امتحان', uk: 'скласти іспит' },
  'A2-U01-V02-X06': { en: 'to begin; start', ps: 'پیلول', fa: 'آغاز کردن', ar: 'يبدأ', uk: 'починати' },
  'A2-U01-V02-X07': { en: 'to celebrate', ps: 'لمانځل', fa: 'جشن گرفتن', ar: 'يحتفل', uk: 'святкувати' },
  'A2-U01-V02-X08': { en: 'to meet for the first time; get to know', ps: 'د لومړي ځل لپاره پېژندل', fa: 'آشنا شدن', ar: 'يتعرّف إلى', uk: 'познайомитися' },
  'A2-U01-V02-X09': { en: 'to move house', ps: 'کډه کول', fa: 'اسباب‌کشی کردن', ar: 'ينتقل إلى منزل آخر', uk: 'переїжджати' },
  'A2-U01-V02-X10': { en: 'to happen', ps: 'پېښېدل', fa: 'اتفاق افتادن', ar: 'يحدث', uk: 'траплятися' },
  'A2-U01-V02-X11': { en: 'a year ago', ps: 'یو کال مخکې', fa: 'یک سال پیش', ar: 'قبل سنة', uk: 'рік тому' },
  'A2-U01-V02-X12': { en: 'for the first time', ps: 'د لومړي ځل لپاره', fa: 'برای نخستین بار', ar: 'للمرة الأولى', uk: 'уперше' },
  'A2-U01-V02-X13': { en: 'graduation; qualification; completion', ps: 'فراغت؛ وړتیا؛ بشپړونه', fa: 'فارغ‌التحصیلی؛ مدرک؛ پایان', ar: 'تخرّج؛ مؤهل؛ إتمام', uk: 'закінчення навчання; кваліфікація; завершення' },
  'A2-U01-V02-X14': { en: 'stage or period of life', ps: 'د ژوند پړاو', fa: 'مرحله‌ای از زندگی', ar: 'مرحلة من الحياة', uk: 'етап життя' },
  'A2-U01-V02-X15': { en: 'formative; strongly influential', ps: 'اغېزناک؛ شخصیت جوړوونکی', fa: 'شکل‌دهنده؛ بسیار تأثیرگذار', ar: 'مؤثّر في التكوين', uk: 'формувальний; дуже впливовий' },
  'A2-U01-V03-X01': { en: 'joy; happiness', ps: 'خوښي', fa: 'شادی', ar: 'فرح؛ سعادة', uk: 'радість' },
  'A2-U01-V03-X02': { en: 'surprise', ps: 'حیرانتیا؛ ناڅاپي ډالۍ', fa: 'غافلگیری', ar: 'مفاجأة', uk: 'сюрприз' },
  'A2-U01-V03-X03': { en: 'fun', ps: 'تفریح؛ خوند', fa: 'تفریح؛ لذت', ar: 'متعة', uk: 'веселощі' },
  'A2-U01-V03-X04': { en: 'excited; nervous', ps: 'هېجاني؛ وارخطا', fa: 'هیجان‌زده؛ مضطرب', ar: 'متحمّس؛ متوتر', uk: 'схвильований; нервовий' },
  'A2-U01-V03-X05': { en: 'disappointed', ps: 'ناهیلی', fa: 'ناامید', ar: 'خائب الأمل', uk: 'розчарований' },
  'A2-U01-V03-X06': { en: 'glad', ps: 'خوښ', fa: 'خوشحال', ar: 'مسرور', uk: 'радий' },
  'A2-U01-V03-X07': { en: 'happy', ps: 'خوشحاله', fa: 'خوشحال', ar: 'سعيد', uk: 'щасливий' },
  'A2-U01-V03-X08': { en: 'boring', ps: 'ستړی کوونکی', fa: 'خسته‌کننده', ar: 'مملّ', uk: 'нудний' },
  'A2-U01-V03-X09': { en: 'terrible; awful', ps: 'ډېر بد؛ وحشتناک', fa: 'وحشتناک؛ خیلی بد', ar: 'فظيع؛ سيئ جدًا', uk: 'жахливий' },
  'A2-U01-V03-X10': { en: 'exciting; interesting and suspenseful', ps: 'په زړه پورې؛ هیجاني', fa: 'هیجان‌انگیز؛ جذاب', ar: 'مثير؛ مشوّق', uk: 'захопливий; цікавий' },
  'A2-U01-V03-X11': { en: 'to be pleased or happy about', ps: 'په څه خوشحالېدل', fa: 'از چیزی خوشحال شدن', ar: 'يفرح بـ', uk: 'радіти чомусь' },
  'A2-U01-V03-X12': { en: 'fortunately; luckily', ps: 'له نېکه مرغه', fa: 'خوشبختانه', ar: 'لحسن الحظ', uk: 'на щастя' },
  'A2-U01-V03-X13': { en: 'relieved', ps: 'له اندېښنې خلاص', fa: 'آسوده‌خاطر', ar: 'مرتاح', uk: 'полегшений' },
  'A2-U01-V03-X14': { en: 'surprised', ps: 'حیران', fa: 'متعجب', ar: 'متفاجئ', uk: 'здивований' },
  'A2-U01-V03-X15': { en: 'impressive', ps: 'اغېزناک', fa: 'تأثیرگذار', ar: 'مثير للإعجاب', uk: 'вражаючий' },
  'A2-U01-V04-X01': { en: 'first; first of all', ps: 'لومړی', fa: 'نخست', ar: 'أولًا', uk: 'спочатку' },
  'A2-U01-V04-X02': { en: 'after that', ps: 'له هغه وروسته', fa: 'پس از آن', ar: 'بعد ذلك', uk: 'після цього' },
  'A2-U01-V04-X03': { en: 'later', ps: 'وروسته', fa: 'بعدتر', ar: 'لاحقًا', uk: 'пізніше' },
  'A2-U01-V04-X04': { en: 'at the end; finally in a sequence', ps: 'په پای کې', fa: 'در پایان', ar: 'في النهاية', uk: 'наприкінці' },
  'A2-U01-V04-X05': { en: 'suddenly', ps: 'ناڅاپه', fa: 'ناگهان', ar: 'فجأة', uk: 'раптом' },
  'A2-U01-V04-X06': { en: 'already', ps: 'له مخکې؛ لا', fa: 'قبلاً', ar: 'بالفعل', uk: 'вже' },
  'A2-U01-V04-X07': { en: 'not yet', ps: 'لا نه', fa: 'هنوز نه', ar: 'ليس بعد', uk: 'ще ні' },
  'A2-U01-V04-X08': { en: 'just; just now', ps: 'همدا اوس', fa: 'همین الان', ar: 'للتو', uk: 'щойно' },
  'A2-U01-V04-X09': { en: 'at that time; back then', ps: 'هغه وخت', fa: 'آن زمان', ar: 'آنذاك', uk: 'тоді' },
  'A2-U01-V04-X10': { en: 'formerly; in the past', ps: 'پخوا', fa: 'قبلاً؛ در گذشته', ar: 'سابقًا', uk: 'раніше' },
  'A2-U01-V04-X11': { en: 'once; one time', ps: 'یو ځل', fa: 'یک بار', ar: 'مرة واحدة', uk: 'одного разу' },
  'A2-U01-V04-X12': { en: 'several times', ps: 'څو ځله', fa: 'چند بار', ar: 'عدة مرات', uk: 'кілька разів' },
  'A2-U01-V04-X13': { en: 'afterwards; subsequently', ps: 'وروسته', fa: 'سپس', ar: 'بعد ذلك', uk: 'потім' },
  'A2-U01-V04-X14': { en: 'finally; eventually', ps: 'بالاخره', fa: 'سرانجام', ar: 'أخيرًا', uk: 'зрештою' },
  'A2-U01-V04-X15': { en: 'meanwhile; by now', ps: 'په دې ترڅ کې؛ تر اوسه', fa: 'در این میان؛ تا حالا', ar: 'في هذه الأثناء؛ حتى الآن', uk: 'тим часом; на цей момент' },
};
