import { GoogleGenAI } from "@google/genai";

/**
 * Vercel Serverless Function to issue an ephemeral authentication token
 * for real-time Gemini Multimodal Live API sessions.
 */
export default async function handler(req, res) {
  // Handle CORS preflight if needed
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Please use POST." });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Token] GEMINI_API_KEY environment variable is missing.");
    return res.status(500).json({
      error: "Server configuration error: missing GEMINI_API_KEY.",
      message:
        "يرجى إضافة GEMINI_API_KEY في إعدادات Vercel (Project Settings > Environment Variables) ثم إعادة النشر (Redeploy).",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1alpha",
    });

    // Create an ephemeral token valid for 15 minutes (uses: 1)
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-09-2025",
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Charon",
                },
              },
            },
          },
        },
      },
    });

    if (!token?.name) {
      throw new Error("Did not receive a valid token name from Gemini API.");
    }

    return res.status(200).json({ token: token.name });
  } catch (error) {
    console.error("[Gemini Token Error]:", error);
    return res.status(500).json({
      error: "Failed to generate ephemeral token",
      message: error?.message || String(error),
    });
  }
}
