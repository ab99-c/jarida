import { useState, useEffect } from "react";
import { Sliders, Sun, Moon, BookOpen, Type, X, Check } from "lucide-react";

export type ReaderTheme = "sepia" | "light" | "dark";
export type FontSize = "normal" | "large" | "xlarge";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  lineHeight: "compact" | "relaxed";
}

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: ReaderSettings) => void;
}

const STORAGE_KEY = "jarida_reader_custom_settings_v1";

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "sepia",
  fontSize: "normal",
  lineHeight: "relaxed",
};

export function getSavedReaderSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReaderSettings(settings: ReaderSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export default function ReaderSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: ReaderSettingsModalProps) {
  if (!isOpen) return null;

  const handleThemeChange = (theme: ReaderTheme) => {
    const next = { ...settings, theme };
    onUpdateSettings(next);
    saveReaderSettings(next);
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    const next = { ...settings, fontSize };
    onUpdateSettings(next);
    saveReaderSettings(next);
  };

  const handleLineHeightChange = (lineHeight: "compact" | "relaxed") => {
    const next = { ...settings, lineHeight };
    onUpdateSettings(next);
    saveReaderSettings(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-[#faf5eb] text-[#2c2416] w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#bfa87a] overflow-hidden flex flex-col p-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1b120a] border border-[#a8824f]/40 text-[#eddcc4] hover:text-white hover:bg-[#3d2716] transition flex items-center justify-center cursor-pointer shadow-md"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#42341d] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base font-serif text-[#2c2416]">راحة القراءة والخط</h3>
            <p className="text-[11px] text-[#7a6446]">تخصيص مظهر الجريدة وحجم الخط حسب رغبتك</p>
          </div>
        </div>

        {/* Section 1: Themes */}
        <div className="mb-4">
          <label className="text-xs font-bold text-[#42341d] block mb-2 font-serif">
            مظهر وورق الجريدة:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleThemeChange("sepia")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-xs ${
                settings.theme === "sepia"
                  ? "bg-[#eedfc5] border-[#8c7348] ring-2 ring-[#8c7348] font-bold text-[#3d2716]"
                  : "bg-[#f5ebd7] border-[#d8c8a5] text-[#5c4930] hover:bg-[#ebdec2]"
              }`}
            >
              <BookOpen className="w-5 h-5 text-[#8c7348]" />
              <span>ورق أصيل</span>
              {settings.theme === "sepia" && <Check className="w-3.5 h-3.5 text-[#8c7348]" />}
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-xs ${
                settings.theme === "light"
                  ? "bg-white border-[#8c7348] ring-2 ring-[#8c7348] font-bold text-black"
                  : "bg-white/70 border-[#d8c8a5] text-[#555] hover:bg-white"
              }`}
            >
              <Sun className="w-5 h-5 text-amber-600" />
              <span>أبيض عصري</span>
              {settings.theme === "light" && <Check className="w-3.5 h-3.5 text-[#8c7348]" />}
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-xs ${
                settings.theme === "dark"
                  ? "bg-[#1f1913] border-[#d4af37] ring-2 ring-[#d4af37] font-bold text-[#eddcc4]"
                  : "bg-[#2d2217] border-[#55402a] text-[#bda88e] hover:bg-[#382b1d]"
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>ليلي فاخر</span>
              {settings.theme === "dark" && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
            </button>
          </div>
        </div>

        {/* Section 2: Font Size */}
        <div className="mb-4">
          <label className="text-xs font-bold text-[#42341d] block mb-2 font-serif">
            حجم خط المقالات:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFontSizeChange("normal")}
              className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                settings.fontSize === "normal"
                  ? "bg-[#42341d] text-white border-[#42341d] font-bold shadow-xs"
                  : "bg-white border-[#d8c8a5] text-[#42341d] hover:bg-[#faf4ea]"
              }`}
            >
              عادي (A)
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange("large")}
              className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                settings.fontSize === "large"
                  ? "bg-[#42341d] text-white border-[#42341d] font-bold shadow-xs"
                  : "bg-white border-[#d8c8a5] text-[#42341d] hover:bg-[#faf4ea]"
              }`}
            >
              كبير (A+)
            </button>
            <button
              type="button"
              onClick={() => handleFontSizeChange("xlarge")}
              className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                settings.fontSize === "xlarge"
                  ? "bg-[#42341d] text-white border-[#42341d] font-bold shadow-xs"
                  : "bg-white border-[#d8c8a5] text-[#42341d] hover:bg-[#faf4ea]"
              }`}
            >
              كبير جداً (A++)
            </button>
          </div>
        </div>

        {/* Section 3: Line Spacing */}
        <div>
          <label className="text-xs font-bold text-[#42341d] block mb-2 font-serif">
            تباعد الأسطر:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLineHeightChange("relaxed")}
              className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                settings.lineHeight === "relaxed"
                  ? "bg-[#42341d] text-white border-[#42341d] font-bold shadow-xs"
                  : "bg-white border-[#d8c8a5] text-[#42341d] hover:bg-[#faf4ea]"
              }`}
            >
              مريح للقراءة
            </button>
            <button
              type="button"
              onClick={() => handleLineHeightChange("compact")}
              className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-xs ${
                settings.lineHeight === "compact"
                  ? "bg-[#42341d] text-white border-[#42341d] font-bold shadow-xs"
                  : "bg-white border-[#d8c8a5] text-[#42341d] hover:bg-[#faf4ea]"
              }`}
            >
              مدمج (كثافة أعلى)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
