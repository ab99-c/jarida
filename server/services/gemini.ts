/**
 * Unified Google Gemini API Service for Jarida Live
 * Handles article summarization, video metadata generation, bulletin scripts, and comment moderation.
 */

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

async function callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY is not set.");
    return null;
  }

  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };
      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const errText = await response.text();
        console.warn(`[Gemini] Model ${model} returned ${response.status}: ${errText.slice(0, 140)}`);
      }
    } catch (err: any) {
      console.warn(`[Gemini] Attempt with ${model} failed:`, err.message);
    }
  }

  return null;
}

/**
 * Summarizes an article in 2-3 clear Modern Standard Arabic journalistic sentences without repeating title verbatim.
 */
export async function summarizeArticle(title: string, fullText: string): Promise<string | null> {
  const prompt = `العنوان: "${title}"
نص المقال الكامل:
${fullText.slice(0, 3500)}

المطلوب:
Summarize this article in 2–3 clear, journalistic Modern Standard Arabic sentences. Do NOT repeat the headline verbatim. Output only the summary.`;

  return callGemini(prompt, "أنت محرر صحفي محترف في جريدة الأفق، تكتب بلغة عربية فصحى صحفية بليغة وموجزة.");
}

/**
 * Generates a clean 1-2 sentence Arabic caption and assigns a category for video news.
 */
export async function generateVideoCaption(
  title: string,
  rawDescription?: string,
): Promise<{ caption: string; category: string }> {
  const prompt = `عنوان الفيديو: "${title}"
الوصف: "${(rawDescription || "").slice(0, 800)}"

المطلوب:
1. صياغة تعليق صحفي موجز باللغة العربية الفصحى من جملة إلى جملتين حول محتوى الفيديو.
2. تصنيف الفيديو في واحدة من الفئات التالية فقط: "مغرب", "اقتصاد", "دولي", "رياضة", "طقس", "ثقافة", "فيديو".

أخرج النتيجة بصيغة JSON فقط:
{"caption": "...", "category": "..."}`;

  const res = await callGemini(prompt);
  if (res) {
    try {
      const cleaned = res.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.caption) {
        return {
          caption: parsed.caption.trim(),
          category: parsed.category || "فيديو",
        };
      }
    } catch {
      // Fallback if not valid JSON
      return {
        caption: res.replace(/^{.*"caption":\s*"|"}$/g, "").slice(0, 250).trim(),
        category: "فيديو",
      };
    }
  }

  return {
    caption: title,
    category: "فيديو",
  };
}

/**
 * Generates a 30-45 second spoken Arabic news bulletin script from top headlines.
 */
export async function generateDailyBulletinScript(
  headlines: Array<{ title: string; summary: string }>,
): Promise<string> {
  const itemsText = headlines
    .slice(0, 4)
    .map((h, i) => `${i + 1}. ${h.title}: ${h.summary}`)
    .join("\n");

  const prompt = `إليك أهم العناوين الصادرة اليوم في جريدة الأفق:
${itemsText}

اكتب نص موجز إخباري سريع وممتع باللغة العربية الفصحى مناسب للإلقاء الصوتي في فيديو مدته 30 إلى 45 ثانية.
ابدأ بـ "أهلاً بكم في شاشة الأفق، إليكم أبرز أنباء اليوم..."، ثم اعرض الأخبار بسلاسة مع ربط صحفي ذكي، واختم بـ "تابعوا المزيد عبر موقعنا، إلى اللقاء".
اكتب النص الجاهز للقراءة فوراً وبدون أي مقدمات أو علامات إخراجية.`;

  const script = await callGemini(prompt);
  return (
    script ||
    `أهلاً بكم في شاشة الأفق، إليكم أبرز أنباء اليوم: ${headlines
      .slice(0, 3)
      .map((h) => h.title)
      .join(". ")}. تابعوا المزيد عبر موقعنا، إلى اللقاء.`
  );
}

/**
 * Moderates reader comments for spam, profanity, and harmful content.
 */
export async function moderateComment(content: string): Promise<{ isAllowed: boolean; reason?: string }> {
  // Fast rule-based checks
  const trimmed = content.trim();
  if (trimmed.length < 2 || /(http|https|www\.|\.com|\.net|\.ru|\.xyz|<script|eval\()/i.test(trimmed)) {
    return { isAllowed: false, reason: "الروابط والمحتوى الترويجي غير مسموح به في التعليقات" };
  }

  const prompt = `قيّم التعليق التالي المكتوب على مقال صحفي:
"${trimmed}"

هل يحتوي هذا التعليق على:
1. سباب أو شتائم أو ألفاظ نابية؟
2. تحريض على الكراهية أو العنف؟
3. سبام أو رسائل دعائية متكررة؟

أجب بكلمة واحدة فقط: إما "مقبول" أو "مرفوض".`;

  const verdict = await callGemini(prompt);
  if (verdict && verdict.includes("مرفوض")) {
    return { isAllowed: false, reason: "التعليق يتعارض مع ميثاق النشر الصحفي" };
  }

  return { isAllowed: true };
}
