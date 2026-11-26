import { useState, useRef, useEffect, useCallback } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, Loader2, Square, Volume2, X, Sparkles, AlertCircle } from "lucide-react";
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

  const statusRef = useRef<VoiceStatus>("idle");
  statusRef.current = status;

  // Session & Audio references
  const sessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextScheduledTimeRef = useRef<number>(0);

  const getOutputAudioContext = useCallback(() => {
    if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    return outputAudioCtxRef.current;
  }, []);

  const stopAllScheduledAudio = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextScheduledTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextScheduledTimeRef.current = 0;
    }
  }, []);

  const cleanup = useCallback(() => {
    // 1. Close Live API session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {}
      sessionRef.current = null;
    }

    // 2. Stop microphone tracks
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      micStreamRef.current = null;
    }

    // 3. Disconnect and close input Web Audio
    if (processorNodeRef.current) {
      try {
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
      try {
        const ctx = getOutputAudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
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

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextScheduledTimeRef.current);
        source.start(startTime);
        nextScheduledTimeRef.current = startTime + audioBuffer.duration;

        activeSourcesRef.current.push(source);
        source.onended = () => {
          const idx = activeSourcesRef.current.indexOf(source);
          if (idx !== -1) activeSourcesRef.current.splice(idx, 1);
          if (activeSourcesRef.current.length === 0 && statusRef.current === "speaking") {
            setStatus("listening");
          }
        };
      } catch (err) {
        console.error("[VoiceReader] Error playing audio chunk:", err);
      }
    },
    [getOutputAudioContext],
  );

  const startVoiceSession = async () => {
    setErrorMessage("");
    setStatus("connecting");

    try {
      // 1. Immediately request microphone and unlock Web Audio while user gesture is active
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const outCtx = getOutputAudioContext();
      if (outCtx.state === "suspended") {
        await outCtx.resume();
      }

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
        micStreamRef.current = stream;
      } catch (micErr: any) {
        if (!micStreamRef.current) {
          throw new Error("يرجى السماح بالوصول إلى الميكروفون لبدء المحادثة الصوتية.");
        }
        throw micErr;
      }

      let tokenJson: any = null;
      try {
        const text = await tokenRes.text();
        tokenJson = JSON.parse(text);
      } catch {
        throw new Error("تعذر الاتصال بخادم الصوت. يرجى التأكد من اتصال الإنترنت وحاول مجدداً.");
      }

      if (!tokenRes.ok || !tokenJson?.token) {
        throw new Error("المساعد الصوتي غير متوفر حالياً. يرجى المحاولة لاحقاً.");
      }

      const token = tokenJson.token;

      // 3. Connect to Gemini Multimodal Live API using the active gemini-3.8-live model
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
            setStatus("speaking");
            // Prompt the anchor to greet the listener immediately
            try {
              session.sendRealtimeInput({
                text: `ابدأ الآن فوراً بالترحيب بالقارئ بأسلوب إذاعي واثق وممتع (بالدارجة المغربية) في جريدة الأفق، وقدم باختصار شديد في جملتين موضوع هذا المقال: "${articleTitle || "مقال اليوم"}" وافتح معه باب النقاش وسؤاله عن رأيه.`,
              });
            } catch (greetErr) {
              console.warn("[VoiceReader] Initial greeting trigger error:", greetErr);
              setStatus("listening");
            }
          },
          onmessage: (msg: any) => {
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

            if (serverContent?.turnComplete) {
              // After playback ends, onended will toggle back to listening
            }
          },
          onerror: (err: any) => {
            console.error("[VoiceReader] Session error:", err);
            setErrorMessage("حدث خطأ في الاتصال الصوتي مع جيميناي.");
            cleanup();
          },
          onclose: (e: any) => {
            console.log("[VoiceReader] Session closed:", e);
            cleanup();
          },
        },
      });

      sessionRef.current = session;

      // 4. Capture and stream 16kHz PCM audio to Gemini
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx();
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives ~85ms latency chunks at 48k or ~256ms at 16k
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Resample to 16,000 Hz if needed
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

        // Convert Float32Array (-1.0 to 1.0) to 16-bit PCM little-endian
        const pcm16 = new Int16Array(pcmData16k.length);
        for (let i = 0; i < pcmData16k.length; i++) {
          const s = Math.max(-1, Math.min(1, pcmData16k[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = window.btoa(binary);

        try {
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64Audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch (sendErr) {
          console.warn("[VoiceReader] Failed to send realtime audio:", sendErr);
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error("[VoiceReader] Initialization failed:", err);
      setErrorMessage(err?.message || "فشل الاتصال بالمساعد الصوتي.");
      cleanup();
    }
  };

  const handleToggle = () => {
    if (status === "idle" || status === "error") {
      startVoiceSession();
    } else {
      cleanup();
    }
  };

  const isLive = status === "listening" || status === "speaking";

  return (
    <>
      <div className={`relative inline-flex items-center gap-1 ${className}`} dir="rtl">
        <button
          type="button"
          onClick={handleToggle}
          className={`jarida-focusable flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer font-sans shadow-sm ${
            isLive
              ? "bg-[#6b5435] text-[#fbf6ec] ring-2 ring-[#d4c5b0] hover:bg-[#584428]"
              : status === "connecting"
                ? "bg-[#e8dcbf] text-[#6b5435] cursor-wait"
                : "bg-[#f5e6cc] text-[#554a32] hover:bg-[#ebd8b7] hover:text-black border border-[#d3c49b]"
          }`}
          title={
            isLive
              ? "انقر لإنهاء المحادثة الصوتية"
              : "محادثة صوتية حية ومباشرة مع مذيع الأفق الذكي حول المقال"
          }
          aria-live="polite"
        >
          {status === "connecting" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b5435]" />
              <span className="font-medium">جاري الاتصال...</span>
            </>
          ) : isLive ? (
            <>
              {status === "speaking" ? (
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#d4c5b0]" />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
              <span className="font-bold">
                {status === "speaking" ? "المذيع يتحدث..." : "🎙️ تفضل، أنا كنسمعك..."}
              </span>
              <Square className="w-3 h-3 mr-1 text-[#fbf6ec]/80 hover:text-red-300 transition" />
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-[#6b5435]" />
              <span className="font-medium">🎙️ ناقش الخبر صوتياً</span>
            </>
          )}
        </button>

        {/* Error Tooltip / Badge if permission denied or connection failed */}
        {errorMessage && status === "idle" && (
          <span
            className="absolute top-full mt-1.5 right-0 z-30 whitespace-nowrap text-[11px] bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 cursor-pointer"
            role="alert"
            onClick={() => setErrorMessage("")}
            title="انقر للإغلاق"
          >
            <span>{errorMessage}</span>
            <X className="w-3 h-3 hover:text-black transition flex-shrink-0" />
          </span>
        )}
      </div>
    </>
  );
}
