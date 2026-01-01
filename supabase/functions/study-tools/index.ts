// استيراد المكتبات المطلوبة
// Import required libraries
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// رؤوس CORS للسماح بالطلبات عبر المواقع المختلفة
// CORS headers to allow cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// أنماط تطبيع العربية
// Arabic normalization patterns
const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;
const TATWEEL = /\u0640/g;
const TA_MARBUTA = /\u0629/g;
const ALEF_MAKSURA = /\u0649/g;
const COMMON_SUFFIXES = /(ون|ين|ات|ية|ها|هم|هن|كم|كن|نا)$/;
const AL_PREFIX = /^(ال|وال|بال|كال|فال|لل)/;

// دالة لتطبيع النص العربي
// Function to normalize Arabic text
function normalizeArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, "")  // إزالة التشكيل - Remove diacritics
    .replace(TATWEEL, "")  // إزالة التطويل - Remove tatweel
    .replace(ALEF_VARIANTS, "ا")  // توحيد أنواع الألف - Unify alef variants
    .replace(TA_MARBUTA, "ه")  // تحويل التاء المربوطة - Convert ta marbuta
    .replace(ALEF_MAKSURA, "ي");  // تحويل الألف المقصورة - Convert alef maksura
}

function normalizeText(input: string): string {
  return normalizeArabic(input)
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsArabic(input: string): boolean {
  return /[\u0600-\u06FF]/.test(input);
}

function stemArabic(word: string): string {
  let w = normalizeArabic(word);
  w = w.replace(AL_PREFIX, "");
  if (w.length > 4) w = w.replace(COMMON_SUFFIXES, "");
  return w;
}

function tokenize(input: string): string[] {
  const tokens = normalizeText(input)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
  return tokens.filter((t) => t === "llm" || /^\d+$/.test(t) || t.length >= 2);
}

function stemTokens(tokens: string[]): string[] {
  return tokens.map((t) => (containsArabic(t) ? stemArabic(t) : t));
}

function enrichKeywords(text: string): string[] {
  const out: string[] = [];
  const norm = normalizeText(text);
  if (norm.includes("بيرت") || norm.includes("برت")) {
    out.push("bert", "BERT", "transformer", "attention");
  }
  const m = text.match(/(\d+)/);
  if (m) {
    const n = m[1];
    out.push(n, `lec${n}`, `lec${n}.pdf`, `lecture ${n}`, `lecture${n}`);
  }
  return out;
}

async function getAiKeywordsTool(text: string, apiKey: string): Promise<string[]> {
  const toolDef = {
    type: "function",
    function: {
      name: "extract_keywords",
      description: "Extract up to 12 search keywords (Arabic/English/transliteration) for retrieving course chunks.",
      parameters: {
        type: "object",
        properties: {
          keywords: { type: "array", items: { type: "string" } },
        },
        required: ["keywords"],
        additionalProperties: false,
      },
    },
  };

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content:
            "You extract retrieval keywords. Use transliterations when Arabic is used (e.g., بيرت -> BERT). Always respond via tool call.",
        },
        { role: "user", content: `Topic: ${text}` },
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: "extract_keywords" } },
    }),
  });

  if (!r.ok) return [];
  const data = await r.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  const args = toolCall?.function?.arguments;
  if (!args) return [];

  try {
    const parsed = JSON.parse(args);
    const kws = Array.isArray(parsed?.keywords) ? parsed.keywords : [];
    return kws.filter((k: unknown) => typeof k === "string").slice(0, 12);
  } catch {
    return [];
  }
}

type Chunk = { content: string; source: string; page: number; chunk_index: number };

