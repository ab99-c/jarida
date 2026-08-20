# Project TODO - Social Sharing & Comments

- [ ] إضافة جدول `comments` في `drizzle/schema.ts` لدعم تعليقات القراء الحقيقية
- [ ] إنشاء ترحيل (Migration) SQL للجدول الجديد وتطبيقه عبر `webdev_execute_sql`
- [ ] إضافة إجراءات tRPC للتعليقات (`getComments` و `addComment`) في `server/routers.ts`
- [ ] تحديث `client/src/pages/Home.tsx` لتضمين أزرار مشاركة المقالات (WhatsApp, Facebook, X, Copy Link) وقسم التعليقات التفاعلي
- [ ] تشغيل اختبارات Vitest والـ Build للتأكد من سلامة الكود والخلو من الأخطاء
- [ ] حفظ checkpoint نهائي وتسليم النتيجة
