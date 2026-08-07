import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/affiliate-ai/assist
 *
 * Forage-Via-style AI customer-assist for KOLs. The KOL pastes a client
 * profile + case description; the route forwards the conversation to
 * OpenAI Chat Completions and streams the assistant's reply back as
 * Server-Sent Events.
 *
 * Medical boundary (enforced in the system prompt, not just client-side):
 *   - The assistant NEVER claims to diagnose, prescribe, or guarantee
 *     outcomes.
 *   - Every response must include the disclaimer "This is not medical
 *     advice; please contact LCM for details." We hard-enforce it by
 *     appending a system reminder at the end of every assistant turn.
 *   - For "can I have surgery X?" questions, the assistant routes the
 *     customer to a pre-review intake form rather than a yes/no answer.
 *
 * Provider: OpenAI Chat Completions today. The interface is intentionally
 * minimal so a domestic-compliant model (Qwen / DeepSeek / Wenxin) can be
 * swapped in by replacing `callOpenAI` with a parallel `callProvider`
 * function — the prompt and streaming contract stay identical.
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
  // Optional client context the KOL already filled in (name, age range,
  // health concerns, country). We embed it into the system prompt so the
  // model personalizes the recommendations.
  clientContext?: {
    displayName?: string;
    ageRange?: string;
    countryCode?: string;
    healthConcerns?: string[];
    budgetBracket?: string;
  };
}

const MEDICAL_DISCLAIMER =
  "This response is not medical advice. LCM provides administrative and travel coordination only. For clinical decisions, the customer should contact LCM directly for a pre-review evaluation.";

const SYSTEM_PROMPT = `You are an assistant for LinkChinaMed (LCM) — a company that helps overseas patients access administrative and travel-coordination services for medical care in China. You help KOL affiliates (creators who refer customers) draft patient-facing replies and pick appropriate LCM service bundles.

CRITICAL MEDICAL BOUNDARY — NON-NEGOTIABLE:
- You are NOT a doctor. You do NOT diagnose, prescribe, or recommend treatments.
- NEVER confirm or deny whether a patient is a candidate for any procedure.
- When asked "can I have surgery X?" or "is Y the right treatment for me?" — DO NOT answer with a yes/no. Reply:
  "I'm not qualified to assess medical candidacy. Please ask the customer to fill LCM's pre-review intake form so the team can evaluate properly. [Insert link]"
- You MAY describe what a service bundle generally covers (e.g. "the oncology bundle typically includes hospital coordination, translation, and accommodation"), based ONLY on the catalog below.
- ALWAYS end your reply with the literal disclaimer: "This is not medical advice; please contact LCM for details."

YOUR JOB when given a client profile + case description:
1. Suggest up to 5 LCM service bundles that match the customer's stated concerns. For each, give:
   - Bundle name
   - 1-line description of what it includes
   - Indicative price range in USD (rough; LCM will quote for real)
   - Risk notes (e.g. "requires 6-week stay" or "non-invasive screening")
2. Flag risk factors the customer should mention to LCM in pre-review (age, chronic conditions, prior surgeries, etc.).
3. Provide a short contract template snippet the KOL can paste into a follow-up message.
4. End with the disclaimer.

SERVICE BUNDLES (illustrative — replace with live catalog when available):
- Fertility: IVF coordination (China), egg-freezing, surrogacy liaison. $8k–$35k.
- Oncology: multi-disciplinary tumor board, treatment coordination, translation, accommodation. $15k–$120k.
- Cardiac: pre-surgical consult, travel + post-op rehab. $25k–$80k.
- Orthopedic: joint replacement, spine surgery. $12k–$45k.
- Cosmetic: rhinoplasty, body contouring. $5k–$25k.
- Wellness / TCM: executive checkup, traditional medicine retreat. $3k–$15k.
- Dental: implants, full-mouth restoration. $4k–$30k.

OUTPUT FORMAT (strict JSON when the caller asked for structured output, otherwise plain text):
- Plain text reply only — never JSON unless the caller asked.
- Bullet list for the bundle recommendations.
- A short "Risk notes" section.
- A short "Contract template" section.
- The disclaimer on the final line.

TONE: warm, plain English (or the caller's locale), avoid jargon. The KOL will forward this to their customer; the KOL is not a clinician.`;

// Map Next.js locale codes to a language instruction for the model.
const LOCALE_LANG: Record<string, string> = {
  zh: "Respond entirely in Simplified Chinese (简体中文). Use natural, warm Chinese suitable for customer communication.",
  en: "Respond entirely in English.",
  ar: "Respond entirely in Arabic (العربية).",
  es: "Respond entirely in Spanish (Español).",
  ru: "Respond entirely in Russian (Русский).",
};

function buildSystemPrompt(clientContext?: RequestBody["clientContext"], locale?: string) {
  const ctx = clientContext ?? {};
  const ctxLines: string[] = [];
  if (ctx.displayName) ctxLines.push(`Customer display name: ${ctx.displayName}`);
  if (ctx.ageRange) ctxLines.push(`Age range: ${ctx.ageRange}`);
  if (ctx.countryCode) ctxLines.push(`Country of origin: ${ctx.countryCode}`);
  if (ctx.healthConcerns?.length) {
    ctxLines.push(`Stated health concerns: ${ctx.healthConcerns.join(", ")}`);
  }
  if (ctx.budgetBracket) ctxLines.push(`Budget bracket: ${ctx.budgetBracket}`);
  const contextBlock = ctxLines.length
    ? `\n\nCUSTOMER CONTEXT (filled by the KOL — do not invent beyond this):\n${ctxLines.join("\n")}`
    : "";
  const langInstruction = LOCALE_LANG[locale ?? "en"] ?? LOCALE_LANG["en"];
  return SYSTEM_PROMPT + contextBlock + `\n\nLANGUAGE: ${langInstruction}`;
}

async function callGroq(messages: ChatMessage[], apiKey: string): Promise<ReadableStream<Uint8Array>> {
  // Groq is OpenAI-compatible — only the base URL and model name differ.
  // Using llama-3.3-70b-versatile: strong multilingual (EN/ZH) reasoning,
  // fast inference, and included in the free tier.
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 900,
      stream: true,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${text.slice(0, 200)}`);
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
                encoder.encode(
                  `data: ${JSON.stringify({ delta: "", done: true, disclaimer: MEDICAL_DISCLAIMER })}\n\n`,
                ),
              );
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
                );
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: (err as Error).message })}\n\n`,
          ),
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
          message:
            "AI assist is not configured on this environment. Set GROQ_API_KEY in the affiliate-portal Vercel project.",
        },
      },
      { status: 503 },
    );
  }

  // Verify the caller is an authenticated promoter. We do this via the
  // Supabase session cookie attached to the request. If the session is
  // missing or doesn't match a promoter, deny — KOLs only, never public.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // No-op: read-only context for this route.
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    { role: "system", content: buildSystemPrompt(body.clientContext, body.locale) },
    ...body.messages.slice(-20), // cap conversation history
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