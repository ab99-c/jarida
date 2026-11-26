import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { isInstalledAppOrApk } from "@/lib/apiBase";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If running inside APK or standalone mode, never prompt for installation or APK download
    if (isInstalledAppOrApk()) return;
    if (window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)) return;
    if (window.localStorage.getItem("jarida-pwa-dismissed") === "1") return;

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!isVisible || !installEvent || isInstalledAppOrApk()) return null;

  const install = async () => {
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setIsVisible(false);
    setInstallEvent(null);
  };

  const dismiss = () => {
    window.localStorage.setItem("jarida-pwa-dismissed", "1");
    setIsVisible(false);
    setInstallEvent(null);
  };

  return (
    <aside className="jarida-install-prompt relative pl-10" dir="rtl" role="dialog" aria-label="تثبيت جريدة الأفق">
      <button
        type="button"
        className="jarida-install-close absolute top-2 left-2 hover:bg-white/20 transition rounded-full p-1"
        onClick={dismiss}
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="jarida-install-copy">
        <strong>ثبّت الجريدة فالهاتف</strong>
        <span>خلي Jarida Live قريبة منك بحال تطبيق.</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" className="jarida-install-button" onClick={install}>
          <Download className="h-3.5 w-3.5" />
          تثبيت فوري
        </button>
        <a
          href="https://github.com/ab99-c/jarida/releases/latest/download/Jarida-Live.apk"
          download="Jarida-Live.apk"
          className="jarida-install-button bg-[#3d2716] text-[#eddcc4] hover:bg-[#52341d] border border-[#a8824f]/60 text-xs py-1 px-2 rounded font-bold flex items-center gap-1"
        >
          <span>تحميل APK 📱</span>
        </a>
      </div>
    </aside>
  );
}
