## ملاحظات التخطيط

المطلوب هو جعل حركة الورق في Jarida Live أقرب إلى المرجع الخارجي `jarida-immersive.vercel.app`، مع الحفاظ على RSS اليومي والتعليقات والمشاركة وdual-page على سطح المكتب وsingle-page على الهاتف.

المهارات ذات الصلة تؤكد أن الحركة يجب أن تكون sheet-by-sheet من محور الوسط، بوجه أمامي وخلفي، perspective، shadows، edge curl، reduced-motion، والتحقق البصري قبل/أثناء/بعد الحركة. كما يجب عدم تغيير مسار الأتمتة أو محتوى الأخبار أثناء تعديل الواجهة.

التنفيذ الحالي يحرّك طبقة `.jarida-turning-page` كاملة بـ`rotateY(±180deg)` خلال 980ms، ويبدّل المحتوى في 490ms. المطلوب في الخطة هو تقييم إن كان المرجع يحتاج ورقة فعلية منفصلة، ثم تنفيذ sheet choreography مع z-index عند المنتصف، crease/shadow overlays، وحركة لمس/سحب قابلة للإيقاف، مع اختبارات timing وresponsive وproduction.

## المصدر الخارجي

الرابط الذي قدمه المستخدم للمقارنة هو: https://jarida-immersive.vercel.app/

البحث النصي العام لم يعثر على وصف موثوق خاص بهذا المشروع، لذلك لا توجد ادعاءات عن تفاصيله الداخلية. المقارنة العملية مبنية على طلب المستخدم وعلى نموذج sheet-by-sheet الموجود في `/home/ubuntu/upload/flipbook-jarida_1.html`، مع التحقق البصري من preview المحلي بعد التعديل.

## التحقق البصري المحلي

لقطة desktop بدقة 1280×720 أظهرت بقاء masthead، الـspine المركزي، footer، وأزرار التحكم مستقرة بلا overflow. لقطة mobile بدقة 375×812 أظهرت single-page داخل إطار الجريدة، تحكم علوي ظاهر، تعليمات السحب، وأزرار السابق/التالي بدون قص أو انهيار في التخطيط. لقطات screenshot لا تشغل click تفاعلي، لذلك بقي تحقق منتصف الحركة والنهاية معتمداً على Vitest وعقد التوقيت إلى جانب CSS.

## التحقق البصري النهائي

لقطة desktop الأخيرة حافظت على masthead والـspine والصفحة الثنائية داخل إطار الجريدة، مع ظهور المحتوى في spread بدون overflow. لقطة mobile الأخيرة حافظت على single-page، أزرار التنقل، تعليمات السحب، والـheader داخل viewport 375×812. وجود طلبات RSS timeout في سجل الخادم لم يكسر الواجهة؛ التطبيق عرض حالة التحديث بدلاً من أخبار قديمة.

## دليل تفاعلي before/during

اختبار Chromium فعلي على edition mock محلي (لا يغير RSS أو الإنتاج) ضغط زر `التالي` ونجح في إثبات: قبل الحركة لا توجد `.jarida-turning-page`، وبعد 140ms توجد طبقة واحدة `is-turning` باسم animation `jarida-immersive-page-turn` وبـ3D transform فعلي `matrix3d(...)`. لقطة `before.png` أظهرت spread ثنائي الصفحات، ولقطة `during.png` أظهرت الورقة واقفة قرب الـspine مع ظل وحافة مضاءة.

## تحقق Vercel بعد رفع GitHub

أداة ربط Vercel الحالية أظهرت team واحدة `team_1C1SXO5DZU7S5X3IUCeTyFvU` مرتبطة بمشروع GitHub مختلف هو `ab99-c/Azilal-Tourism`، ولم تُظهر مشروع Jarida. لذلك سيعتمد التحقق على فحص رابط الإنتاج `https://jarida-tan.vercel.app/` وعلى مطابقة محتوى الـbundle والرؤوس، مع توضيح أن معلومات مشروع Vercel المرتبط غير متاحة عبر هذا الربط.

