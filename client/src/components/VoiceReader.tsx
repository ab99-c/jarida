import { useState, useRef, useEffect, useCallback } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, Loader2, Volume2, X, Radio, PhoneOff, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

interface VoiceReaderProps {
  articleTitle?: string;
  articleContent?: string;
  className?: string;
}

type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "error";

export default function VoiceReader({
  articleTitle,
  articleContent,
  className = "",
}: VoiceReaderProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusRef = useRef<VoiceStatus>("idle");
  statusRef.current = status;

  // Track whether the current voice session is strictly active
  const isSessionActiveRef = useRef(false);

  // Session & Audio references
  const sessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextScheduledTimeRef = useRef<number>(0);

  const stopAllScheduledAudio = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop(0);
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== "closed") {
      nextScheduledTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextScheduledTimeRef.current = 0;
    }
  }, []);

  // Complete hard-kill cleanup: guarantees 100% shutdown of microphone, audio, and websocket
  const cleanup = useCallback(() => {
    isSessionActiveRef.current = false;

    // 1. Immediately close Live API session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {}
      sessionRef.current = null;
    }

    // 2. Immediately stop all microphone tracks so mic icon on phone turns OFF
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch {}
      micStreamRef.current = null;
    }

    // 3. Disconnect and close input Web Audio
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.onaudioprocess = null;
        processorNodeRef.current.disconnect();
      } catch {}
      processorNodeRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== "closed") {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    // 4. Stop and close output Web Audio
    stopAllScheduledAudio();
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== "closed") {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    setStatus("idle");
  }, [stopAllScheduledAudio]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Convert Base64 24kHz PCM to AudioBuffer and schedule smooth sequential playback
  const playAudioChunk = useCallback(
    (base64Data: string) => {
      if (!isSessionActiveRef.current) return;
      try {
        const ctx = outputAudioCtxRef.current;
        if (!ctx || ctx.state === "closed") return;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const numSamples = Math.floor(bytes.byteLength / 2);
        if (numSamples === 0) return;

        const dataView = new DataView(bytes.buffer);
        const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
          const int16 = dataView.getInt16(i * 2, true);
          channelData[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
        }

        if (!isSessionActiveRef.current) return;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        if (nextScheduledTimeRef.current < currentTime) {
          nextScheduledTimeRef.current = currentTime;
        }
        const startTime = nextScheduledTimeRef.current;
        source.start(startTime);
        nextScheduledTimeRef.current = startTime + audioBuffer.duration;

        activeSourcesRef.current.push(source);
        source.onended = () => {
          const idx = activeSourcesRef.current.indexOf(source);
          if (idx !== -1) activeSourcesRef.current.splice(idx, 1);
          if (activeSourcesRef.current.length === 0 && statusRef.current === "speaking" && isSessionActiveRef.current) {
            setStatus("listening");
          }
        };
      } catch (err) {
        console.error("[VoiceReader] Error playing audio chunk:", err);
      }
    },
    [],
  );

  const startVoiceSession = async () => {
    setErrorMessage("");
    setStatus("connecting");
    isSessionActiveRef.current = true;

    try {
      // 1. Immediately request microphone
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Fetch ephemeral token in parallel
      const tokenUrl = `${getApiBaseUrl()}/api/gemini-token`;
      const tokenPromise = fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      let stream: MediaStream;
      let tokenRes: Response;
      try {
        [stream, tokenRes] = await Promise.all([streamPromise, tokenPromise]);
        if (!isSessionActiveRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = stream;
      } catch (micErr: any) {
        if (!isSessionActiveRef.current) return;
        if (!micStreamRef.current) {
          throw new Error("يرجى السماح بالوصول إلى الميكروفون لبدء المحادثة الصوتية.");
        }
        throw micErr;
      }

      let tokenJson: any = null;
      try {
        const text = await tokenRes.text();
        if (!isSessionActiveRef.current) return;
        tokenJson = JSON.parse(text);
      } catch {
        if (!isSessionActiveRef.current) return;
        throw new Error("تعذر الاتصال بخادم الصوت. يرجى التأكد من اتصال الإنترنت وحاول مجدداً.");
      }

      if (!tokenRes.ok || !tokenJson?.token) {
        if (!isSessionActiveRef.current) return;
        throw new Error("المساعد الصوتي غير متوفر حالياً. يرجى المحاولة لاحقاً.");
      }

      const token = tokenJson.token;

      // 3. Connect to Gemini Multimodal Live API using gemini-3.8-live
      const ai = new GoogleGenAI({
        apiKey: token,
        apiVersion: "v1alpha",
      });

      const promptInstruction = `أنت المذيع والمحلل الصوتي لجريدة الأفق (Jarida Live). تحدث بأسلوب إذاعي مغربي واضح ومهني ومشوق، بالدارجة المغربية المفهومة أو العربية الفصحى السلسة. ناقش واشرح المقال الحالي الذي يقرأه المستخدم:
العنوان: ${articleTitle || "بدون عنوان"}
المحتوى: ${articleContent || "مقال من جريدة الأفق الرقمية"}`;

      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: promptInstruction }],
          },
        },
        callbacks: {
          onopen: () => {
            console.log("[VoiceReader] Gemini Live Session Connected.");
          },
          onmessage: (msg: any) => {
            if (!isSessionActiveRef.current) return;
            const serverContent = msg?.serverContent;

            // Handle interruption: clear ongoing playback
            if (serverContent?.interrupted) {
              stopAllScheduledAudio();
              setStatus("listening");
            }

            // Receive 24kHz audio parts
            if (serverContent?.modelTurn?.parts) {
              setStatus("speaking");
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data);
                }
              }
            }
          },
          onerror: (err: any) => {
            console.error("[VoiceReader] Session error:", err);
            if (isSessionActiveRef.current) {
              setErrorMessage("حدث انقطاع في الاتصال الصوتي. يمكنك المحاولة مجدداً.");
              cleanup();
            }
          },
          onclose: (e: any) => {
            console.log("[VoiceReader] Session closed:", e);
            if (isSessionActiveRef.current) {
              cleanup();
            }
          },
        },
      });

      if (!isSessionActiveRef.current) {
        try { session.close(); } catch {}
        return;
      }

      // Store active session reference safely AFTER connect has resolved
      sessionRef.current = session;
      setStatus("speaking");

      // 4. Capture and stream 16kHz PCM audio from microphone to Gemini
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx();
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === "suspended") {
        await inputCtx.resume();
      }

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isSessionActiveRef.current || !sessionRef.current) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        let pcmData16k: Float32Array;
        if (inputCtx.sampleRate !== 16000) {
          const ratio = inputCtx.sampleRate / 16000;
          const newLength = Math.round(inputChannelData.length / ratio);
          pcmData16k = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const originalIndex = Math.min(Math.round(i * ratio), inputChannelData.length - 1);
            pcmData16k[i] = inputChannelData[originalIndex];
          }
        } else {
          pcmData16k = inputChannelData;
        }

        const pcm16 = new Int16Array(pcmData16k.length);
        for (let i = 0; i < pcmData16k.length; i++) {
          const s = Math.max(-1, Math.min(1, pcmData16k[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = window.btoa(binary);

        try {
          if (isSessionActiveRef.current && sessionRef.current) {
            sessionRef.current.sendRealtimeInput({
              audio: {
                data: base64Audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          }
        } catch (sendErr) {
          console.warn("[VoiceReader] Failed to send realtime audio:", sendErr);
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // 5. Prompt the AI Anchor immediately to speak first and greet the listener in Moroccan Darija!
      try {
        session.sendRealtimeInput({
          text: `أنت المذيع الصوتي لجريدة الأفق. تحدث الآن فوراً بصوتك المسموع بالدارجة المغربية ورحب بالقارئ بحرارة، وقدم له في جملتين مختصرتين ملخص هذا الخبر: "${articleTitle || "مقال اليوم"}"، واطلب منه رأيه أو سؤاله لنبدأ النقاش.`,
        });
      } catch (greetErr) {
        console.warn("[VoiceReader] Initial greeting trigger error:", greetErr);
      }
    } catch (err: any) {
      console.error("[VoiceReader] Initialization failed:", err);
      if (isSessionActiveRef.current) {
        setErrorMessage(err?.message || "فشل الاتصال بالمساعد الصوتي.");
        cleanup();
      }
    }
  };

  const handleOpenModal = async () => {
    // Stops any ongoing synthesis in the browser before starting AI conversation
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Eagerly unlock output audio context during the user click gesture
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === "closed") {
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (outputAudioCtxRef.current.state === "suspended") {
        await outputAudioCtxRef.current.resume();
      }
    } catch (audioErr) {
      console.warn("[VoiceReader] Could not unlock audio context during click:", audioErr);
    }

    setIsModalOpen(true);
    startVoiceSession();
  };

  const handleCloseModal = () => {
    cleanup();
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={`relative inline-flex items-center gap-1 ${className}`} dir="rtl">
        {/* Trigger Button: Strictly requires explicit user click to open */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="jarida-focusable flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-sans shadow-xs bg-[#f5e6cc] text-[#554a32] hover:bg-[#ebd8b7] hover:text-black border border-[#d3c49b]"
          title="محادثة صوتية حية ومباشرة مع مذيع الأفق الذكي حول المقال"
          aria-label="ناقش الخبر صوتياً"
        >
          <Mic className="w-3.5 h-3.5 text-[#6b5435]" />
          <span className="font-medium">🎙️ ناقش الخبر صوتياً</span>
        </button>
      </div>

      {/* Dedicated Interactive Voice Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
          dir="rtl"
        >
          <div
            className="bg-[#2a1d13] text-[#f4ebdc] w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#b48d56]/70 overflow-hidden flex flex-col p-5 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1b120a] border border-[#a8824f]/40 text-[#eddcc4] hover:text-white hover:bg-[#3d2716] transition flex items-center justify-center cursor-pointer shadow-md"
              aria-label="إغلاق الصوت"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#3d2716] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif text-[#fbf6ec]">المذيع الصوتي لجريدة الأفق</h3>
                <p className="text-[11px] text-[#bda482]">نقاش صوتي حي بالذكاء الاصطناعي (Gemini Live)</p>
              </div>
            </div>

            {/* Article Context */}
            <div className="bg-[#1c130b] border border-[#7a5932]/60 rounded-xl p-3 mb-4 text-xs">
              <span className="text-[#d4af37] font-bold block mb-1">موضوع النقاش:</span>
              <p className="text-[#ded1be] line-clamp-2 leading-relaxed font-serif">
                {articleTitle || "المقال اليومي لجريدة الأفق"}
              </p>
            </div>

            {/* Live Interactive State Display */}
            <div className="flex flex-col items-center justify-center py-5 bg-[#170f08] border border-[#523920] rounded-xl mb-4 text-center">
              {status === "connecting" && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                  <span className="text-xs font-bold text-[#e8dcbf]">جاري فتح الاتصال بالمذيع الصوتي...</span>
                  <span className="text-[10px] text-[#9c8466]">يرجى الانتظار بضع ثوانٍ ليبدأ المذيع بالكلام</span>
                </div>
              )}

              {status === "speaking" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#3d2716] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-lg animate-pulse">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-[#fbf6ec]">المذيع يتحدث الآن... 🎙️</span>
                  <span className="text-[11px] text-[#d8c2a3]">استمع إليه أو تحدث في أي وقت لمقاطعته والرد</span>
                </div>
              )}

              {status === "listening" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <div className="w-12 h-12 rounded-full bg-emerald-900/60 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg relative">
                      <Mic className="w-6 h-6" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-300">الميكروفون مفتوح: تفضل بالتحدث...</span>
                  <span className="text-[11px] text-[#d8c2a3]">المذيع يستمع إليك بالدارجة المغربية أو العربية</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-2 px-3 text-red-400">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <span className="text-xs font-bold">{errorMessage || "تعذر إكمال الاتصال الصوتي."}</span>
                  <button
                    type="button"
                    onClick={startVoiceSession}
                    className="mt-1 px-3 py-1 bg-[#3d2716] text-[#eddcc4] border border-[#a8824f] text-[11px] rounded-lg hover:bg-[#52341d] cursor-pointer"
                  >
                    إعادة المحاولة 🔄
                  </button>
                </div>
              )}

              {status === "idle" && (
                <div className="flex flex-col items-center gap-2">
                  <Mic className="w-8 h-8 text-[#a88657]" />
                  <span className="text-xs text-[#bda482]">جاهز لبدء المحادثة الصوتية</span>
                </div>
              )}
            </div>

            {/* Obvious, Full-Stop Exit Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer border border-red-500/50"
            >
              <PhoneOff className="w-4 h-4" />
              <span>إنهاء المحادثة وإغلاق الصوت فوراً (Stop)</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