async function retrieveChunks({
  supabase,
  apiKey,
  text,
  topK,
}: {
  supabase: any;
  apiKey: string;
  text: string;
  topK: number;
}): Promise<Array<Chunk & { score: number }>> {
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content, source, page, chunk_index")
    .order("created_at", { ascending: false })
    .limit(1200);

  const baseTokens = tokenize(text);
  const enriched = enrichKeywords(text).flatMap(tokenize);
  const aiTokens = containsArabic(text) ? (await getAiKeywordsTool(text, apiKey)).flatMap(tokenize) : [];
  const allTokens = Array.from(new Set([...baseTokens, ...enriched, ...aiTokens]));
  const allKeywords = Array.from(new Set([...allTokens, ...stemTokens(allTokens)]));

  const scored = (chunks || []).map((c: Chunk) => {
    const haystack = `${c.source} ${c.content}`;
    const norm = normalizeText(haystack);
    const stemmed = stemTokens(tokenize(haystack)).join(" ");

    let score = 0;
    for (const kw of allKeywords) {
      if (norm.includes(kw)) score += 2;
      if (stemmed.includes(kw)) score += 1;
    }

    const lengthFactor = c.content.length > 50 ? 1 : 0.7;
    return { ...c, score: score * lengthFactor };
  });

  type ScoredChunk = Chunk & { score: number };

  return (scored as ScoredChunk[])
    .filter((c: ScoredChunk) => c.score > 0)
    .sort((a: ScoredChunk, b: ScoredChunk) => b.score - a.score)
    .slice(0, topK);
}

