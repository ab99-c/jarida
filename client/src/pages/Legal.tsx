import { Link } from "wouter";
import { Scale, ArrowRight, ShieldCheck, AlertTriangle, Mail } from "lucide-react";

export default function Legal() {
  return (
    <div className="min-h-screen bg-[#f4ebd9] text-[#2a1d11] p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto bg-[#fdfaf3] border-2 border-[#cbb387] rounded-3xl shadow-xl p-6 sm:p-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6b5435] hover:text-[#3e2f1b] bg-[#ebdcc4] hover:bg-[#dfc8a5] px-3.5 py-1.5 rounded-full transition mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى جريدة الأفق 🗞️</span>
        </Link>

        {/* Title */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#ded0b6]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6b5435] to-[#45331e] flex items-center justify-center text-[#dcb45b] shadow-md flex-shrink-0">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2a1d11]">
              إخلاء المسؤولية وحقوق النشر والملكية الفكرية
            </h1>
            <p className="text-xs sm:text-sm text-[#705536] mt-1">
              الإطار القانوني لجريدة الأفق (Jarida Live) وسياستها تجاه مصادر الأخبار
            </p>
          </div>
        </div>

        {/* Highlight box */}
        <div className="bg-[#efe5d3] p-4 rounded-2xl border border-[#d8c7a6] flex items-start gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#45331e] leading-relaxed">
            <p className="font-bold mb-1">بيان قانوني عام:</p>
            <p>
              جريدة الأفق (Jarida Live) منصة إعلامية رقمية تفاعلية قائمة على تجميع ومراجعة وتلخيص المستجدات الإخبارية العامة (Revue de presse / News Aggregator). تحترم المنصة الملكية الفكرية لجميع الجرائد والمصادر الإعلامية وتلتزم بنسب كل مقال إلى ناشره الأصلي مع إتاحة روابط مباشرة للمواقع الأصلية.
            </p>
          </div>
        </div>

        {/* Articles */}
        <div className="space-y-6 text-xs sm:text-sm text-[#3a2918] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-base text-[#2a1d11]">
              1. الطبيعة القانونية للخدمة (Nature du Service)
            </h2>
            <p className="text-[#55412b]">
              تعتمد منصة «جريدة الأفق» على التقنيات الرقمية الحديثة لمحاكاة تجربة قراءة الجريدة الورقية ثلاثية الأبعاد، وتعمل بموجب مبدأ تجميع الخلاصات الإخبارية المفتوحة (Open RSS Feeds) والمصادر المتاحة للعموم بهدف تقديم عرض موجز للأحداث اليومية.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-[#2a1d11]">
              2. الامتثال للتشريعات وحقوق الملكية الفكرية (Loi 88.13 & Loi 2.00)
            </h2>
            <p className="text-[#55412b]">
              تخضع المنصة لمقتضيات القانون المغربي رقم 88.13 المتعلق بالصحافة والنشر، والقانون رقم 2.00 المتعلق بحقوق المؤلف والحقوق المجاورة، وتستند في نشر الملخصات إلى حق الاستشهاد والاقتباس ومراجعة الصحافة المنصوص عليه قانوناً.
            </p>
            <p className="text-[#55412b]">
              لا تدّعي المنصة أي ملكية للمقالات الأصلية أو الصور أو المواد الاستقصائية المنشورة، وتضع اسم المصدر بوضوح مع رابط مباشر يتيح للقارئ زيارة الموقع الرسمي للمصدر لمتابعة المقال الكامل.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-[#2a1d11]">
              3. التلخيص بالذكاء الاصطناعي والموجز الصوتي
            </h2>
            <p className="text-[#55412b]">
              الموجز الصوتي والمساعد الصوتي التفاعلي (Gemini Live) يعتمدان على تحليل وتلخيص الأفكار الرئيسية للمقالات بصوت إذاعي بالدارجة المغربية أو الفصحى لغرض التيسير والتثقيف، ولا يعتبر بديلاً عن التحقيق الصحفي الأصلي المنشور في موقعه الأم.
            </p>
          </section>

          <section className="space-y-2 bg-[#fbf3e6] p-4 rounded-2xl border border-[#e2d2b4]">
            <h2 className="font-bold text-base text-[#874b12] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ab6219]" />
              4. مسطرة الإشعار والسحب الفوري (Notice & Take-Down Policy)
            </h2>
            <p className="text-[#64421d] text-xs leading-relaxed">
              إذا كانت أي مؤسسة إعلامية أو ناشر أو صاحب حقوق فكرية يرغب في عدم إدراج ملخصات موقعه ضمن منصتنا، أو لديه أي استفسار قانوني حول مادة معينة، نلتزم بالسحب الفوري والتام خلال 24 ساعة بمجرد إشعارنا عبر البريد الإلكتروني:
            </p>
            <div className="flex items-center gap-2 pt-2 font-mono text-xs text-[#2a1d11] font-bold">
              <Mail className="w-4 h-4 text-[#6b5435]" />
              <span>البريد القانوني الرسمي: contact@jarida-live.ma</span>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-[#2a1d11]">
              5. حماية المعطيات الشخصية (قانون 09-08)
            </h2>
            <p className="text-[#55412b]">
              نلتزم بحماية خصوصية المستخدمين وفقاً لمقتضيات القانون رقم 09-08، حيث لا نقوم بجمع أو مشاركة أي بيانات شخصية، والتعليقات المنشورة تعبر عن آراء أصحابها وتخضع للمراقبة لمنع أي إساءة أو قذف أو تشهير.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#ded0b6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#705536] gap-3">
          <span>آخر تحديث: نونبر 2026 • جريدة الأفق الرقمية</span>
          <Link href="/" className="font-bold text-[#6b5435] hover:underline">
            الرجوع لقراءة الجريدة 🗞️
          </Link>
        </div>
      </div>
    </div>
  );
}
