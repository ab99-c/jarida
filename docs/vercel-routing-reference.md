# مرجع إصلاح Vercel routing

المراجع الرسمية التي تمت قراءتها بتاريخ 22 غشت 2026:

- https://vercel.com/kb/guide/using-express-with-vercel
- https://vercel.com/docs/routing/rewrites

يوضح دليل Express الرسمي أن ملف `api/index.ts` يمكن أن يكون نقطة تشغيل Express على Vercel. وتوضح وثائق rewrites أن wildcard syntax الصحيح هو `:path*` عندما نحتاج الحفاظ على بقية المسار، وأن rewrite يغير الوجهة الداخلية مع إبقاء الرابط الظاهر كما هو.

في Jarida، الواجهة الثابتة كانت تعمل، لكن `/api/trpc/*` كان يرجع 500 عند استعمال rewrite القديم الذي يحوّل كل `/api/(.*)` إلى `/api`. إزالة rewrite أعطت 404، لذلك يحتاج التطبيق إلى route serverless wildcard صريح لمسارات `/api/*` مع إبقاء SPA rewrite مستثنى من API.