// خدمة أدوات الدراسة
// Study tools service
serve(async (req) => {
  // معالجة طلبات OPTIONS (preflight)
  // Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // تحليل جسم الطلب
    // Parse request body
    const { topic, n = 5, type = "flashcards", difficulty = "medium", topK = 6 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle auto-generation modes (generate from all content)
    if (type === "generate-questions" || type === "generate-summaries" || type === "generate-quiz") {
      // Get all chunks
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content, source, page")
        .limit(50);

      if (!chunks || chunks.length === 0) {
        return new Response(JSON.stringify({ error: "لا توجد مستندات" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const context = chunks
        .map((c, idx) => `[C${idx + 1}] [${c.source}, ص${c.page}]\n${c.content}`)
        .join("\n\n---\n\n");

      let toolDef: any;
      let toolChoiceName = "";
      let systemPrompt = "";

      if (type === "generate-questions") {
        toolChoiceName = "generate_questions";
        systemPrompt = `أنت مساعد تعليمي. استنبط ${n} أسئلة متوقعة للامتحان من المقاطع التالية.

قواعد:
- نوّع بين أسئلة مفاهيمية وتطبيقية ومقارنة.
- اجعل الأسئلة تغطي المفاهيم الأساسية.

المقاطع:\n${context}`;

        toolDef = {
          type: "function",
          function: {
            name: toolChoiceName,
            description: "Generate expected exam questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      type: { type: "string", enum: ["conceptual", "applied", "comparison"] },
                    },
                    required: ["question", "type"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        };
      } else if (type === "generate-summaries") {
        toolChoiceName = "generate_summaries";
        systemPrompt = `أنت مساعد تعليمي. أنشئ ${n} ملخصات للموضوعات الرئيسية من المقاطع.

قواعد:
- كل ملخص يحتوي عنوان و 3-5 نقاط رئيسية.
- غطِّ أهم المفاهيم.

المقاطع:\n${context}`;

        toolDef = {
          type: "function",
          function: {
            name: toolChoiceName,
            description: "Generate topic summaries",
            parameters: {
              type: "object",
              properties: {
                summaries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      points: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "points"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summaries"],
              additionalProperties: false,
            },
          },
        };
      } else {
        // generate-quiz
        toolChoiceName = "generate_quiz";
        systemPrompt = `أنت مساعد تعليمي. أنشئ ${n} أسئلة اختبار متعددة الخيارات من المقاطع.

قواعد:
- 4 خيارات لكل سؤال.
- correct هو رقم الإجابة الصحيحة (0-3).

المقاطع:\n${context}`;

        toolDef = {
          type: "function",
          function: {
            name: toolChoiceName,
            description: "Generate quiz questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correct: { type: "number" },
                    },
                    required: ["question", "options", "correct"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        };
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "أنشئ المحتوى المطلوب" },
          ],
          tools: [toolDef],
          tool_choice: { type: "function", function: { name: toolChoiceName } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error("AI Gateway error");
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "فشل في إنشاء النتيجة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Original topic-based generation
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const k = Math.min(Math.max(Number(topK) || 6, 1), 10);
    const relevant = await retrieveChunks({ supabase, apiKey: LOVABLE_API_KEY, text: topic, topK: k });

    const context = relevant
      .map(
        (c, idx) =>
          `[C${idx + 1}] [Source: ${c.source}, Page: ${c.page ?? 0}]\n${c.content}`,
      )
      .join("\n\n---\n\n");

    const citationsPool = relevant.map((c) => ({
      source: c.source,
      page: c.page ?? 0,
      snippet: c.content.slice(0, 220) + (c.content.length > 220 ? "..." : ""),
    }));

    if (!context) {
      const message = "لا أجد مقاطع كافية في مواد المقرر لهذا الموضوع. جرّب كلمة مفتاحية كما تظهر في الملفات (مثل BERT أو Lec3).";
      return new Response(JSON.stringify({ error: message, citations: [] }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tool schemas
    let toolDef: any;
    let toolChoiceName = "";
    let systemPrompt = "";

    if (type === "summarize") {
      toolChoiceName = "create_summary";
      systemPrompt = `أنت مساعد تعليمي. لخص الموضوع المطلوب اعتماداً فقط على المقاطع التالية.

قواعد:
- لا تضف معلومات خارج النص.
- أرجع ${Math.min(Math.max(n, 3), 10)} نقاط قصيرة.
- لكل نقطة: أضف 1-2 استشهاد من [C1..] مع (source,page,quote) مقتبس من النص.

المقاطع:\n${context}`;

      toolDef = {
        type: "function",
        function: {
          name: toolChoiceName,
          description: "Create bullet-point summary with citations",
          parameters: {
            type: "object",
            properties: {
              bullets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    citations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source: { type: "string" },
                          page: { type: "number" },
                          quote: { type: "string" },
                        },
                        required: ["source", "page", "quote"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["text", "citations"],
                  additionalProperties: false,
                },
              },
            },
            required: ["bullets"],
            additionalProperties: false,
          },
        },
      };
    } else if (type === "quiz") {
      toolChoiceName = "create_quiz";
      const diffLabel = difficulty === "easy" ? "سهل" : difficulty === "hard" ? "صعب" : "متوسط";

      systemPrompt = `أنت مساعد تعليمي. أنشئ اختبار متعدد الخيارات عن الموضوع اعتماداً فقط على المقاطع.

قواعد:
- مستوى الصعوبة: ${diffLabel}.
- أنشئ ${Math.min(Math.max(n, 3), 10)} أسئلة.
- لكل سؤال: 4 خيارات، وcorrect هو رقم الخيار الصحيح (0-3).
- لكل سؤال: أرفق 1-2 استشهاد (source,page,quote) مقتبس حرفياً من المقاطع لدعم الإجابة.

المقاطع:\n${context}`;

      toolDef = {
        type: "function",
        function: {
          name: toolChoiceName,
          description: "Create quiz questions with citations",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correct: { type: "number" },
                    citations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source: { type: "string" },
                          page: { type: "number" },
                          quote: { type: "string" },
                        },
                        required: ["source", "page", "quote"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["question", "options", "correct", "citations"],
                  additionalProperties: false,
                },
              },
              citations_pool: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string" },
                    page: { type: "number" },
                    snippet: { type: "string" },
                  },
                  required: ["source", "page", "snippet"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      };
    } else {
      // flashcards (keep existing behavior, no citations required)
      toolChoiceName = "create_flashcards";
      systemPrompt = `أنت مساعد تعليمي. أنشئ ${Math.min(Math.max(n, 3), 10)} بطاقات مراجعة (سؤال/جواب) عن الموضوع اعتماداً فقط على المقاطع:\n\n${context}`;

      toolDef = {
        type: "function",
        function: {
          name: toolChoiceName,
          description: "Create flashcards for studying",
          parameters: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["flashcards"],
            additionalProperties: false,
          },
        },
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              type === "quiz"
                ? `الموضوع: ${topic}\nالصعوبة: ${difficulty}`
                : `الموضوع: ${topic}`,
          },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: toolChoiceName } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوزت حد الطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI Gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      // Return also a compact citations pool for UI if needed
      return new Response(
        JSON.stringify({ ...result, citations_pool: citationsPool }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "فشل في إنشاء النتيجة" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in study-tools:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
