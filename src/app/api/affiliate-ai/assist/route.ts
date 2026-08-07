import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/affiliate-ai/assist
 *
 * AI marketing copywriter for LinkChinaMed affiliates (KOLs & agents).
 * Helps promoters craft platform-specific promotional content:
 *   - Short-video scripts (TikTok / 抖音 / Reels)
 *   - Social media captions (Instagram / 小红书 / WeChat Moments)
 *   - Email outreach templates
 *   - Referral program introductions
 *   - Product / service descriptions
 *
 * The model is aware of LCM's service catalog and affiliate mechanics
 * so it produces accurate, on-brand copy. Medical boundary is still
 * enforced — the copy promotes LCM as a travel/admin coordination
 * service, never as a clinical provider.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  locale?: string;
  /** Content type hint from the UI (e.g. "short_video", "social_post", "email") */
  contentType?: string;
  /** Target platform (e.g. "tiktok", "instagram", "wechat", "xiaohongshu") */
  platform?: string;
  /** Optional free-form context from the promoter */
  context?: string;
}

// Map locale codes to language instructions.
const LOCALE_LANG: Record<string, string> = {
  zh: "Respond entirely in Simplified Chinese (简体中文). Use natural, engaging Chinese that resonates with Chinese-speaking audiences.",
  en: "Respond entirely in English.",
  ar: "Respond entirely in Arabic (العربية).",
  es: "Respond entirely in Spanish (Español).",
  ru: "Respond entirely in Russian (Русский).",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  short_video: "short-video script (TikTok / Reels / 抖音)",
  social_post:  "social media caption / post",
  email:        "email outreach template",
  referral_intro: "referral program introduction",
  service_desc: "service / product description",
  story:        "Instagram story text",
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok:    "TikTok",
  instagram: "Instagram",
  youtube:   "YouTube",
  facebook:  "Facebook",
  twitter:   "X / Twitter",
  email:     "Email",
};

const SYSTEM_PROMPT = `You are an expert marketing copywriter and social media strategist for LinkChinaMed (LCM) affiliates — KOLs and agents who promote LCM's medical travel coordination services.

ABOUT LINKCHINAMED (LCM) - STRICT IDENTITY RULES:
LinkChinaMed is a US-registered company (Ionverge LLC, Wyoming). 
CRITICAL RULE: LCM IS NOT A HOSPITAL, NOT A CLINIC, AND NOT A MEDICAL INSTITUTION. LCM DOES NOT EMPLOY DOCTORS AND DOES NOT PROVIDE MEDICAL DIAGNOSES, TREATMENTS, OR CLINICAL ADVICE.
LCM's role is strictly as a bridge and service provider. We provide administrative, logistical, and travel coordination services for overseas patients seeking medical care at top-tier hospitals in China.

SERVICE CAPABILITIES (What we actually do):
- Hospital & Expert Coordination: Assisting with booking appointments at top Chinese hospitals and arranging multi-disciplinary consultations.
- Language Support: Providing professional medical translation (translating medical records) and in-person interpreting during consultations.
- Travel & Logistics: Coordinating visas, booking flights and hotels, and providing local transportation (airport pickups).
- Medical Escort (VIP): Providing end-to-end VIP accompaniment from arrival to departure, easing the anxiety of traveling abroad for healthcare.
- Key Coordination Areas: Oncology, Fertility/IVF, Cardiac/Orthopedics, Cosmetics/Aesthetics, and TCM/Wellness.

STRICT MEDICAL BOUNDARIES (NEVER CROSS THESE):
1. NO MEDICAL PROMISES: Never use absolute terms like "guaranteed cure", "100% success rate", "risk-free", or "no side effects".
2. NO MEDICAL ADVICE: If a user/KOL mentions a specific medical condition, you must state that the patient needs to "submit medical records for a professional pre-review by the hospital." Do not suggest specific surgeries or treatments.
3. NO IDENTITY CONFUSION: Never say "our doctors", "our hospital", or "we will perform the surgery". Always say "top experts at partner hospitals in China" or "the medical network we coordinate with".
4. PRICING COMPLIANCE: Never quote exact clinical costs. Always state that "final costs are subject to the hospital's actual evaluation."

AFFILIATE / PROMOTER PROGRAM:
- Target Audience for KOLs: Overseas patients looking for hassle-free, cost-effective, and safe medical travel to China.
- Target Audience for Agents: Recruiting other KOLs by highlighting high commissions (5%-10%) and platform support.
- Always include a natural Call-to-Action (CTA) directing the audience to use the affiliate's unique referral link or promo code.

TONE, STYLE & PLATFORM GUIDELINES:
- Professional, empathetic, trustworthy, and fully compliant with advertising standards. Focus heavily on the "peace of mind", "seamless logistics", and "cost-effectiveness" that LCM's coordination services bring.
- For Instagram / TikTok: use relevant hashtags, trendy energy, strong CTA. Keep short-video scripts concise (60-90 seconds).
- For Facebook: slightly longer, community-oriented tone.
- For YouTube: structured intro-body-CTA format, conversational tone.
- For email: professional, empathetic, concise (under 200 words).`;

function buildSystemPrompt(body: RequestBody): string {
  const lang = LOCALE_LANG[body.locale ?? "en"] ?? LOCALE_LANG["en"];

  const contentTypeNote = body.contentType && CONTENT_TYPE_LABELS[body.contentType]
    ? `\n\nCONTENT TYPE REQUESTED: ${CONTENT_TYPE_LABELS[body.contentType]}`
    : "";

  const platformNote = body.platform && PLATFORM_LABELS[body.platform]
    ? `\nTARGET PLATFORM: ${PLATFORM_LABELS[body.platform]}`
    : "";

  const contextNote = body.context?.trim()
    ? `\nADDITIONAL CONTEXT FROM PROMOTER: ${body.context.trim()}`
    : "";

  return `${SYSTEM_PROMPT}${contentTypeNote}${platformNote}${contextNote}\n\nLANGUAGE: ${lang}`;
}

async function callGroq(messages: ChatMessage[], apiKey: string): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1200,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq error: ${res.status} ${text.slice(0, 200)}`);
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: "", done: true })}` + "\n\n"),
              );
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta })}` + "\n\n"),
                );
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: (err as Error).message })}` + "\n\n"),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          code: "AI_DISABLED",
          message: "AI assist is not configured. Set GROQ_API_KEY in the Vercel project.",
        },
      },
      { status: 503 },
    );
  }

  // Verify the caller is authenticated via Supabase session.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Login required" } },
      { status: 401 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "messages array required" } },
      { status: 400 },
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(body) },
    ...body.messages.slice(-20),
  ];

  try {
    const stream = await callGroq(messages, apiKey);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "AI_PROVIDER_ERROR", message: e?.message ?? "Unknown AI error" } },
      { status: 502 },
    );
  }
}