import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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

  if (!isVisible || !installEvent) return null;

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
    <aside className="jarida-install-prompt" dir="rtl" role="dialog" aria-label="تثبيت جريدة الأفق">
      <button type="button" className="jarida-install-close" onClick={dismiss} aria-label="إغلاق">
        <X className="h-4 w-4" />
      </button>
      <div className="jarida-install-copy">
        <strong>ثبّت الجريدة فالهاتف</strong>
        <span>خلي Jarida Live قريبة منك بحال تطبيق.</span>
      </div>
      <button type="button" className="jarida-install-button" onClick={install}>
        <Download className="h-4 w-4" />
        تثبيت
      </button>
    </aside>
  );
}
