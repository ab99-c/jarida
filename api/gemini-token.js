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
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-api-key");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Please use POST." });
  }

  // 1. Accept server environment variable or client-provided key in header/body
  const customKey =
    req.headers["x-gemini-api-key"] ||
    req.body?.apiKey;

  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    customKey;
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!apiKey) {
    console.error("[Gemini Token] GEMINI_API_KEY is missing on server and not provided by client.");
    return res.status(400).json({
      error: "missing_api_key",
      message:
        "يرجى إضافة GEMINI_API_KEY في إعدادات Vercel (Project Settings > Environment Variables) أو إدخال مفتاحك في المتصفح.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1alpha",
    });

    // Create an ephemeral token valid for 15 minutes (uses: 1) for the current Gemini Live model
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        liveConnectConstraints: {
          model: "gemini-3.8-live",
          config: {
            responseModalities: ["AUDIO"],
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
