import { X, ShieldCheck, Scale, FileText, AlertTriangle, Mail, ExternalLink } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[310] flex items-center justify-center p-3 sm:p-5"
      style={{
        background: "rgba(10, 8, 5, 0.85)",
        backdropFilter: "blur(6px)",
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-[#fdfaf3] border-2 border-[#cbb387] shadow-2xl text-right font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#ded0b6] bg-gradient-to-r from-[#fbf5e8] to-[#f4ebd9] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6b5435] to-[#45331e] flex items-center justify-center text-[#dcb45b] shadow-md flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2a1d11]">
                إخلاء المسؤولية وحقوق النشر والملكية الفكرية
              </h3>
              <p className="text-xs text-[#705536]">
                الإطار القانوني لجريدة الأفق (Jarida Live) ومصادر الأخبار
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#ebdcc4] hover:bg-[#dfc8a5] text-[#4a341e] flex items-center justify-center transition cursor-pointer flex-shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-[#3a2918] leading-relaxed">
          {/* Quick Summary Badge */}
          <div className="bg-[#efe5d3] p-3.5 rounded-xl border border-[#d8c7a6] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="text-[12px] text-[#45331e]">
              <p className="font-bold mb-1">خلاصة الإطار القانوني:</p>
              <p>
                جريدة الأفق منصة رقمية تعمل كـ <strong>«مجمّع وموجز صحفي رقمي» (Revue de presse / News Aggregator)</strong>. جميع المقالات الأصلية وحقوقها الفكرية والصحفية تعود للناشرين المذكورين أسفل كل مادة مع توفير روابطهم المباشرة.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2a1d11] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b5435]" />
              1. الطبيعة القانونية للمنصة (Nature du Service)
            </h4>
            <p className="text-[#55412b] pr-3.5">
              تُعنى منصة «جريدة الأفق» (Jarida Live) بتوفير تجربة قراءة تفاعلية ثلاثية الأبعاد للأخبار العامة، حيث تعمل المنصة كـ <strong>مجمّع رقمي للمستجدات الإخبارية (Agrégateur de flux d&apos;actualités)</strong> استناداً إلى الخلاصات الإخبارية المفتوحة (RSS Feeds) والمصادر الإعلامية العلنية.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2a1d11] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b5435]" />
              2. حقوق الملكية الفكرية وحق الاقتباس الصحفي (Droit d&apos;auteur & Revue de presse)
            </h4>
            <p className="text-[#55412b] pr-3.5">
              * تخضع المواد المنشورة لمقتضيات <strong>القانون المغربي رقم 88.13 المتعلق بالصحافة والنشر</strong> و<strong>القانون رقم 2.00 المتعلق بحقوق المؤلف والحقوق المجاورة</strong>، وتحديداً مبدأ حق الاقتباس والاستشهاد ومراجعة الصحافة (Droit de courte citation et de revue de presse).
            </p>
            <p className="text-[#55412b] pr-3.5">
              * المنصة لا تدّعي بأي شكل من الأشكال ملكية المقالات الأصلية أو الصور أو المواد الاستقصائية التابعة للمصادر الإعلامية (مثل: هسبريس، ميديا24، وكالة المغرب العربي للأنباء، الجزيرة نت، وغيرها)، بل تبرز بوضوح اسم المصدر أسفل كل خبر مع رابط مباشر يُحيل القارئ على موقعه الرسمي.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2a1d11] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b5435]" />
              3. التلخيص الذكي والمساعد الصوتي (Traitement IA & Synthèse)
            </h4>
            <p className="text-[#55412b] pr-3.5">
              الموجز الصوتي والمساعد الذكي (Gemini Live) يقدمان قراءة تلخيصية وموجزة للمستجدات بأسلوب حواري بهدف مساعدة القارئ على فهم السياق العام للأحداث دون المساس بجوهر العمل الصحفي الأصلي أو نسخه حرفياً.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5 bg-[#fbf3e6] p-3.5 rounded-xl border border-[#e2d2b4]">
            <h4 className="font-bold text-sm text-[#874b12] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#ab6219]" />
              4. مسطرة الإشعار والسحب الفوري للناشرين (Notice and Takedown Policy)
            </h4>
            <p className="text-[#64421d] text-[11px] leading-relaxed">
              انطلاقاً من احترامنا التام لجهود الناشرين والصحفيين والمؤسسات الإعلامية، إذا كانت مؤسستكم ترغب في عدم ظهور مقتطفات أخباركم على منصة جريدة الأفق، أو إذا كان لديكم أي تحفظ حول أي مادة، نلتزم بالسحب والاستثناء الفوري (Opt-out) خلال أقل من 24 ساعة دون أي قيد أو شرط:
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#2a1d11] font-bold">
              <Mail className="w-3.5 h-3.5 text-[#6b5435]" />
              <span>البريد المباشر للطلبات القانونية: contact@jarida-live.ma</span>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2a1d11] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b5435]" />
              5. حماية المعطيات الشخصية (قانون 09-08)
            </h4>
            <p className="text-[#55412b] pr-3.5">
              تلتزم جريدة الأفق باحترام خصوصية زوارها ومستخدمي تطبيقها، حيث لا نقوم بجمع أو معالجة أو بيع أي بيانات شخصية، والتعليقات المتاحة للقراء تخضع لضوابط احترام القانون وعدم التشهير أو الإساءة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#ded0b6] bg-[#fbf5e8] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#705536]">
            آخر تحديث: نونبر 2026 • جريدة الأفق الرقمية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#6b5435] hover:bg-[#533f26] text-[#fdfaf3] font-bold text-xs transition cursor-pointer shadow-sm"
          >
            إغلاق ومتابعة التصفح
          </button>
        </div>
      </div>
    </div>
  );
}
