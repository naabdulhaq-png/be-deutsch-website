import { grammarEnglishGuides, type EnglishGuide } from './grammar-english-guides.ts';

export const grammarLanguages = {
  en: { label: 'English', nativeLabel: 'English', direction: 'ltr' },
  uk: { label: 'Ukrainian', nativeLabel: 'Українська', direction: 'ltr' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', direction: 'rtl' },
  fa: { label: 'Persian/Dari', nativeLabel: 'فارسی / دری', direction: 'rtl' },
  ps: { label: 'Pashto', nativeLabel: 'پښتو', direction: 'rtl' },
} as const;

export type GrammarLanguage = keyof typeof grammarLanguages;
export type LocalizedText = Record<GrammarLanguage, string>;
export type Exercise = {
  id: string;
  kind: 'choice' | 'fill' | 'order';
  prompt: string;
  options?: string[];
  answer: string;
  accepted?: string[];
  tokens?: string[];
};
export type GrammarLesson = {
  id: string;
  number: number;
  unit: number;
  title: string;
  shortTitle: string;
  objective: LocalizedText;
  explanation: LocalizedText;
  feedback: LocalizedText;
  examples: { de: string; meaning: LocalizedText; highlight?: string }[];
  englishGuide?: EnglishGuide;
  guided: Exercise[];
  independent: Exercise[];
};

const t = (en: string, uk: string, ar: string, fa: string, ps: string): LocalizedText => ({ en, uk, ar, fa, ps });
const choice = (id: string, prompt: string, options: string[], answer: string): Exercise => ({ id, kind: 'choice', prompt, options, answer });
const fill = (id: string, prompt: string, answer: string, accepted: string[] = [answer]): Exercise => ({ id, kind: 'fill', prompt, answer, accepted });
const order = (id: string, prompt: string, answer: string, tokens: string[]): Exercise => ({ id, kind: 'order', prompt, answer, tokens });

export const grammarUnits = [
  { number: 1, title: 'Your first German sentences', description: 'Pronouns, sein, haben and regular present-tense verbs.' },
  { number: 2, title: 'Statements and questions', description: 'Word order, W-questions, yes/no questions and common irregular verbs.' },
  { number: 3, title: 'People and things', description: 'Gender, articles, plurals, possessives and negation.' },
  { number: 4, title: 'Talking about objects', description: 'The accusative case, pronouns and useful accusative prepositions.' },
  { number: 5, title: 'Plans and everyday actions', description: 'Modal verbs, separable verbs and practical imperatives.' },
  { number: 6, title: 'Time, place and people', description: 'Basic dative structures, prepositions and time expressions.' },
  { number: 7, title: 'Connecting and looking back', description: 'Connectors, sequence words and the basic conversational Perfekt.' },
] as const;

export const grammarLessons: GrammarLesson[] = [
  {
    id: 'G01', number: 1, unit: 1, title: 'Personal pronouns', shortTitle: 'ich, du, er, sie …',
    englishGuide: grammarEnglishGuides.G01,
    objective: t('Identify and choose German subject pronouns for people and things.','Розпізнавати й добирати німецькі особові займенники для людей і предметів.','تمييز ضمائر الفاعل الألمانية واختيارها للأشخاص والأشياء.','تشخیص و انتخاب ضمیرهای فاعلی آلمانی برای اشخاص و چیزها.','د خلکو او شیانو لپاره د آلماني فاعلي ضمیرونو پېژندل او ټاکل.'),
    explanation: t('Use ich for “I”; du for informal “you” to one person; er, sie and es for “he”, “she” and “it”; wir for “we”; ihr for informal “you” to several people; and lowercase sie for “they”. Capitalized Sie is polite “you” for either one person or several people.','Вживайте ich для «я», du для однієї знайомої людини, а Sie — як ввічливе «Ви». Er замінює іменник чоловічого роду, sie — жіночого, es — середнього; wir, ihr та sie/Sie — форми множини.','استخدم ich بمعنى «أنا»، وdu لشخص واحد تعرفه، وSie للمخاطبة الرسمية. يحل er محل الاسم المذكر، وsie محل المؤنث، وes محل المحايد؛ أما wir وihr وsie/Sie فهي صيغ جمع.','ich برای «من»، du برای یک فرد آشنا و Sie برای خطاب محترمانه است. er جای اسم مذکر، sie جای اسم مؤنث و es جای اسم خنثی می‌آید؛ wir وihr وsie/Sie شکل‌های جمع‌اند.','ich د «زه» لپاره، du د یوه اشنا کس لپاره او Sie د درناوي «تاسو» لپاره کارېږي. er د مذکر نوم، sie د مؤنث نوم او es د خنثی نوم ځای نیسي؛ wir، ihr او sie/Sie جمع دي.'),
    feedback: t('The pronoun must match the person or the grammatical gender of the noun.','Займенник має відповідати особі або граматичному роду іменника.','يجب أن يطابق الضمير الشخص أو الجنس النحوي للاسم.','ضمیر باید با شخص یا جنس دستوری اسم هماهنگ باشد.','ضمیر باید له شخص یا د نوم له ګرامري جنس سره برابر وي.'),
    examples: [
      { de: 'Das ist Samira. Sie kommt aus Syrien.', meaning: t('This is Samira. She comes from Syria.','Це Саміра. Вона із Сирії.','هذه سميرة. هي من سوريا.','این سمیرا است. او از سوریه می‌آید.','دا سمیرا ده. هغه له سوریې راځي.') },
      { de: 'Das Kind lernt Deutsch. Es ist neu hier.', meaning: t('The child learns German. It is new here.','Дитина вивчає німецьку. Вона тут новенька.','الطفل يتعلم الألمانية. إنه جديد هنا.','کودک آلمانی یاد می‌گیرد. او اینجا تازه‌وارد است.','ماشوم آلماني زده کوي. هغه دلته نوی دی.') },
    ],
    guided: [choice('G01-1','Mariam ist neu. ___ kommt aus Kabul.',['Er','Sie','Es'],'Sie'),choice('G01-2','Tom und ich lernen Deutsch. ___ lernen zusammen.',['Wir','Ihr','Sie'],'Wir')],
    independent: [fill('G01-3','Herr Klein, kommen ___ aus Berlin?','Sie'),order('G01-4','Build the sentence.','Ihr lernt heute Deutsch.',['Deutsch.','heute','Ihr','lernt'])],
  },
  {
    id: 'G02', number: 2, unit: 1, title: 'The verb sein', shortTitle: 'bin, bist, ist',
    englishGuide: grammarEnglishGuides.G02,
    objective: t('Use sein to say who someone is, where they are from and how they are.','Вживати sein, щоб сказати, хто хтось, звідки він і як почувається.','استخدام sein للتعريف بالشخص وذكر أصله أو حاله.','استفاده از sein برای گفتن هویت، مبدأ و حال شخص.','د sein په وسیله د چا هویت، ځای او حالت ویل.'),
    explanation: t('Sein is irregular: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Learn these forms as a complete set.','Sein — неправильне дієслово: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Вивчіть ці форми разом.','sein فعل شاذ: ich bin، du bist، er/sie/es ist، wir sind، ihr seid، sie/Sie sind. تعلّم هذه الصيغ كمجموعة واحدة.','sein بی‌قاعده است: ich bin، du bist، er/sie/es ist، wir sind، ihr seid، sie/Sie sind. این شکل‌ها را با هم یاد بگیرید.','sein بې‌قاعدې فعل دی: ich bin، du bist، er/sie/es ist، wir sind، ihr seid، sie/Sie sind. دا بڼې یوځای زده کړئ.'),
    feedback: t('Choose the sein form that belongs to the subject.','Форму sein добираємо відповідно до підмета.','اختر صيغة sein التي تناسب الفاعل.','شکل sein را مطابق فاعل انتخاب کنید.','د sein هغه بڼه وټاکئ چې له فاعل سره برابره وي.'),
    examples: [
      { de: 'Ich bin müde, aber wir sind zu Hause.', meaning: t('I am tired, but we are at home.','Я втомлений/втомлена, але ми вдома.','أنا متعب، لكننا في المنزل.','من خسته‌ام، اما ما در خانه هستیم.','زه ستړی یم، خو موږ په کور کې یو.') },
      { de: 'Sind Sie Frau Rahimi?', meaning: t('Are you Ms Rahimi?','Ви пані Рахімі?','هل أنتِ السيدة رحيمي؟','آیا شما خانم رحیمی هستید؟','آیا تاسو مېرمن رحیمي یاست؟') },
    ],
    guided: [choice('G02-1','Ich ___ neu hier.',['bin','bist','ist'],'bin'),choice('G02-2','Ihr ___ heute pünktlich.',['sind','seid','ist'],'seid')],
    independent: [fill('G02-3','Wir ___ aus der Ukraine.','sind'),order('G02-4','Build the sentence.','Du bist sehr freundlich.',['freundlich.','bist','Du','sehr'])],
  },
  {
    id: 'G03', number: 3, unit: 1, title: 'The verb haben', shortTitle: 'habe, hast, hat',
    englishGuide: grammarEnglishGuides.G03,
    objective: t('Use haben for possession, family, appointments and everyday needs.','Вживати haben для володіння, сім’ї, зустрічей і повсякденних потреб.','استخدام haben للملكية والأسرة والمواعيد والاحتياجات اليومية.','استفاده از haben برای مالکیت، خانواده، قرارها و نیازهای روزمره.','د ملکیت، کورنۍ، وختونو او ورځنیو اړتیاوو لپاره haben کارول.'),
    explanation: t('Haben changes to habe, hast, hat, haben, habt, haben. The du and er/sie/es forms lose the b.','Haben має форми habe, hast, hat, haben, habt, haben. У формах du та er/sie/es літера b зникає.','يتغير haben إلى habe وhast وhat وhaben وhabt وhaben. تسقط b في صيغتي du وer/sie/es.','haben به habe، hast، hat، haben، habt، haben صرف می‌شود. در شکل‌های du وer/sie/es حرف b حذف می‌شود.','haben داسې صرفېږي: habe، hast، hat، haben، habt، haben. د du او er/sie/es په بڼو کې b لرې کېږي.'),
    feedback: t('With du use hast; with er, sie or es use hat.','З du вживайте hast; з er, sie або es — hat.','مع du استخدم hast، ومع er أو sie أو es استخدم hat.','با du از hast و با er، sie یا es از hat استفاده کنید.','له du سره hast او له er، sie یا es سره hat کارېږي.'),
    examples: [
      { de: 'Ich habe einen Termin.', meaning: t('I have an appointment.','У мене є зустріч.','لديّ موعد.','من وقت ملاقات دارم.','زه د ملاقات وخت لرم.') },
      { de: 'Habt ihr heute Zeit?', meaning: t('Do you all have time today?','У вас сьогодні є час?','هل لديكم وقت اليوم؟','آیا شما امروز وقت دارید؟','آیا تاسو نن وخت لرئ؟') },
    ],
    guided: [choice('G03-1','Mina ___ zwei Kinder.',['habe','hat','habt'],'hat'),choice('G03-2','Du ___ eine Frage.',['hast','hat','haben'],'hast')],
    independent: [fill('G03-3','Wir ___ heute Deutschkurs.','haben'),order('G03-4','Build the question.','Habt ihr morgen Zeit?',['morgen','ihr','Zeit?','Habt'])],
  },
  {
    id: 'G04', number: 4, unit: 1, title: 'Regular verbs in the present', shortTitle: 'lernen, wohnen, machen',
    englishGuide: grammarEnglishGuides.G04,
    objective: t('Conjugate regular verbs in the present tense.','Відмінювати правильні дієслова в теперішньому часі.','تصريف الأفعال المنتظمة في زمن الحاضر.','صرف فعل‌های باقاعده در زمان حال.','په اوسني زمان کې د باقاعده فعلونو صرف کول.'),
    explanation: t('Remove -en and add -e, -st, -t, -en, -t, -en. For arbeiten or reden, add an extra e before endings that would be hard to pronounce: du arbeitest.','Відкиньте -en і додайте -e, -st, -t, -en, -t, -en. У arbeiten або reden перед важкою для вимови кінцівкою з’являється додаткове e: du arbeitest.','احذف -en وأضف -e و-st و-t و-en و-t و-en. مع arbeiten أو reden نضيف e لتسهيل النطق: du arbeitest.','-en را حذف و -e، -st، -t، -en، -t، -en را اضافه کنید. در arbeiten یا reden برای تلفظ آسان یک e اضافه می‌شود: du arbeitest.','-en لرې او -e، -st، -t، -en، -t، -en ورزیات کړئ. په arbeiten یا reden کې د اسانه تلفظ لپاره e زیاتېږي: du arbeitest.'),
    feedback: t('The verb ending shows the subject: ich -e, du -st, er/sie/es -t.','Закінчення дієслова показує підмет: ich -e, du -st, er/sie/es -t.','نهاية الفعل تدل على الفاعل: ich -e وdu -st وer/sie/es -t.','پسوند فعل فاعل را نشان می‌دهد: ich -e، du -st، er/sie/es -t.','د فعل پای فاعل ښيي: ich -e، du -st، er/sie/es -t.'),
    examples: [
      { de: 'Ich wohne in Bonn. Er arbeitet in Köln.', meaning: t('I live in Bonn. He works in Cologne.','Я живу в Бонні. Він працює в Кельні.','أنا أسكن في بون. هو يعمل في كولونيا.','من در بن زندگی می‌کنم. او در کلن کار می‌کند.','زه په بن کې اوسېږم. هغه په کولن کې کار کوي.') },
      { de: 'Wir lernen jeden Abend.', meaning: t('We study every evening.','Ми вчимося щовечора.','نحن نتعلم كل مساء.','ما هر شب درس می‌خوانیم.','موږ هر ماښام زده کړه کوو.') },
    ],
    guided: [choice('G04-1','Du ___ in Hamburg. (wohnen)',['wohne','wohnst','wohnt'],'wohnst'),choice('G04-2','Frau Özdemir ___ Deutsch. (lernen)',['lernt','lernen','lernst'],'lernt')],
    independent: [fill('G04-3','Ich ___ heute lange. (arbeiten)','arbeite'),order('G04-4','Build the sentence.','Wir machen heute Sport.',['Sport.','heute','Wir','machen'])],
  },
  {
    id: 'G05', number: 5, unit: 2, title: 'Statements: the verb in position 2', shortTitle: 'Heute lerne ich …',
    englishGuide: grammarEnglishGuides.G05,
    objective: t('Build German statements with the conjugated verb in the second position.','Будувати німецькі розповідні речення з відмінюваним дієсловом на другій позиції.','بناء الجملة الخبرية الألمانية بوضع الفعل المصرف في الموقع الثاني.','ساخت جمله خبری آلمانی با فعل صرف‌شده در جایگاه دوم.','آلماني خبري جمله د صرف شوي فعل په دویم ځای کې جوړول.'),
    explanation: t('A statement has one first element, then the conjugated verb. The subject can come first (Ich lerne heute) or after a time phrase (Heute lerne ich).','У розповідному реченні спочатку стоїть один елемент, а потім відмінюване дієслово. Підмет може бути першим (Ich lerne heute) або стояти після обставини часу (Heute lerne ich).','في الجملة الخبرية يأتي عنصر واحد أولاً ثم الفعل المصرف. يمكن أن يبدأ الفاعل (Ich lerne heute) أو يأتي بعد عبارة زمنية (Heute lerne ich).','در جمله خبری ابتدا یک بخش و سپس فعل صرف‌شده می‌آید. فاعل می‌تواند اول باشد (Ich lerne heute) یا پس از عبارت زمانی بیاید (Heute lerne ich).','په خبري جمله کې لومړی یو توکی او بیا صرف شوی فعل راځي. فاعل لومړی راتلای شي (Ich lerne heute) یا د وخت له عبارت وروسته (Heute lerne ich).'),
    feedback: t('Count sentence elements, not words: the conjugated verb is the second element.','Рахуйте члени речення, а не слова: відмінюване дієслово — другий елемент.','عُدّ عناصر الجملة لا الكلمات: الفعل المصرف هو العنصر الثاني.','بخش‌های جمله را بشمارید، نه واژه‌ها را: فعل صرف‌شده بخش دوم است.','د جملې برخې وشمېرئ، نه کلمې: صرف شوی فعل دویمه برخه ده.'),
    examples: [
      { de: 'Am Montag arbeite ich zu Hause.', meaning: t('On Monday I work at home.','У понеділок я працюю вдома.','يوم الاثنين أعمل في المنزل.','دوشنبه در خانه کار می‌کنم.','د دوشنبې په ورځ په کور کې کار کوم.') },
      { de: 'Meine Schwester wohnt in Leipzig.', meaning: t('My sister lives in Leipzig.','Моя сестра живе в Лейпцигу.','أختي تسكن في لايبزيغ.','خواهرم در لایپزیگ زندگی می‌کند.','زما خور په لایپزیګ کې اوسېږي.') },
    ],
    guided: [choice('G05-1','Choose the correct statement.',['Heute ich lerne Deutsch.','Heute lerne ich Deutsch.','Heute Deutsch lerne ich.'],'Heute lerne ich Deutsch.'),choice('G05-2','Morgen ___ wir frei.',['haben','wir haben','frei haben'],'haben')],
    independent: [fill('G05-3','Am Abend ___ er Fußball. (spielen)','spielt'),order('G05-4','Build the sentence.','In Berlin wohnt meine Familie.',['meine','In Berlin','wohnt','Familie.'])],
  },
  {
    id: 'G06', number: 6, unit: 2, title: 'W-questions', shortTitle: 'wer, wie, wo, wann',
    englishGuide: grammarEnglishGuides.G06,
    objective: t('Ask for people, places, time and information with W-question words.','Ставити запитання про людей, місця, час та інформацію за допомогою W-слів.','طرح أسئلة عن الأشخاص والأماكن والوقت والمعلومات بأدوات السؤال.','پرسیدن درباره اشخاص، مکان، زمان و اطلاعات با واژه‌های پرسشی.','د پوښتنیزو کلمو په وسیله د خلکو، ځای، وخت او معلوماتو پوښتنه کول.'),
    explanation: t('Put the W-word first, the conjugated verb second and usually the subject third: Wo wohnst du? Use wer, wie, wo, woher, was, wann and wie viel for different information.','Поставте W-слово першим, відмінюване дієслово другим, а підмет зазвичай третім: Wo wohnst du? Для різної інформації вживайте wer, wie, wo, woher, was, wann і wie viel.','ضع أداة السؤال أولاً، والفعل المصرف ثانياً، والفاعل غالباً ثالثاً: Wo wohnst du? استخدم wer وwie وwo وwoher وwas وwann وwie viel حسب المعلومة.','واژه پرسشی را اول، فعل صرف‌شده را دوم و معمولاً فاعل را سوم بگذارید: Wo wohnst du? برای اطلاعات مختلف از wer، wie، wo، woher، was، wann وwie viel استفاده کنید.','پوښتنیزه کلمه لومړۍ، صرف شوی فعل دویم او عموماً فاعل درېیم راځي: Wo wohnst du? د بېلابېلو معلوماتو لپاره wer، wie، wo، woher، was، wann او wie viel وکاروئ.'),
    feedback: t('The question word says what information you need; the verb follows it directly.','Питальне слово показує, яка інформація потрібна; дієслово стоїть одразу після нього.','أداة السؤال تحدد المعلومة المطلوبة، ويأتي الفعل بعدها مباشرة.','واژه پرسشی نوع اطلاعات را مشخص می‌کند و فعل بلافاصله پس از آن می‌آید.','پوښتنیزه کلمه اړین معلومات ښيي او فعل سمدستي وروسته راځي.'),
    examples: [
      { de: 'Woher kommen Sie?', meaning: t('Where do you come from?','Звідки Ви?','من أين حضرتك؟','شما اهل کجا هستید؟','تاسو له کوم ځایه یاست؟') },
      { de: 'Wann beginnt der Kurs?', meaning: t('When does the course begin?','Коли починається курс?','متى تبدأ الدورة؟','کلاس چه زمانی شروع می‌شود؟','کورس کله پیلېږي؟') },
    ],
    guided: [choice('G06-1','___ heißt du? – Ich heiße Omar.',['Wo','Wie','Wann'],'Wie'),choice('G06-2','___ kostet das? – Drei Euro.',['Wie viel','Wer','Woher'],'Wie viel')],
    independent: [fill('G06-3','___ wohnst du? – In Essen.','Wo'),order('G06-4','Build the question.','Wann beginnt der Film?',['der Film?','beginnt','Wann'])],
  },
  {
    id: 'G07', number: 7, unit: 2, title: 'Yes/no questions', shortTitle: 'Kommst du …?',
    englishGuide: grammarEnglishGuides.G07,
    objective: t('Ask and answer questions that expect ja or nein.','Ставити запитання, що передбачають відповідь ja або nein, і відповідати на них.','طرح أسئلة جوابها ja أو nein والإجابة عنها.','پرسیدن و پاسخ دادن به سؤال‌هایی که جوابشان ja یا nein است.','هغه پوښتنې کول او ځوابول چې ja یا nein غواړي.'),
    explanation: t('In a yes/no question, the conjugated verb comes first and the subject second: Arbeitest du heute? Answer with ja/nein and a short sentence when useful.','У запитанні так/ні відмінюване дієслово стоїть першим, а підмет другим: Arbeitest du heute? Відповідайте ja/nein і за потреби коротким реченням.','في سؤال نعم/لا يأتي الفعل المصرف أولاً والفاعل ثانياً: Arbeitest du heute? أجب بـ ja/nein وأضف جملة قصيرة عند الحاجة.','در سؤال بله/خیر فعل صرف‌شده اول و فاعل دوم می‌آید: Arbeitest du heute? با ja/nein و در صورت نیاز یک جمله کوتاه پاسخ دهید.','په هو/نه پوښتنه کې صرف شوی فعل لومړی او فاعل دویم راځي: Arbeitest du heute? په ja/nein او که اړتیا وي په لنډه جمله ځواب ورکړئ.'),
    feedback: t('A yes/no question starts with the conjugated verb; there is no W-word.','Запитання так/ні починається з відмінюваного дієслова; W-слова немає.','يبدأ سؤال نعم/لا بالفعل المصرف ولا توجد أداة سؤال.','سؤال بله/خیر با فعل صرف‌شده آغاز می‌شود و واژه پرسشی ندارد.','هو/نه پوښتنه په صرف شوي فعل پیلېږي او پوښتنیزه کلمه نه لري.'),
    examples: [
      { de: 'Hast du Zeit? – Ja, ich habe Zeit.', meaning: t('Do you have time? – Yes, I have time.','У тебе є час? — Так, є.','هل لديك وقت؟ – نعم، لدي وقت.','وقت داری؟ – بله، وقت دارم.','وخت لرې؟ – هو، وخت لرم.') },
      { de: 'Sind Sie neu hier? – Nein, ich wohne hier.', meaning: t('Are you new here? – No, I live here.','Ви тут новенький/новенька? — Ні, я тут живу.','هل أنت جديد هنا؟ – لا، أنا أسكن هنا.','اینجا تازه‌وارد هستید؟ – نه، من اینجا زندگی می‌کنم.','تاسو دلته نوي یاست؟ – نه، زه دلته اوسېږم.') },
    ],
    guided: [choice('G07-1','Choose the yes/no question.',['Wo arbeitest du?','Arbeitest du heute?','Du arbeitest heute.'],'Arbeitest du heute?'),choice('G07-2','___ ihr aus Berlin?',['Kommt','Ihr kommt','Woher kommt'],'Kommt')],
    independent: [fill('G07-3','___ du Deutsch? (lernen)','Lernst'),order('G07-4','Build the question.','Hat Maria heute Zeit?',['heute','Hat','Zeit?','Maria'])],
  },
  {
    id: 'G08', number: 8, unit: 2, title: 'Common irregular present verbs', shortTitle: 'fährt, liest, spricht',
    englishGuide: grammarEnglishGuides.G08,
    objective: t('Use common stem-changing verbs with du and er/sie/es.','Вживати поширені дієслова зі зміною кореневої голосної з du та er/sie/es.','استخدام الأفعال الشائعة التي تتغير حركتها مع du وer/sie/es.','استفاده از فعل‌های رایج با تغییر بن در du وer/sie/es.','له du او er/sie/es سره د عامو بن بدلېدونکو فعلونو کارول.'),
    explanation: t('Some common verbs change their stem vowel with du and er/sie/es. Learn the complete forms: du fährst, du sprichst, du liest, du isst and du nimmst. Forms such as liest and isst are learned as whole forms, not made by mechanically adding -st.','Деякі дієслова змінюють кореневу голосну лише з du та er/sie/es: fahren → du fährst, lesen → er liest, sprechen → sie spricht. Закінчення залишаються знайомими.','تتغير حركة جذر بعض الأفعال فقط مع du وer/sie/es: fahren → du fährst، lesen → er liest، sprechen → sie spricht. النهايات تبقى مألوفة.','بعضی فعل‌ها فقط با du وer/sie/es واکه بن را تغییر می‌دهند: fahren → du fährst، lesen → er liest، sprechen → sie spricht. پسوندها همان‌اند.','ځینې فعلونه یوازې له du او er/sie/es سره د بن واک بدلوي: fahren → du fährst، lesen → er liest، sprechen → sie spricht. پایونه هماغه پاتې کېږي.'),
    feedback: t('The vowel change happens with du and er/sie/es, not with ich, wir or Sie.','Зміна голосної відбувається з du та er/sie/es, але не з ich, wir чи Sie.','يتغير حرف العلة مع du وer/sie/es فقط، وليس مع ich أو wir أو Sie.','تغییر واکه با du وer/sie/es رخ می‌دهد، نه با ich، wir یا Sie.','د واک بدلون له du او er/sie/es سره کېږي، نه له ich، wir یا Sie سره.'),
    examples: [
      { de: 'Sie fährt mit dem Bus.', meaning: t('She travels by bus.','Вона їде автобусом.','هي تذهب بالحافلة.','او با اتوبوس می‌رود.','هغه په بس کې ځي.') },
      { de: 'Liest du die Nachricht?', meaning: t('Are you reading the message?','Ти читаєш повідомлення?','هل تقرأ الرسالة؟','پیام را می‌خوانی؟','ایا پیغام لولې؟') },
    ],
    guided: [choice('G08-1','Er ___ gut Deutsch. (sprechen)',['sprecht','spricht','spreche'],'spricht'),choice('G08-2','Du ___ nach Köln. (fahren)',['fährst','fahrst','fährt'],'fährst')],
    independent: [fill('G08-3','Mina ___ ein Buch. (lesen)','liest'),order('G08-4','Build the sentence.','Wir fahren heute mit dem Zug.',['mit dem Zug.','heute','Wir','fahren'])],
  },
  {
    id: 'G09', number: 9, unit: 3, title: 'Nouns, gender and articles', shortTitle: 'der, die, das',
    englishGuide: grammarEnglishGuides.G09,
    objective: t('Learn nouns together with their nominative article.','Вивчати іменники разом з їхнім артиклем у називному відмінку.','تعلم الأسماء مع أداة التعريف في حالة الرفع.','یادگیری اسم‌ها همراه با حرف تعریف در حالت فاعلی.','نومونه د فاعلي حالت له ارټیکل سره یوځای زده کول.'),
    explanation: t('German nouns have grammatical gender: der (masculine), die (feminine), das (neuter). The indefinite forms are ein, eine, ein. Always learn the article with the noun.','Німецькі іменники мають граматичний рід: der (чоловічий), die (жіночий), das (середній). Неозначені форми: ein, eine, ein. Завжди вчіть артикль разом з іменником.','للأسماء الألمانية جنس نحوي: der للمذكر وdie للمؤنث وdas للمحايد. أدوات التنكير هي ein وeine وein. تعلّم الأداة مع الاسم دائماً.','اسم‌های آلمانی جنس دستوری دارند: der مذکر، die مؤنث، das خنثی. شکل‌های نکره ein، eine، ein هستند. همیشه حرف تعریف را با اسم یاد بگیرید.','آلماني نومونه ګرامري جنس لري: der مذکر، die مؤنث او das خنثی. ناتعریف بڼې ein، eine، ein دي. ارټیکل تل له نوم سره زده کړئ.'),
    feedback: t('Gender belongs to the German noun; meaning alone does not always predict it.','Рід належить німецькому іменнику; не завжди його можна вгадати за значенням.','الجنس خاص بالاسم الألماني ولا يمكن توقعه دائماً من المعنى.','جنس به اسم آلمانی مربوط است و همیشه از معنا قابل پیش‌بینی نیست.','جنس د آلماني نوم ځانګړنه ده او تل له مانا نه اټکلېږي.'),
    examples: [
      { de: 'Der Tisch ist neu. Die Lampe ist alt.', meaning: t('The table is new. The lamp is old.','Стіл новий. Лампа стара.','الطاولة جديدة. المصباح قديم.','میز نو است. چراغ قدیمی است.','مېز نوی دی. څراغ زوړ دی.') },
      { de: 'Das Kind hat eine Frage.', meaning: t('The child has a question.','У дитини є запитання.','لدى الطفل سؤال.','کودک یک سؤال دارد.','ماشوم یوه پوښتنه لري.') },
    ],
    guided: [choice('G09-1','___ Wohnung ist klein.',['Der','Die','Das'],'Die'),choice('G09-2','Das ist ___ Buch.',['ein','eine','einen'],'ein')],
    independent: [fill('G09-3','Add the definite article: ___ Bus kommt um acht.','Der'),order('G09-4','Build the sentence.','Eine Frau wartet hier.',['wartet','Eine Frau','hier.'])],
  },
  {
    id: 'G10', number: 10, unit: 3, title: 'Noun plurals', shortTitle: 'die Bücher, die Frauen',
    englishGuide: grammarEnglishGuides.G10,
    objective: t('Recognize common German plural patterns and use the definite article die with plural nouns.','Розпізнавати поширені моделі множини та вживати die з іменниками у множині.','تمييز أنماط الجمع الشائعة واستخدام die مع أسماء الجمع.','شناخت الگوهای رایج جمع و استفاده از die با اسم‌های جمع.','د جمع عامې بڼې پېژندل او له جمع نومونو سره die کارول.'),
    explanation: t('German plurals can end in -e, -er, -(e)n, -s or have no ending; some add an umlaut. The definite plural article is always die. Learn singular and plural together.','Німецька множина може мати закінчення -e, -er, -(e)n, -s або не мати закінчення; іноді додається умлаут. Означений артикль множини завжди die. Вчіть однину й множину разом.','قد ينتهي جمع الألمانية بـ -e أو -er أو -(e)n أو -s أو بلا نهاية، وقد تضاف علامة أوملاوت. أداة الجمع المعرفة دائماً die. تعلّم المفرد والجمع معاً.','جمع آلمانی می‌تواند به -e، -er، -(e)n، -s ختم شود یا پسوند نداشته باشد؛ گاهی اوملاوت می‌گیرد. حرف تعریف جمع همیشه die است. مفرد و جمع را با هم یاد بگیرید.','د آلماني جمع پایونه -e، -er، -(e)n، -s یا هېڅ پای کېدای شي او کله اوملاوټ اخلي. د تعریف جمع ارټیکل تل die دی. مفرد او جمع یوځای زده کړئ.'),
    feedback: t('There is no single plural ending. Learn the plural form, and use die when a nominative plural noun needs the definite article.','Єдиного закінчення множини немає; вживайте вивчену форму, а в називному множини завжди die.','لا توجد نهاية واحدة للجمع؛ استخدم صيغة الجمع المحفوظة وdie دائماً في جمع الرفع.','یک پسوند واحد برای جمع وجود ندارد؛ شکل جمع آموخته‌شده و در حالت فاعلی همیشه die را به کار ببرید.','د جمع یو واحد پای نشته؛ زده شوې جمع بڼه و په فاعلي جمع کې تل die وکاروئ.'),
    examples: [
      { de: 'Das Buch – die Bücher', meaning: t('The book – the books','Книга — книги','الكتاب – الكتب','کتاب – کتاب‌ها','کتاب – کتابونه') },
      { de: 'Eine Frau – drei Frauen', meaning: t('One woman – three women','Одна жінка — три жінки','امرأة واحدة – ثلاث نساء','یک زن – سه زن','یوه ښځه – درې ښځې') },
    ],
    guided: [choice('G10-1','What is the plural of „das Kind“?',['die Kinde','die Kinder','die Kindern'],'die Kinder'),choice('G10-2','___ Wohnungen sind teuer.',['Der','Die','Das'],'Die')],
    independent: [fill('G10-3','ein Bus – zwei ___','Busse'),order('G10-4','Build the sentence.','Die Bücher sind hier.',['hier.','sind','Die Bücher'])],
  },
  {
    id: 'G11', number: 11, unit: 3, title: 'Possessive determiners', shortTitle: 'mein, dein, sein, ihr',
    englishGuide: grammarEnglishGuides.G11,
    objective: t('Say who something belongs to with possessive determiners in the nominative.','Говорити, кому щось належить, за допомогою присвійних слів у називному відмінку.','التعبير عن الملكية بصفات الملكية في حالة الرفع.','بیان مالکیت با تعیین‌کننده‌های ملکی در حالت فاعلی.','په فاعلي حالت کې د ملکی ټاکونکو په وسیله ملکیت ښودل.'),
    explanation: t('Use mein, dein, sein, ihr, unser, euer and Ihr before a noun. They take an ending like ein: mein Bruder, meine Schwester, mein Kind, meine Freunde.','Перед іменником вживайте mein, dein, sein, ihr, unser, euer та Ihr. Вони мають закінчення як ein: mein Bruder, meine Schwester, mein Kind, meine Freunde.','استخدم mein وdein وsein وihr وunser وeuer وIhr قبل الاسم. تأخذ نهايات مثل ein: mein Bruder، meine Schwester، mein Kind، meine Freunde.','پیش از اسم از mein، dein، sein، ihr، unser، euer وIhr استفاده کنید. پسوندهایشان مانند ein است: mein Bruder، meine Schwester، mein Kind، meine Freunde.','له نوم مخکې mein، dein، sein، ihr، unser، euer او Ihr وکاروئ. پایونه یې د ein په شان دي: mein Bruder، meine Schwester، mein Kind، meine Freunde.'),
    feedback: t('First choose the owner, then match the ending to the noun: feminine and plural take -e in the nominative.','Спочатку визначте власника, потім узгодьте закінчення з іменником: жіночий рід і множина в називному мають -e.','اختر المالك أولاً ثم طابق النهاية مع الاسم: المؤنث والجمع يأخذان -e في حالة الرفع.','ابتدا مالک را انتخاب کنید، سپس پسوند را با اسم هماهنگ کنید: مؤنث و جمع در حالت فاعلی -e می‌گیرند.','لومړی مالک وټاکئ، بیا پای له نوم سره برابر کړئ: مؤنث او جمع په فاعلي حالت کې -e اخلي.'),
    examples: [
      { de: 'Das ist mein Bruder. Seine Frau heißt Lea.', meaning: t('That is my brother. His wife is called Lea.','Це мій брат. Його дружину звати Леа.','هذا أخي. اسم زوجته ليا.','این برادر من است. نام همسرش لئا است.','دا زما ورور دی. د هغه د مېرمنې نوم لئا دی.') },
      { de: 'Wo sind eure Schlüssel?', meaning: t('Where are your keys?','Де ваші ключі?','أين مفاتيحكم؟','کلیدهای شما کجاست؟','ستاسو کیلي چېرته دي؟') },
    ],
    guided: [choice('G11-1','Ich heiße Ana. ___ Familie wohnt in Wien.',['Mein','Meine','Meinen'],'Meine'),choice('G11-2','Paul hat ein Kind. ___ Kind ist vier.',['Sein','Seine','Ihr'],'Sein')],
    independent: [fill('G11-3','Du hast eine Frage. Das ist ___ Frage.','deine'),order('G11-4','Build the sentence.','Unsere Freunde kommen heute.',['heute.','Unsere Freunde','kommen'])],
  },
  {
    id: 'G12', number: 12, unit: 3, title: 'Negation with nicht and kein', shortTitle: 'nicht oder kein?',
    englishGuide: grammarEnglishGuides.G12,
    objective: t('Choose nicht or kein to make clear negative statements.','Добирати nicht або kein для чітких заперечних речень.','اختيار nicht أو kein لصياغة النفي بوضوح.','انتخاب nicht یا kein برای ساخت جمله منفی روشن.','د روښانه منفي جملو لپاره nicht یا kein ټاکل.'),
    explanation: t('Use kein before a noun that would have ein/eine or no article: kein Auto, keine Zeit. Use nicht to negate verbs, adjectives, names or definite phrases: Ich komme nicht; Das ist nicht teuer.','Вживайте kein перед іменником, який мав би ein/eine або без артикля: kein Auto, keine Zeit. Nicht заперечує дієслова, прикметники, імена чи означені словосполучення: Ich komme nicht; Das ist nicht teuer.','استخدم kein قبل اسم كان سيأخذ ein/eine أو بلا أداة: kein Auto، keine Zeit. استخدم nicht لنفي الأفعال والصفات والأسماء والعبارات المعرفة: Ich komme nicht؛ Das ist nicht teuer.','kein پیش از اسمی می‌آید که ein/eine یا بدون حرف تعریف است: kein Auto، keine Zeit. nicht فعل، صفت، نام یا عبارت معرفه را منفی می‌کند: Ich komme nicht؛ Das ist nicht teuer.','kein له هغه نوم مخکې راځي چې ein/eine یا بې ارټیکله وي: kein Auto، keine Zeit. nicht فعلونه، صفتونه، نومونه یا تعریف شوي عبارتونه منفي کوي: Ich komme nicht؛ Das ist nicht teuer.'),
    feedback: t('Kein behaves like ein before a noun; nicht negates the rest of the sentence.','Kein поводиться як ein перед іменником; nicht заперечує іншу частину речення.','يتصرف kein مثل ein قبل الاسم، أما nicht فينفي بقية الجملة.','kein پیش از اسم مانند ein رفتار می‌کند؛ nicht بقیه جمله را منفی می‌کند.','kein له نوم مخکې د ein په شان دی؛ nicht د جملې پاتې برخه منفي کوي.'),
    examples: [
      { de: 'Ich habe kein Auto.', meaning: t('I do not have a car.','У мене немає автомобіля.','ليس لدي سيارة.','من ماشین ندارم.','زه موټر نه لرم.') },
      { de: 'Der Kurs ist nicht teuer.', meaning: t('The course is not expensive.','Курс недорогий.','الدورة ليست غالية.','کلاس گران نیست.','کورس ګران نه دی.') },
    ],
    guided: [choice('G12-1','Wir haben ___ Milch.',['nicht','keine','kein'],'keine'),choice('G12-2','Das Wetter ist ___ gut.',['nicht','kein','keine'],'nicht')],
    independent: [fill('G12-3','Er kommt heute ___.','nicht'),order('G12-4','Build the sentence.','Ich habe keine Zeit.',['Zeit.','keine','habe','Ich'])],
  },
  {
    id: 'G13', number: 13, unit: 4, title: 'The accusative case', shortTitle: 'den, einen',
    englishGuide: grammarEnglishGuides.G13,
    objective: t('Mark the direct object with accusative articles.','Позначати прямий додаток артиклями знахідного відмінка.','تمييز المفعول به المباشر بأدوات حالة النصب.','نشانه‌گذاری مفعول مستقیم با حرف تعریف حالت مفعولی.','مستقیم مفعول د accusative ارټیکلونو په وسیله ښودل.'),
    explanation: t('The direct object often receives the action. Only masculine articles visibly change: der → den, ein → einen, kein → keinen. Feminine, neuter and plural forms stay the same here.','Прямий додаток часто отримує дію. Помітно змінюються лише чоловічі артиклі: der → den, ein → einen, kein → keinen. Жіночі, середні та множинні форми тут не змінюються.','غالباً يقع الفعل على المفعول به المباشر. تتغير أدوات المذكر ظاهراً فقط: der → den وein → einen وkein → keinen. تبقى صيغ المؤنث والمحايد والجمع كما هي هنا.','عمل معمولاً بر مفعول مستقیم انجام می‌شود. فقط حرف تعریف مذکر آشکارا تغییر می‌کند: der → den، ein → einen، kein → keinen. شکل مؤنث، خنثی و جمع اینجا ثابت می‌ماند.','عمل زیاتره پر مستقیم مفعول کېږي. یوازې مذکر ارټیکل ښکاره بدلېږي: der → den، ein → einen، kein → keinen. مؤنث، خنثی او جمع دلته هماغسې پاتې کېږي.'),
    feedback: t('Ask “whom or what?” after the verb. A masculine direct object uses den/einen/keinen.','Поставте після дієслова питання «кого або що?». Чоловічий прямий додаток має den/einen/keinen.','اسأل «مَن أو ماذا؟» بعد الفعل. المفعول المذكر يأخذ den/einen/keinen.','پس از فعل بپرسید «چه کسی یا چه چیزی؟». مفعول مستقیم مذکر den/einen/keinen می‌گیرد.','له فعل وروسته «څوک یا څه؟» وپوښتئ. مذکر مستقیم مفعول den/einen/keinen اخلي.'),
    examples: [
      { de: 'Ich kaufe den Kaffee und eine Banane.', meaning: t('I buy the coffee and a banana.','Я купую каву й банан.','أشتري القهوة وموزة.','قهوه و یک موز می‌خرم.','زه قهوه او یوه کېله اخلم.') },
      { de: 'Wir brauchen ein Ticket.', meaning: t('We need a ticket.','Нам потрібен квиток.','نحتاج إلى تذكرة.','ما به یک بلیت نیاز داریم.','موږ یوه ټکټ ته اړتیا لرو.') },
    ],
    guided: [choice('G13-1','Ich sehe ___ Mann.',['der','den','dem'],'den'),choice('G13-2','Sie kauft ___ Jacke.',['eine','einen','einer'],'eine')],
    independent: [fill('G13-3','Wir brauchen ___ Bus. (ein)','einen'),order('G13-4','Build the sentence.','Er liest das Buch.',['das Buch.','liest','Er'])],
  },
  {
    id: 'G14', number: 14, unit: 4, title: 'Accusative personal pronouns', shortTitle: 'mich, dich, ihn',
    englishGuide: grammarEnglishGuides.G14,
    objective: t('Replace direct objects with accusative personal pronouns.','Замінювати прямі додатки особовими займенниками у знахідному відмінку.','استبدال المفعول به بضمائر النصب الشخصية.','جایگزینی مفعول مستقیم با ضمیر شخصی مفعولی.','مستقیم مفعول د accusative شخصي ضمیرونو په وسیله بدلول.'),
    explanation: t('The accusative pronouns are mich, dich, ihn, sie, es, uns, euch, sie/Sie. Use them when the person or thing is already clear: Ich sehe den Bus. Ich sehe ihn.','Знахідні займенники: mich, dich, ihn, sie, es, uns, euch, sie/Sie. Вживайте їх, коли особа чи предмет уже зрозумілі: Ich sehe den Bus. Ich sehe ihn.','ضمائر النصب هي mich وdich وihn وsie وes وuns وeuch وsie/Sie. استخدمها عندما يكون الشخص أو الشيء معروفاً: Ich sehe den Bus. Ich sehe ihn.','ضمیرهای مفعولی mich، dich، ihn، sie، es، uns، euch، sie/Sie هستند. وقتی شخص یا چیز روشن است از آنها استفاده کنید: Ich sehe den Bus. Ich sehe ihn.','د accusative ضمیرونه mich، dich، ihn، sie، es، uns، euch، sie/Sie دي. کله چې شخص یا شی معلوم وي، دا وکاروئ: Ich sehe den Bus. Ich sehe ihn.'),
    feedback: t('The pronoun must match the object, not the subject: masculine den becomes ihn.','Займенник має відповідати додатку, а не підмету: чоловіче den стає ihn.','يجب أن يطابق الضمير المفعول لا الفاعل: المذكر den يصبح ihn.','ضمیر باید با مفعول هماهنگ باشد، نه فاعل: den مذکر به ihn تبدیل می‌شود.','ضمیر باید له مفعول سره برابر وي، نه له فاعل سره: مذکر den په ihn بدلېږي.'),
    examples: [
      { de: 'Kennst du Amira? – Ja, ich kenne sie.', meaning: t('Do you know Amira? – Yes, I know her.','Ти знаєш Аміру? — Так, знаю її.','هل تعرف أميرة؟ – نعم، أعرفها.','آمیرا را می‌شناسی؟ – بله، او را می‌شناسم.','آمیرا پېژنې؟ – هو، هغه پېژنم.') },
      { de: 'Der Arzt ruft mich an.', meaning: t('The doctor calls me.','Лікар телефонує мені.','الطبيب يتصل بي.','پزشک با من تماس می‌گیرد.','ډاکټر ماته زنګ وهي.') },
    ],
    guided: [choice('G14-1','Wo ist der Schlüssel? Ich finde ___ nicht.',['ihn','er','sie'],'ihn'),choice('G14-2','Wir sehen Paul und Mia. Wir sehen ___.',['euch','sie','uns'],'sie')],
    independent: [fill('G14-3','Rufst du ___ heute an? (ich)','mich'),order('G14-4','Build the sentence.','Ich besuche dich morgen.',['morgen.','dich','Ich','besuche'])],
  },
  {
    id: 'G15', number: 15, unit: 4, title: 'Possessives in the accusative', shortTitle: 'meinen, deine, unser',
    englishGuide: grammarEnglishGuides.G15,
    objective: t('Use possessive determiners with direct objects.','Вживати присвійні слова з прямими додатками.','استخدام صفات الملكية مع المفعول به المباشر.','استفاده از تعیین‌کننده‌های ملکی با مفعول مستقیم.','له مستقیم مفعول سره ملکی ټاکونکي کارول.'),
    explanation: t('Possessive determiners follow the ein pattern. In the accusative, masculine nouns take -en: meinen Bruder, deinen Pass. Feminine takes -e; neuter has no extra ending.','Присвійні слова відмінюються за зразком ein. У знахідному чоловічий рід має -en: meinen Bruder, deinen Pass. Жіночий має -e; середній — без додаткового закінчення.','تتبع صفات الملكية نمط ein. في النصب يأخذ المذكر -en: meinen Bruder، deinen Pass. المؤنث يأخذ -e والمحايد بلا نهاية إضافية.','تعیین‌کننده‌های ملکی از الگوی ein پیروی می‌کنند. در حالت مفعولی مذکر -en می‌گیرد: meinen Bruder، deinen Pass. مؤنث -e و خنثی بدون پسوند اضافی است.','ملکي ټاکونکي د ein بڼه تعقیبوي. په accusative کې مذکر -en اخلي: meinen Bruder، deinen Pass. مؤنث -e اخلي او خنثی اضافه پای نه لري.'),
    feedback: t('For a masculine direct object, add -en to the possessive determiner.','Для прямого додатка чоловічого роду додайте -en до присвійного слова.','مع المفعول المذكر أضف -en إلى صفة الملكية.','برای مفعول مستقیم مذکر، -en را به تعیین‌کننده ملکی اضافه کنید.','د مذکر مستقیم مفعول لپاره ملکی ټاکونکي ته -en ورزیات کړئ.'),
    examples: [
      { de: 'Ich suche meinen Pass.', meaning: t('I am looking for my passport.','Я шукаю свій паспорт.','أبحث عن جواز سفري.','دنبال گذرنامه‌ام می‌گردم.','زه خپل پاسپورټ لټوم.') },
      { de: 'Sie besucht ihre Mutter.', meaning: t('She visits her mother.','Вона відвідує свою маму.','هي تزور أمها.','او به دیدن مادرش می‌رود.','هغه د خپلې مور لیدو ته ځي.') },
    ],
    guided: [choice('G15-1','Ali sucht ___ Schlüssel.',['sein','seine','seinen'],'seinen'),choice('G15-2','Wir kaufen ___ Tickets.',['unsere','unseren','unser'],'unsere')],
    independent: [fill('G15-3','Ich besuche ___ Schwester. (mein)','meine'),order('G15-4','Build the sentence.','Du brauchst deinen Ausweis.',['deinen','Du','Ausweis.','brauchst'])],
  },
  {
    id: 'G16', number: 16, unit: 4, title: 'Accusative prepositions', shortTitle: 'für, ohne, durch, gegen',
    englishGuide: grammarEnglishGuides.G16,
    objective: t('Use common prepositions that always take the accusative.','Вживати поширені прийменники, які завжди керують знахідним відмінком.','استخدام حروف الجر الشائعة التي تأخذ النصب دائماً.','استفاده از حروف اضافه رایج که همیشه حالت مفعولی می‌گیرند.','هغه عام حروف اضافه کارول چې تل accusative اخلي.'),
    explanation: t('Für, ohne, durch, gegen and um take the accusative. Notice masculine forms: für den Kurs, ohne einen Termin. Um also gives clock time: um acht Uhr.','Für, ohne, durch, gegen та um вимагають знахідного. Зверніть увагу на чоловічі форми: für den Kurs, ohne einen Termin. Um також указує точний час: um acht Uhr.','تأخذ für وohne وdurch وgegen وum حالة النصب. لاحظ صيغ المذكر: für den Kurs، ohne einen Termin. وتستخدم um أيضاً للوقت: um acht Uhr.','für، ohne، durch، gegen وum حالت مفعولی می‌گیرند. به شکل مذکر توجه کنید: für den Kurs، ohne einen Termin. um برای ساعت هم به کار می‌رود: um acht Uhr.','für، ohne، durch، gegen او um accusative اخلي. مذکر بڼو ته پام وکړئ: für den Kurs، ohne einen Termin. um د ساعت لپاره هم کارېږي: um acht Uhr.'),
    feedback: t('After these prepositions, masculine der/ein changes to den/einen.','Після цих прийменників чоловіче der/ein змінюється на den/einen.','بعد هذه الحروف يتحول der/ein المذكر إلى den/einen.','پس از این حروف اضافه، der/ein مذکر به den/einen تبدیل می‌شود.','له دې حروفو وروسته مذکر der/ein په den/einen بدلېږي.'),
    examples: [
      { de: 'Das Geschenk ist für meinen Freund.', meaning: t('The present is for my friend.','Подарунок для мого друга.','الهدية لصديقي.','هدیه برای دوستم است.','ډالۍ زما د ملګري لپاره ده.') },
      { de: 'Wir gehen durch den Park.', meaning: t('We walk through the park.','Ми йдемо через парк.','نحن نمشي عبر الحديقة.','ما از پارک عبور می‌کنیم.','موږ د پارک له منځه ځو.') },
    ],
    guided: [choice('G16-1','Der Termin ist ___ neun Uhr.',['für','um','durch'],'um'),choice('G16-2','Sie fährt ohne ___ Mann.',['ihr','ihren','ihrem'],'ihren')],
    independent: [fill('G16-3','Das Ticket ist ___ den Bus.','für'),order('G16-4','Build the sentence.','Wir gehen durch die Stadt.',['die Stadt.','gehen','durch','Wir'])],
  },
  {
    id: 'G17', number: 17, unit: 5, title: 'können and möchten', shortTitle: 'ability and polite wishes',
    englishGuide: grammarEnglishGuides.G17,
    objective: t('Talk about ability and make polite requests with können and möchten.','Говорити про вміння та ввічливо просити за допомогою können і möchten.','التعبير عن القدرة والطلب بأدب باستخدام können وmöchten.','بیان توانایی و درخواست مؤدبانه با können وmöchten.','د können او möchten په وسیله وړتیا او مؤدبانه غوښتنه بیانول.'),
    explanation: t('A modal verb is conjugated in position 2; the second verb stays in the infinitive at the end: Ich kann Deutsch sprechen. Möchten is used for polite wishes: Ich möchte einen Tee.','Модальне дієслово відмінюється на другій позиції; друге дієслово стоїть в інфінітиві в кінці: Ich kann Deutsch sprechen. Möchten вживають для ввічливих побажань: Ich möchte einen Tee.','يُصرّف الفعل الناقص في الموقع الثاني، ويبقى الفعل الآخر في المصدر في النهاية: Ich kann Deutsch sprechen. تُستخدم möchten للرغبة المهذبة: Ich möchte einen Tee.','فعل وجهی در جایگاه دوم صرف می‌شود و فعل دوم به شکل مصدر در پایان می‌آید: Ich kann Deutsch sprechen. möchten برای خواسته مؤدبانه است: Ich möchte einen Tee.','وجهی فعل په دویم ځای کې صرفېږي او دویم فعل د مصدر په بڼه په پای کې راځي: Ich kann Deutsch sprechen. möchten د مؤدبانه غوښتنې لپاره دی: Ich möchte einen Tee.'),
    feedback: t('Conjugate the modal verb; move the action verb to the sentence end as an infinitive.','Відмінюйте модальне дієслово, а дієслово дії ставте в кінці як інфінітив.','صرّف الفعل الناقص وضع فعل الحدث في آخر الجملة بصيغة المصدر.','فعل وجهی را صرف کنید و فعل اصلی را به صورت مصدر در پایان بگذارید.','وجهی فعل صرف کړئ او اصلي فعل د مصدر په بڼه د جملې پای ته یوسئ.'),
    examples: [
      { de: 'Ich kann heute kommen.', meaning: t('I can come today.','Я можу прийти сьогодні.','يمكنني أن آتي اليوم.','می‌توانم امروز بیایم.','زه نن راتلای شم.') },
      { de: 'Möchten Sie einen Kaffee?', meaning: t('Would you like a coffee?','Бажаєте кави?','هل ترغب في قهوة؟','قهوه میل دارید؟','قهوه غواړئ؟') },
    ],
    guided: [choice('G17-1','Du ___ gut schwimmen.',['kann','kannst','könnt'],'kannst'),choice('G17-2','Ich möchte ein Ticket ___.',['kaufe','kauft','kaufen'],'kaufen')],
    independent: [fill('G17-3','Wir ___ morgen kommen. (können)','können'),order('G17-4','Build the sentence.','Sie möchte einen Tee trinken.',['trinken.','einen Tee','Sie','möchte'])],
  },
  {
    id: 'G18', number: 18, unit: 5, title: 'müssen, dürfen and wollen', shortTitle: 'need, permission, intention',
    englishGuide: grammarEnglishGuides.G18,
    objective: t('Express necessity, permission and intention with common modal verbs.','Виражати необхідність, дозвіл і намір поширеними модальними дієсловами.','التعبير عن الضرورة والإذن والنية بالأفعال الناقصة الشائعة.','بیان ضرورت، اجازه و قصد با فعل‌های وجهی رایج.','د عامو وجهی فعلونو په وسیله اړتیا، اجازه او نیت بیانول.'),
    explanation: t('Müssen means “must/need to”, dürfen means “may/be allowed to”, and wollen means “want/intend to”. The modal is conjugated; the action infinitive goes last.','Müssen означає «мусити/треба», dürfen — «мати дозвіл», wollen — «хотіти/мати намір». Модальне дієслово відмінюється, інфінітив дії стоїть у кінці.','müssen تعني «يجب»، وdürfen تعني «يُسمح»، وwollen تعني «يريد/ينوي». يُصرّف الفعل الناقص ويأتي مصدر الفعل في النهاية.','müssen یعنی «باید»، dürfen یعنی «اجازه داشتن» وwollen یعنی «خواستن/قصد داشتن». فعل وجهی صرف می‌شود و مصدر عمل در پایان می‌آید.','müssen «باید/اړتیا»، dürfen «اجازه» او wollen «غوښتل/نیت» مانا لري. وجهی فعل صرفېږي او د عمل مصدر په پای کې راځي.'),
    feedback: t('Keep the infinitive at the end and choose the modal that matches necessity, permission or intention.','Залишайте інфінітив у кінці й обирайте модальне дієслово за значенням: необхідність, дозвіл чи намір.','ضع المصدر في النهاية واختر الفعل الناقص المناسب للضرورة أو الإذن أو النية.','مصدر را در پایان نگه دارید و فعل وجهی را بر اساس ضرورت، اجازه یا قصد انتخاب کنید.','مصدر په پای کې وساتئ او وجهی فعل د اړتیا، اجازې یا نیت له مخې وټاکئ.'),
    examples: [
      { de: 'Ich muss um sieben arbeiten.', meaning: t('I have to work at seven.','Я маю працювати о сьомій.','يجب أن أعمل الساعة السابعة.','باید ساعت هفت کار کنم.','زه باید په اوو بجو کار وکړم.') },
      { de: 'Darf ich hier warten?', meaning: t('May I wait here?','Можна мені тут почекати?','هل يُسمح لي أن أنتظر هنا؟','اجازه دارم اینجا منتظر بمانم؟','کولای شم دلته انتظار وکړم؟') },
    ],
    guided: [choice('G18-1','Wir ___ heute lernen. It is necessary.',['müssen','dürfen','wollen'],'müssen'),choice('G18-2','___ ich hier parken? Ask permission.',['Muss','Darf','Will'],'Darf')],
    independent: [fill('G18-3','Er ___ Arzt werden. (wollen)','will'),order('G18-4','Build the sentence.','Ihr müsst heute einkaufen.',['einkaufen.','heute','Ihr','müsst'])],
  },
  {
    id: 'G19', number: 19, unit: 5, title: 'Separable verbs', shortTitle: 'anrufen, einkaufen, aufstehen',
    englishGuide: grammarEnglishGuides.G19,
    objective: t('Use common separable verbs in statements and questions.','Вживати поширені відокремлювані дієслова у твердженнях і запитаннях.','استخدام الأفعال المنفصلة الشائعة في الجمل والأسئلة.','استفاده از فعل‌های جداشدنی رایج در جمله و سؤال.','په جملو او پوښتنو کې عام جلا کېدونکي فعلونه کارول.'),
    explanation: t('In a main clause, conjugate the verb stem and move the prefix to the end: Ich rufe dich an. With a modal verb, the whole infinitive stays together at the end: Ich muss einkaufen.','У головному реченні відмінюйте основу, а префікс ставте в кінці: Ich rufe dich an. З модальним дієсловом весь інфінітив стоїть разом у кінці: Ich muss einkaufen.','في الجملة الرئيسية صرّف جذر الفعل وضع السابقة في النهاية: Ich rufe dich an. مع الفعل الناقص يبقى المصدر كاملاً في النهاية: Ich muss einkaufen.','در جمله اصلی بن فعل را صرف و پیشوند را به پایان منتقل کنید: Ich rufe dich an. با فعل وجهی، مصدر کامل در پایان می‌ماند: Ich muss einkaufen.','په اصلي جمله کې د فعل بن صرف او مختاړی پای ته یوسئ: Ich rufe dich an. له وجهی فعل سره بشپړ مصدر په پای کې یوځای پاتې کېږي: Ich muss einkaufen.'),
    feedback: t('Without a modal, the prefix separates and closes the sentence; with a modal, it remains attached.','Без модального дієслова префікс відокремлюється й завершує речення; з модальним залишається разом.','من دون فعل ناقص تنفصل السابقة وتغلق الجملة؛ ومع الفعل الناقص تبقى متصلة.','بدون فعل وجهی، پیشوند جدا و در پایان می‌آید؛ با فعل وجهی پیوسته می‌ماند.','له وجهی فعل پرته مختاړی جلا او د جملې په پای کې راځي؛ له وجهی فعل سره نښتی پاتې کېږي.'),
    examples: [
      { de: 'Der Kurs fängt um neun an.', meaning: t('The course starts at nine.','Курс починається о дев’ятій.','تبدأ الدورة الساعة التاسعة.','کلاس ساعت نه شروع می‌شود.','کورس په نهو بجو پیلېږي.') },
      { de: 'Wir kaufen am Samstag ein.', meaning: t('We shop on Saturday.','Ми робимо покупки в суботу.','نتسوق يوم السبت.','شنبه خرید می‌کنیم.','موږ د شنبې په ورځ سودا کوو.') },
    ],
    guided: [choice('G19-1','Ich ___ dich morgen ___. (anrufen)',['rufe / an','anrufe / –','rufst / an'],'rufe / an'),choice('G19-2','Wann ___ du ___? (aufstehen)',['stehst / auf','aufstehst / –','steht / auf'],'stehst / auf')],
    independent: [fill('G19-3','Der Zug kommt um zehn ___. (ankommen)','an'),order('G19-4','Build the sentence.','Mia sieht heute fern.',['fern.','Mia','heute','sieht'])],
  },
  {
    id: 'G20', number: 20, unit: 5, title: 'Imperatives', shortTitle: 'Komm! Kommt! Kommen Sie!',
    englishGuide: grammarEnglishGuides.G20,
    objective: t('Give friendly instructions with du, ihr and Sie imperative forms.','Давати дружні вказівки у формах наказового способу du, ihr і Sie.','إعطاء تعليمات ودية بصيغ الأمر du وihr وSie.','دادن دستورهای دوستانه با صورت امری du، ihr وSie.','په du، ihr او Sie امری بڼو دوستانه لارښوونې ورکول.'),
    explanation: t('For du, usually use the verb stem without du: Komm! For ihr, use the normal ihr form without ihr: Kommt! For polite Sie, use infinitive + Sie: Kommen Sie! Add bitte to sound friendly.','Для du зазвичай вживайте основу без du: Komm! Для ihr — звичайну форму без ihr: Kommt! Для ввічливого Sie: інфінітив + Sie: Kommen Sie! Додайте bitte для ввічливості.','مع du استخدم جذر الفعل غالباً من دون du: Komm! ومع ihr استخدم صيغته العادية من دون ihr: Kommt! ومع Sie الرسمية: المصدر + Sie: Kommen Sie! أضف bitte للطف.','برای du معمولاً بن فعل را بدون du به کار ببرید: Komm! برای ihr شکل عادی بدون ihr: Kommt! برای Sie محترمانه: مصدر + Sie: Kommen Sie! برای ادب bitte را اضافه کنید.','د du لپاره عموماً د فعل بن بې du وکاروئ: Komm! د ihr لپاره عادي بڼه بې ihr: Kommt! د مؤدب Sie لپاره مصدر + Sie: Kommen Sie! د نرموالي لپاره bitte ورزیات کړئ.'),
    feedback: t('Choose the form for one familiar person, several familiar people or polite Sie.','Оберіть форму для однієї знайомої людини, кількох знайомих людей або ввічливого Sie.','اختر الصيغة لشخص مألوف واحد أو عدة أشخاص مألوفين أو Sie الرسمية.','صورت مناسب برای یک فرد آشنا، چند فرد آشنا یا Sie محترمانه را انتخاب کنید.','د یوه اشنا کس، څو اشنا کسانو یا مؤدب Sie لپاره مناسبه بڼه وټاکئ.'),
    examples: [
      { de: 'Warte bitte hier!', meaning: t('Please wait here!','Будь ласка, зачекай тут!','انتظر هنا من فضلك!','لطفاً اینجا منتظر بمان!','مهرباني وکړه دلته انتظار وکړه!') },
      { de: 'Lesen Sie bitte den Text.', meaning: t('Please read the text.','Будь ласка, прочитайте текст.','اقرأ النص من فضلك.','لطفاً متن را بخوانید.','مهرباني وکړئ متن ولولئ.') },
    ],
    guided: [choice('G20-1','To one friend: ___ bitte langsam! (sprechen)',['Sprich','Sprecht','Sprechen Sie'],'Sprich'),choice('G20-2','To a group of friends: ___ die Tür! (öffnen)',['Öffne','Öffnet','Öffnen Sie'],'Öffnet')],
    independent: [fill('G20-3','Polite: ___ Sie bitte hier! (warten)','Warten'),order('G20-4','Build the instruction.','Komm bitte pünktlich!',['pünktlich!','bitte','Komm'])],
  },
  {
    id: 'G21', number: 21, unit: 6, title: 'The dative after fixed prepositions', shortTitle: 'mit, bei, zu, von, aus',
    englishGuide: grammarEnglishGuides.G21,
    objective: t('Use dative articles after mit, bei, zu, von and aus.','Вживати давальні артиклі після mit, bei, zu, von та aus.','استخدام أدوات حالة الداتيف بعد mit وbei وzu وvon وaus.','استفاده از حروف تعریف داتیو پس از mit، bei، zu، von وaus.','له mit، bei، zu، von او aus وروسته د dative ارټیکلونه کارول.'),
    explanation: t('These prepositions always take the dative. Articles become dem (masculine/neuter), der (feminine) and den + noun-n for plural when possible. Common contractions include zum, zur and beim.','Ці прийменники завжди вимагають давального. Артиклі стають dem (чоловічий/середній), der (жіночий) та den + -n до іменника у множині, якщо можливо. Часті скорочення: zum, zur, beim.','تأخذ هذه الحروف الداتيف دائماً. تصبح الأدوات dem للمذكر والمحايد وder للمؤنث وden مع -n غالباً للجمع. من الاختصارات الشائعة zum وzur وbeim.','این حروف اضافه همیشه داتیو می‌گیرند. حرف تعریف به dem برای مذکر/خنثی، der برای مؤنث و den همراه -n برای جمع تبدیل می‌شود. شکل‌های کوتاه رایج zum، zur وbeim هستند.','دا حروف اضافه تل dative اخلي. ارټیکل د مذکر/خنثی لپاره dem، د مؤنث لپاره der او د جمع لپاره den له -n سره کېږي. عام لنډونونه zum، zur او beim دي.'),
    feedback: t('The preposition decides the case: after mit/bei/zu/von/aus, use dative forms.','Відмінок визначає прийменник: після mit/bei/zu/von/aus вживайте давальні форми.','حرف الجر يحدد الحالة: بعد mit/bei/zu/von/aus استخدم الداتيف.','حرف اضافه حالت را تعیین می‌کند: پس از mit/bei/zu/von/aus شکل داتیو را به کار ببرید.','حرف اضافه حالت ټاکي: له mit/bei/zu/von/aus وروسته د dative بڼې وکاروئ.'),
    examples: [
      { de: 'Ich fahre mit dem Bus zur Arbeit.', meaning: t('I go to work by bus.','Я їду на роботу автобусом.','أذهب إلى العمل بالحافلة.','با اتوبوس به محل کار می‌روم.','زه په بس کار ته ځم.') },
      { de: 'Sie kommt aus der Schule.', meaning: t('She comes from school.','Вона йде зі школи.','هي آتية من المدرسة.','او از مدرسه می‌آید.','هغه له ښوونځي راځي.') },
    ],
    guided: [choice('G21-1','Wir fahren mit ___ Zug.',['der','den','dem'],'dem'),choice('G21-2','Er ist bei ___ Ärztin.',['die','der','dem'],'der')],
    independent: [fill('G21-3','Ich gehe zu ___ Bahnhof. (der)','dem'),order('G21-4','Build the sentence.','Das Geschenk ist von meiner Schwester.',['von','Das Geschenk','meiner Schwester.','ist'])],
  },
  {
    id: 'G22', number: 22, unit: 6, title: 'Location with two-way prepositions', shortTitle: 'im, an der, auf dem',
    englishGuide: grammarEnglishGuides.G22,
    objective: t('Describe a fixed location with in, an and auf plus the dative.','Описувати місцезнаходження за допомогою in, an і auf з давальним відмінком.','وصف مكان ثابت باستخدام in وan وauf مع الداتيف.','توصیف مکان ثابت با in، an وauf همراه داتیو.','ثابت ځای د in، an او auf له dative سره بیانول.'),
    explanation: t('For the A1 question Wo? (where?), in, an and auf usually take the dative: im Supermarkt, an der Haltestelle, auf dem Tisch. Im = in dem. Direction (Wohin?) is learned later in more detail.','Для запитання A1 Wo? (де?) in, an та auf зазвичай керують давальним: im Supermarkt, an der Haltestelle, auf dem Tisch. Im = in dem. Напрямок (Wohin?) докладніше вивчається пізніше.','مع سؤال Wo? (أين؟) في A1 تأخذ in وan وauf الداتيف غالباً: im Supermarkt، an der Haltestelle، auf dem Tisch. im = in dem. سيُشرح الاتجاه Wohin? لاحقاً.','برای سؤال A1 با Wo? (کجا؟)، in، an وauf معمولاً داتیو می‌گیرند: im Supermarkt، an der Haltestelle، auf dem Tisch. im = in dem. جهت Wohin? بعداً کامل‌تر می‌آید.','د A1 د Wo? (چېرته؟) پوښتنې لپاره in، an او auf عموماً dative اخلي: im Supermarkt، an der Haltestelle، auf dem Tisch. im = in dem. د Wohin? لوری وروسته په تفصیل زده کېږي.'),
    feedback: t('For a fixed place answering Wo?, use the dative form shown by dem/der.','Для сталого місця у відповіді на Wo? вживайте давальну форму dem/der.','للمكان الثابت الذي يجيب عن Wo? استخدم صيغة الداتيف dem/der.','برای مکان ثابت در پاسخ به Wo? از شکل داتیو dem/der استفاده کنید.','د ثابت ځای لپاره چې Wo? ته ځواب وايي، د dative dem/der بڼه وکاروئ.'),
    examples: [
      { de: 'Die Milch ist im Kühlschrank.', meaning: t('The milk is in the fridge.','Молоко в холодильнику.','الحليب في الثلاجة.','شیر در یخچال است.','شیدې په یخچال کې دي.') },
      { de: 'Wir warten an der Haltestelle.', meaning: t('We wait at the stop.','Ми чекаємо на зупинці.','نحن ننتظر عند المحطة.','ما در ایستگاه منتظریم.','موږ په تمځای کې انتظار کوو.') },
    ],
    guided: [choice('G22-1','Das Handy liegt auf ___ Tisch.',['den','dem','der'],'dem'),choice('G22-2','Sie arbeitet in ___ Küche.',['die','der','den'],'der')],
    independent: [fill('G22-3','Wir sind ___ Supermarkt. (in dem)','im'),order('G22-4','Build the sentence.','Der Bus ist an der Haltestelle.',['an der Haltestelle.','Der Bus','ist'])],
  },
  {
    id: 'G23', number: 23, unit: 6, title: 'Time expressions', shortTitle: 'um, am, von … bis',
    englishGuide: grammarEnglishGuides.G23,
    objective: t('Say clock times, days, dates and time spans with the right prepositions.','Називати час, дні, дати й проміжки часу з правильними прийменниками.','ذكر الساعة والأيام والتواريخ والفترات الزمنية بحروف الجر الصحيحة.','گفتن ساعت، روز، تاریخ و بازه زمانی با حرف اضافه درست.','ساعت، ورځې، نېټې او د وخت واټنونه له سمو حروفو سره ویل.'),
    explanation: t('Use um for exact clock time, am for days and parts of the day, im for months and seasons, and von … bis for a span. Say morgens for a regular habit, but heute Morgen for this morning.','Вживайте um для точного часу, am для днів і частин дня, im для місяців та пір року, von … bis для проміжку. Morgens — регулярна звичка, heute Morgen — сьогодні вранці.','استخدم um للساعة المحددة وam للأيام وأوقات اليوم وim للأشهر والفصول وvon … bis للفترة. morgens للعادة، وheute Morgen لصباح اليوم.','um برای ساعت دقیق، am برای روزها و بخش‌های روز، im برای ماه‌ها و فصل‌ها، و von … bis برای بازه است. morgens عادت همیشگی و heute Morgen امروز صبح است.','um د دقیق ساعت، am د ورځو او د ورځې برخو، im د میاشتو او فصلونو، او von … bis د وخت د واټن لپاره دی. morgens عادت او heute Morgen د نن سهار مانا لري.'),
    feedback: t('Match the expression: um + clock time, am + day, im + month/season.','Узгодьте вираз: um + година, am + день, im + місяць/пора року.','طابق التعبير: um + الساعة، am + اليوم، im + الشهر/الفصل.','عبارت را هماهنگ کنید: um + ساعت، am + روز، im + ماه/فصل.','عبارت برابر کړئ: um + ساعت، am + ورځ، im + میاشت/فصل.'),
    examples: [
      { de: 'Der Kurs ist am Montag um neun Uhr.', meaning: t('The course is on Monday at nine.','Курс у понеділок о дев’ятій.','الدورة يوم الاثنين الساعة التاسعة.','کلاس دوشنبه ساعت نه است.','کورس د دوشنبې په ورځ په نهو بجو دی.') },
      { de: 'Ich arbeite von acht bis zwölf.', meaning: t('I work from eight to twelve.','Я працюю з восьмої до дванадцятої.','أعمل من الثامنة حتى الثانية عشرة.','از ساعت هشت تا دوازده کار می‌کنم.','زه له اتو تر دولسو کار کوم.') },
    ],
    guided: [choice('G23-1','Der Film beginnt ___ 20 Uhr.',['am','im','um'],'um'),choice('G23-2','Wir reisen ___ Juli.',['am','im','um'],'im')],
    independent: [fill('G23-3','Der Termin ist ___ Dienstag.','am'),order('G23-4','Build the sentence.','Ich lerne von sechs bis sieben.',['bis sieben.','von sechs','Ich','lerne'])],
  },
  {
    id: 'G24', number: 24, unit: 6, title: 'Dative Pronouns and Common Verbs', shortTitle: 'mir, dir, ihm, ihr',
    englishGuide: grammarEnglishGuides.G24,
    objective: t('Understand why German uses dative pronouns such as mir and dir, and use them with common everyday verbs.','Вживати основні займенники давального відмінка з helfen, danken та gefallen.','استخدام ضمائر الداتيف الأساسية مع helfen وdanken وgefallen.','استفاده از ضمیرهای پایه داتیو با helfen، danken وgefallen.','د helfen، danken او gefallen سره بنسټیز dative ضمیرونه کارول.'),
    explanation: t('Some German verbs connect an action or experience to a person. That person takes the dative case. Instead of ich, du or er, German uses forms such as mir, dir or ihm. You will meet this pattern often with helfen (to help), danken (to thank), gefallen (to be pleasing) and schmecken (to taste good to someone).','Займенники давального: mir, dir, ihm, ihr, ihm, uns, euch, ihnen/Ihnen. Деякі поширені дієслова вимагають особу в давальному: Ich helfe dir. Der Film gefällt mir.','ضمائر الداتيف هي mir وdir وihm وihr وihm وuns وeuch وihnen/Ihnen. بعض الأفعال الشائعة تحتاج شخصاً في الداتيف: Ich helfe dir. Der Film gefällt mir.','ضمیرهای داتیو mir، dir، ihm، ihr، ihm، uns، euch، ihnen/Ihnen هستند. بعضی فعل‌های رایج شخص را در داتیو می‌گیرند: Ich helfe dir. Der Film gefällt mir.','د dative ضمیرونه mir، dir، ihm، ihr، ihm، uns، euch، ihnen/Ihnen دي. ځینې عام فعلونه شخص په dative کې غواړي: Ich helfe dir. Der Film gefällt mir.'),
    feedback: t('The person receiving help, thanks or an impression is in the dative.','Особа, яка отримує допомогу, подяку чи враження, стоїть у давальному.','الشخص الذي يتلقى المساعدة أو الشكر أو الانطباع يأتي في الداتيف.','شخصی که کمک، تشکر یا تأثیر را دریافت می‌کند در داتیو می‌آید.','هغه شخص چې مرسته، مننه یا اغېز ترلاسه کوي په dative کې راځي.'),
    examples: [
      { de: 'Kannst du mir helfen?', highlight: 'mir', meaning: t('Can you help me?','Можеш мені допомогти?','هل يمكنك مساعدتي؟','می‌توانی به من کمک کنی؟','کولای شې له ما سره مرسته وکړې؟') },
      { de: 'Die Wohnung gefällt ihnen.', highlight: 'ihnen', meaning: t('They like the flat.','Їм подобається квартира.','تعجبهم الشقة.','آنها آپارتمان را می‌پسندند.','هغوی ته اپارتمان خوښېږي.') },
    ],
    guided: [choice('G24-1','Ich danke ___. (du)',['dich','dir','du'],'dir'),choice('G24-2','Der Kaffee schmeckt ___. (ich)',['mich','mir','mein'],'mir')],
    independent: [fill('G24-3','Wir helfen ___. (er)','ihm'),order('G24-4','Build the sentence.','Gefällt dir das Buch?',['das Buch?','Gefällt','dir'])],
  },
  {
    id: 'G25', number: 25, unit: 7, title: 'Connectors: und, aber, oder, denn', shortTitle: 'connect two ideas',
    englishGuide: grammarEnglishGuides.G25,
    objective: t('Connect simple main clauses without changing normal word order.','Поєднувати прості головні речення без зміни звичайного порядку слів.','ربط الجمل الرئيسية البسيطة من دون تغيير ترتيب الكلمات المعتاد.','پیوند دادن جمله‌های اصلی ساده بدون تغییر ترتیب معمول واژه‌ها.','ساده اصلي جملې د عادي کلمو ترتیب له بدلولو پرته نښلول.'),
    explanation: t('Und adds, aber contrasts, oder gives a choice and denn gives a reason. After these connectors, the new main clause keeps verb-second order: Ich komme, aber ich bin spät.','Und додає, aber протиставляє, oder дає вибір, denn називає причину. Після них нове головне речення зберігає дієслово на другій позиції: Ich komme, aber ich bin spät.','und للإضافة وaber للتعارض وoder للاختيار وdenn للسبب. بعد هذه الروابط تبقى الجملة الجديدة بترتيب الفعل ثانياً: Ich komme, aber ich bin spät.','und برای افزودن، aber برای تضاد، oder برای انتخاب و denn برای دلیل است. پس از آنها جمله اصلی جدید ترتیب فعل دوم را حفظ می‌کند: Ich komme, aber ich bin spät.','und د زیاتولو، aber د تضاد، oder د انتخاب او denn د دلیل لپاره دی. له دې نښلوونکو وروسته نوې اصلي جمله د فعل دویم ترتیب ساتي: Ich komme, aber ich bin spät.'),
    feedback: t('These four connectors link main clauses; the subject and verb keep their normal order after the connector.','Ці чотири сполучники з’єднують головні речення; після сполучника підмет і дієслово зберігають звичайний порядок.','هذه الروابط الأربع تصل الجمل الرئيسية؛ يبقى الفاعل والفعل بترتيبهما المعتاد بعدها.','این چهار پیوند جمله‌های اصلی را وصل می‌کنند؛ فاعل و فعل پس از پیوند ترتیب عادی را نگه می‌دارند.','دا څلور نښلوونکي اصلي جملې نښلوي؛ فاعل او فعل وروسته عادي ترتیب ساتي.'),
    examples: [
      { de: 'Ich trinke Tee, aber meine Schwester trinkt Kaffee.', meaning: t('I drink tea, but my sister drinks coffee.','Я п’ю чай, але моя сестра п’є каву.','أشرب الشاي، لكن أختي تشرب القهوة.','من چای می‌نوشم، اما خواهرم قهوه می‌نوشد.','زه چای څښم، خو زما خور قهوه څښي.') },
      { de: 'Wir fahren mit dem Bus, denn es regnet.', meaning: t('We go by bus because it is raining.','Ми їдемо автобусом, бо йде дощ.','نذهب بالحافلة لأن الجو ممطر.','با اتوبوس می‌رویم، چون باران می‌بارد.','موږ په بس ځو، ځکه باران ورېږي.') },
    ],
    guided: [choice('G25-1','Ich arbeite heute, ___ morgen habe ich frei.',['und','aber','denn'],'aber'),choice('G25-2','Möchtest du Tee ___ Kaffee?',['oder','denn','aber'],'oder')],
    independent: [fill('G25-3','Wir bleiben zu Hause, ___ es ist kalt.','denn'),order('G25-4','Build the sentence.','Er lernt und sie kocht.',['sie','Er lernt','kocht.','und'])],
  },
  {
    id: 'G26', number: 26, unit: 7, title: 'Sequence and position 1', shortTitle: 'zuerst, dann, später',
    englishGuide: grammarEnglishGuides.G26,
    objective: t('Describe a sequence and keep the verb in position 2 after a time word.','Описувати послідовність і зберігати дієслово на другій позиції після слова часу.','وصف التسلسل وإبقاء الفعل في الموقع الثاني بعد كلمة زمنية.','توصیف توالی و نگه داشتن فعل در جایگاه دوم پس از واژه زمانی.','د پېښو ترتیب بیانول او له وخت کلمې وروسته فعل په دویم ځای کې ساتل.'),
    explanation: t('Use zuerst, dann, danach and später to organize a day. When one of them is first, the verb follows immediately and the subject comes after it: Dann gehe ich zur Arbeit.','Вживайте zuerst, dann, danach і später, щоб упорядкувати день. Коли одне з них стоїть першим, одразу йде дієслово, а потім підмет: Dann gehe ich zur Arbeit.','استخدم zuerst وdann وdanach وspäter لترتيب أحداث اليوم. إذا جاءت إحداها أولاً يأتي الفعل مباشرة ثم الفاعل: Dann gehe ich zur Arbeit.','برای ترتیب روز از zuerst، dann، danach وspäter استفاده کنید. وقتی یکی اول است، فعل بلافاصله و سپس فاعل می‌آید: Dann gehe ich zur Arbeit.','د ورځې د ترتیب لپاره zuerst، dann، danach او später وکاروئ. چې یوه لومړۍ راشي، فعل سمدستي او بیا فاعل راځي: Dann gehe ich zur Arbeit.'),
    feedback: t('A sequence word can fill position 1; the conjugated verb must still be position 2.','Слово послідовності може займати першу позицію; відмінюване дієслово все одно має бути другим.','يمكن لكلمة التسلسل أن تشغل الموقع الأول؛ ويبقى الفعل المصرف في الموقع الثاني.','واژه توالی می‌تواند جایگاه اول را بگیرد؛ فعل صرف‌شده همچنان باید دوم باشد.','د ترتیب کلمه لومړی ځای نیولای شي؛ صرف شوی فعل بیا هم باید دویم وي.'),
    examples: [
      { de: 'Zuerst frühstücke ich. Dann fahre ich zur Arbeit.', meaning: t('First I have breakfast. Then I go to work.','Спочатку я снідаю. Потім їду на роботу.','أفطر أولاً. ثم أذهب إلى العمل.','اول صبحانه می‌خورم. بعد به محل کار می‌روم.','لومړی ناشته کوم. بیا کار ته ځم.') },
      { de: 'Später kauft er ein.', meaning: t('Later he goes shopping.','Пізніше він робить покупки.','لاحقاً يتسوق.','بعداً خرید می‌کند.','وروسته هغه سودا کوي.') },
    ],
    guided: [choice('G26-1','Choose the correct sentence.',['Dann ich lerne Deutsch.','Dann lerne ich Deutsch.','Dann Deutsch lerne ich.'],'Dann lerne ich Deutsch.'),choice('G26-2','___ koche ich. After that I cook.',['Danach','Aber','Denn'],'Danach')],
    independent: [fill('G26-3','Zuerst ___ wir Kaffee. (trinken)','trinken'),order('G26-4','Build the sentence.','Später ruft sie ihre Mutter an.',['ihre Mutter','Später','an.','ruft','sie'])],
  },
  {
    id: 'G27', number: 27, unit: 7, title: 'Perfekt with haben', shortTitle: 'ich habe gemacht',
    englishGuide: grammarEnglishGuides.G27,
    objective: t('Talk simply about completed past actions with haben + past participle.','Просто говорити про завершені минулі дії за допомогою haben + дієприкметник.','التحدث ببساطة عن أفعال ماضية مكتملة باستخدام haben + اسم المفعول.','صحبت ساده درباره کارهای تمام‌شده گذشته با haben + قسمت سوم فعل.','د haben + تېر ګډونوال په وسیله د بشپړو تېرو کړنو په اړه ساده خبرې کول.'),
    explanation: t('Conversational German often uses Perfekt: a conjugated form of haben in position 2 and the past participle at the end. Regular participles are often ge- + stem + -t: gemacht, gelernt, gekauft.','У розмовній німецькій часто вживають Perfekt: відмінюване haben на другій позиції та дієприкметник у кінці. Правильні дієприкметники часто мають ge- + основа + -t: gemacht, gelernt, gekauft.','تستخدم الألمانية المحكية Perfekt كثيراً: صيغة haben المصرفة في الموقع الثاني واسم المفعول في النهاية. غالباً يكون المنتظم ge- + الجذر + -t: gemacht، gelernt، gekauft.','در آلمانی گفتاری اغلب از Perfekt استفاده می‌شود: شکل صرف‌شده haben در جایگاه دوم و قسمت سوم فعل در پایان. شکل باقاعده اغلب ge- + بن + -t است: gemacht، gelernt، gekauft.','په محاوره آلماني کې Perfekt ډېر کارېږي: صرف شوی haben په دویم ځای او تېر ګډونوال په پای کې. باقاعده بڼه اکثر ge- + بن + -t ده: gemacht، gelernt، gekauft.'),
    feedback: t('Conjugate haben for the subject and place the past participle at the end.','Відмінюйте haben відповідно до підмета й ставте дієприкметник у кінці.','صرّف haben حسب الفاعل وضع اسم المفعول في النهاية.','haben را مطابق فاعل صرف کنید و قسمت سوم را در پایان بگذارید.','haben له فاعل سره سم صرف او تېر ګډونوال په پای کې کېږدئ.'),
    examples: [
      { de: 'Ich habe heute gearbeitet.', meaning: t('I worked today.','Я сьогодні працював/працювала.','عملت اليوم.','امروز کار کردم.','ما نن کار وکړ.') },
      { de: 'Was hast du gekauft?', meaning: t('What did you buy?','Що ти купив/купила?','ماذا اشتريت؟','چه خریدی؟','تا څه واخیستل؟') },
    ],
    guided: [choice('G27-1','Wir ___ Deutsch gelernt.',['haben','sind','hat'],'haben'),choice('G27-2','The participle of machen is …',['gemachen','gemacht','machtge'],'gemacht')],
    independent: [fill('G27-3','Er hat Kaffee ___. (kaufen)','gekauft'),order('G27-4','Build the sentence.','Ich habe meine Mutter angerufen.',['angerufen.','meine Mutter','Ich','habe'])],
  },
  {
    id: 'G28', number: 28, unit: 7, title: 'Perfekt with sein and A1 integration', shortTitle: 'ich bin gefahren',
    englishGuide: grammarEnglishGuides.G28,
    objective: t('Use sein with common movement/change verbs and combine core A1 structures.','Вживати sein з поширеними дієсловами руху/зміни та поєднувати основні структури A1.','استخدام sein مع أفعال الحركة/التغير الشائعة ودمج تراكيب A1 الأساسية.','استفاده از sein با فعل‌های رایج حرکت/تغییر و ترکیب ساختارهای اصلی A1.','له عامو حرکت/بدلون فعلونو سره sein کارول او د A1 بنسټیز جوړښتونه یوځای کول.'),
    explanation: t('Many common movement or change-of-state verbs use sein in the Perfekt: ich bin gegangen, wir sind gefahren, er ist angekommen. Bleiben is an important learned exception: Ich bin zu Hause geblieben. It does not describe movement to a new place, but it still uses sein. Keep the participle at the end.','Поширені дієслова руху або зміни стану в Perfekt вживають sein: ich bin gegangen, wir sind gefahren, er ist angekommen. Багато інших дієслів уживають haben. Дієприкметник стоїть у кінці.','تأخذ أفعال الحركة أو تغير الحالة الشائعة sein في Perfekt: ich bin gegangen، wir sind gefahren، er ist angekommen. أفعال كثيرة أخرى تأخذ haben. يبقى اسم المفعول في النهاية.','فعل‌های رایج حرکت یا تغییر حالت در Perfekt از sein استفاده می‌کنند: ich bin gegangen، wir sind gefahren، er ist angekommen. بسیاری فعل‌های دیگر haben می‌گیرند. قسمت سوم در پایان می‌آید.','عام حرکت یا حالت بدلون فعلونه په Perfekt کې sein اخلي: ich bin gegangen، wir sind gefahren، er ist angekommen. ډېر نور فعلونه haben اخلي. تېر ګډونوال په پای کې راځي.'),
    feedback: t('Use sein for the learned movement/change verbs, conjugate it for the subject, and keep the participle last.','Для вивчених дієслів руху/зміни вживайте sein, узгоджуйте його з підметом, а дієприкметник ставте в кінці.','استخدم sein مع أفعال الحركة/التغير المتعلمة، وصرّفه حسب الفاعل، وضع اسم المفعول أخيراً.','برای فعل‌های آموخته‌شده حرکت/تغییر از sein استفاده کنید، آن را با فاعل صرف کنید و قسمت سوم را آخر بگذارید.','د زده شوو حرکت/بدلون فعلونو لپاره sein وکاروئ، له فاعل سره یې صرف کړئ او تېر ګډونوال په پای کې کېږدئ.'),
    examples: [
      { de: 'Wir sind mit dem Zug gefahren.', meaning: t('We travelled by train.','Ми їхали потягом.','سافرنا بالقطار.','ما با قطار رفتیم.','موږ په اورګاډي کې لاړو.') },
      { de: 'Danach bin ich nach Hause gegangen.', meaning: t('After that I went home.','Після цього я пішов/пішла додому.','بعد ذلك ذهبت إلى المنزل.','بعد از آن به خانه رفتم.','له هغه وروسته کور ته لاړم.') },
    ],
    guided: [choice('G28-1','Mia ___ um acht angekommen.',['hat','ist','haben'],'ist'),choice('G28-2','Wir sind nach Berlin ___. (fahren)',['gefahrt','gefahren','gefahrtet'],'gefahren')],
    independent: [fill('G28-3','Ich ___ nach Hause gegangen.','bin'),order('G28-4','Build the sentence.','Am Samstag sind wir früh aufgestanden.',['wir','früh','Am Samstag','aufgestanden.','sind'])],
  },
];

export const grammarUi = {
  en: {
    objective: 'Learning objective', explanation: 'Simple explanation', examples: 'Everyday examples', guided: 'Guided practice', independent: 'Independent practice',
    choose: 'Choose one answer.', fill: 'Complete the sentence.', order: 'Put the words in order.', check: 'Check answer', clear: 'Clear', correct: 'Correct.', incorrect: 'Not quite.', answer: 'Correct answer', retry: 'Try again', completed: 'Lesson complete', draft: 'Draft learner-support text — qualified human review required.',
  },
  uk: {
    objective: 'Навчальна мета', explanation: 'Просте пояснення', examples: 'Повсякденні приклади', guided: 'Керована практика', independent: 'Самостійна практика',
    choose: 'Оберіть одну відповідь.', fill: 'Доповніть речення.', order: 'Розташуйте слова в правильному порядку.', check: 'Перевірити', clear: 'Очистити', correct: 'Правильно.', incorrect: 'Ще не зовсім.', answer: 'Правильна відповідь', retry: 'Спробуйте ще раз', completed: 'Урок завершено', draft: 'Чернетка тексту підтримки — потрібна перевірка кваліфікованим фахівцем.',
  },
  ar: {
    objective: 'هدف التعلم', explanation: 'شرح مبسط', examples: 'أمثلة يومية', guided: 'تدريب موجّه', independent: 'تمارين مستقلة',
    choose: 'اختر إجابة واحدة.', fill: 'أكمل الجملة.', order: 'رتّب الكلمات.', check: 'تحقق من الإجابة', clear: 'مسح', correct: 'صحيح.', incorrect: 'ليس تماماً.', answer: 'الإجابة الصحيحة', retry: 'حاول مرة أخرى', completed: 'اكتمل الدرس', draft: 'نص دعم أولي — يحتاج إلى مراجعة بشرية مؤهلة.',
  },
  fa: {
    objective: 'هدف یادگیری', explanation: 'توضیح ساده', examples: 'مثال‌های روزمره', guided: 'تمرین هدایت‌شده', independent: 'تمرین مستقل',
    choose: 'یک پاسخ را انتخاب کنید.', fill: 'جمله را کامل کنید.', order: 'واژه‌ها را مرتب کنید.', check: 'بررسی پاسخ', clear: 'پاک کردن', correct: 'درست است.', incorrect: 'هنوز درست نیست.', answer: 'پاسخ درست', retry: 'دوباره تلاش کنید', completed: 'درس کامل شد', draft: 'متن پشتیبانی پیش‌نویس است — بازبینی متخصص انسانی لازم است.',
  },
  ps: {
    objective: 'د زده کړې موخه', explanation: 'ساده تشریح', examples: 'ورځني مثالونه', guided: 'لارښود تمرین', independent: 'خپلواک تمرین',
    choose: 'یو ځواب وټاکئ.', fill: 'جمله بشپړه کړئ.', order: 'کلمې په ترتیب کړئ.', check: 'ځواب وګورئ', clear: 'پاکول', correct: 'سم دی.', incorrect: 'لا سم نه دی.', answer: 'سم ځواب', retry: 'بیا هڅه وکړئ', completed: 'درس بشپړ شو', draft: 'د ملاتړ متن مسوده ده — د وړ انسان بیاکتنې ته اړتیا لري.',
  },
} satisfies Record<GrammarLanguage, Record<string, string>>;

export const getUnitLessons = (unit: number) => grammarLessons.filter((lesson) => lesson.unit === unit);
export const getUnitReviewExercises = (unit: number) => {
  const lessons = getUnitLessons(unit);
  return [...lessons.map((lesson) => lesson.guided[0]), ...lessons.slice(0, 2).map((lesson) => lesson.independent[0])];
};
export const getFinalAssessmentExercises = () => grammarLessons.map((lesson, index) => lesson.independent[index % lesson.independent.length]);
