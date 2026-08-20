# Project TODO - Social Sharing & Comments

- [x] إضافة جدول `comments` في `drizzle/schema.ts` لدعم تعليقات القراء الحقيقية
- [x] إنشاء ترحيل (Migration) SQL للجدول الجديد وتطبيقه عبر `webdev_execute_sql`
- [x] إضافة إجراءات tRPC للتعليقات (`getComments` و `addComment`) في `server/routers.ts`
- [x] تحديث `client/src/pages/Home.tsx` لتضمين أزرار مشاركة المقالات (WhatsApp, Facebook, X, Copy Link) وقسم التعليقات التفاعلي
- [x] تشغيل اختبارات Vitest والـ Build للتأكد من سلامة الكود والخلو من الأخطاء
- [x] حفظ checkpoint نهائي وتسليم النتيجة