## تحقق الحركة البطيئة RTL

بعد تغيير الدورة إلى 1400ms مع midpoint عند 700ms، سجّل Chromium وجود overlay واحد عند 140ms مع `animationName=jarida-immersive-page-turn` و`matrix3d` يحوي دوراناً سالباً للـnext، ثم ظهرت الصفحة الثالثة مع بقاء overlay في منتصف الدورة، واختفى overlay بعد 1400ms. لقطة during أظهرت الورقة متجهة من جهة الـspine نحو الصفحة اليمنى، ولقطة after أظهرت استقرار الصفحة الجديدة والتعليقات دون بقايا طبقة الحركة. على mobile صار محور next هو `left center` ومحور prev هو `right center` بدل `center center` لتفادي طيّ الصفحة من الوسط.

## نتيجة إصلاح RTL البطيء

تم تحويل دورة الحركة من 980ms إلى 1400ms، مع تبديل المحتوى عند 700ms. حركة next تستعمل `rotateY(-...)` من الورقة اليمنى نحو اليسار، وprev تستعمل الاتجاه المعاكس. على mobile صار next مربوطاً بـ`left center` وprev بـ`right center` حتى لا تنطوي الصفحة من الوسط. تحقق Chromium سجّل overlay فعالاً عند 140ms، `matrix3d` بدوران سالب، ظهور الصفحة الجديدة عند midpoint، واختفاء overlay بعد 1400ms. `pnpm check` و13 اختباراً وproduction build نجحت؛ ظهرت فقط تحذيرات RSS الخارجية المتقطعة وchunk أكبر من 500KB.

## تحقق شامل للحركة والتفاعل

اختبار Chromium الشامل نجح على desktop وmobile. سجّل next وprev كـ`jarida-immersive-page-turn` و`jarida-immersive-page-turn-prev` مع `matrix3d` غير identity بعد 260ms، وسجّل auto-flip متقدماً بعد أول interval. كما تحقّق من ظهور الأخبار mock، وجود أزرار واتساب وفيسبوك ونسخ الرابط، وظهور التعليقات؛ المقالات RSS ذات IDs النصية أبقت حقول التعليق معطلة كما هو متوقع لحماية API الرقمي. أُنشئت لقطات desktop/mobile قبل وأثناء وبعد الحركة داخل `/tmp/jarida-immersive-evidence`.

## تحقق RTL كامل قبل الإغلاق

تم تشغيل سكريبت Chromium شامل بعد ضبط الدورة إلى 1400ms. على desktop وmobile، سجّل next وprev animation names صحيحة و`matrix3d` غير identity عند 260ms، مع لقطات `*-before.png` و`*-during.png` و`*-after.png` لكل مسار. auto-flip تقدّم من الإصدار الأول بعد interval، وظهرت الأخبار، أزرار واتساب وفيسبوك ونسخ الرابط، وقسم التعليقات؛ تم النقر على نسخ الرابط والتحقق من تعطيل حقول التعليق للمقالات RSS النصية. لا توجد snap أو face inversion في المسارات المقاسة.

## إثبات الاتجاه وعدم القفز

أصبح سكريبت Chromium يلتقط ويثبت صراحةً `before/during/after` لكل من `desktop-next` و`desktop-prev` و`mobile-next` و`mobile-prev`. أثناء `during` يشترط `matrix3d` غير identity، ويفحص إشارات مصفوفة الدوران: next يملك `matrix[2] > 0` و`matrix[8] < 0`، وprev العكس، كما يتحقق من `backface-visibility: hidden` للوجهين. النتيجة الأخيرة نجحت لكل المسارات، وauto-flip تقدّم، وظهرت أزرار المشاركة والتعليقات وجلب الأخبار.
