import { useState } from "react";
import { Download, X, Smartphone, ShieldCheck, CheckCircle2, ExternalLink } from "lucide-react";

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APK_DOWNLOAD_URL = "https://github.com/ab99-c/jarida/releases/latest/download/Jarida-Live.apk";

export default function ApkDownloadModal({ isOpen, onClose }: ApkDownloadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4"
      style={{
        background: "rgba(10, 8, 5, 0.82)",
        backdropFilter: "blur(5px)",
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#fdfaf3] border-2 border-[#cbb387] p-5 sm:p-6 shadow-2xl text-right font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#ebdcc4] hover:bg-[#dfc8a5] text-[#4a341e] flex items-center justify-center transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#233c30] to-[#12231b] flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Smartphone className="w-6 h-6 text-[#dcb45b]" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-[#2a1d11]">
              تطبيق جريدة الأفق (APK)
            </h3>
            <p className="text-xs text-[#705536]">
              تطبيق أندرويد متكامل للأخبار والمساعد الصوتي
            </p>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 mb-5 bg-[#f5ede0] p-3 rounded-xl border border-[#ded0b6] text-xs text-[#3a2918]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>تصفح أسرع مع تقليب واقعي لصفحات الجريدة</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>محادثة صوتية حية مع المذيع الذكي ومناقشة الأخبار</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>خزانة الأرشيف والأعداد السابقة بحجم خفيف</span>
          </div>
        </div>

        {/* Download Direct APK Button */}
        <a
          href={APK_DOWNLOAD_URL}
          download="Jarida-Live.apk"
          className="w-full mb-3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#233c30] to-[#2f4f3e] hover:from-[#1b3026] hover:to-[#243d30] text-[#fbf6ec] font-bold text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer group"
        >
          <Download className="w-4 h-4 text-[#dcb45b] group-hover:translate-y-0.5 transition" />
          <span>تحميل ملف APK للأندرويد (تنزيل مباشر)</span>
        </a>

        {/* Installation Instructions */}
        <div className="border-t border-[#e2d5bd] pt-3 text-[11px] text-[#6b5235] space-y-1 leading-relaxed">
          <p className="font-bold text-[#2a1d11] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8f6d33]" />
            خطوات التثبيت السريعة:
          </p>
          <p>1. اضغط على زر التحميل في الأعلى لتبدأ عملية التنزيل.</p>
          <p>2. افتح الملف بعد اكتماله، وإذا طلب المتصفح إذناً، اضغط «السماح بتثبيت التطبيقات من هذا المصدر».</p>
          <p>3. اضغط «تثبيت»، وسيظهر تطبيق جريدة الأفق مباشرة على شاشة هاتفك.</p>
        </div>
      </div>
    </div>
  );
}
