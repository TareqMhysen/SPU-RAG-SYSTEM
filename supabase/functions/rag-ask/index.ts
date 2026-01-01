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

// تطبيع العربية وكلمات التوقف
// Arabic normalization and stopwords
const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671\u0627]/g;
const TATWEEL = /\u0640/g;
const TA_MARBUTA = /\u0629/g;
const ALEF_MAKSURA = /\u0649/g;
const YA_VARIANTS = /[\u064A\u0649\u06CC]/g;
const HAMZA_VARIANTS = /[\u0621\u0623\u0625\u0624\u0626]/g;

// كلمات التوقف العربية الممتدة
// Extended Arabic stopwords
const ARABIC_STOPWORDS = new Set([
  "في", "من", "إلى", "على", "عن", "مع", "أو", "و", "ف", "ب", "ل", "ك",
  "هذا", "هذه", "ذلك", "تلك", "هؤلاء", "أولئك", "الذي", "التي", "الذين", "اللواتي",
  "هو", "هي", "هم", "هن", "أنا", "نحن", "أنت", "أنتم", "أنتن",
  "كان", "كانت", "كانوا", "يكون", "تكون", "ليس", "ليست",
  "أن", "إن", "لأن", "لكن", "لكي", "حتى", "إذا", "لو", "ما", "لا", "نعم",
  "قد", "قبل", "بعد", "كل", "بعض", "غير", "أي", "كيف", "لماذا", "متى", "أين",
  "جدا", "أكثر", "أقل", "مثل", "حيث", "هنا", "هناك", "أيضا", "فقط", "حول",
  "عند", "بين", "خلال", "ضد", "عبر", "تحت", "فوق", "أمام", "خلف", "داخل", "خارج",
]);

// كلمات التوقف الإنجليزية
// English stopwords
const ENGLISH_STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "can", "to", "of", "in", "for", "on", "with",
  "at", "by", "from", "as", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "also", "now",
  "and", "but", "or", "if", "because", "until", "while", "about", "what", "which",
]);

// المصطلحات التقنية المهمة مع أوزان أعلى
// Important technical terms with higher weights
const IMPORTANT_TERMS = new Set([
  // English ML/NLP terms
  "bert", "gpt", "transformer", "attention", "embedding", "word2vec", "lstm", "rnn", "cnn",
  "neural", "network", "deep", "learning", "machine", "model", "training", "loss", "gradient",
  "backpropagation", "optimization", "overfitting", "regularization", "dropout", "batch",
  "epoch", "layer", "activation", "softmax", "sigmoid", "relu", "cross-entropy", "classification",
  "regression", "clustering", "supervised", "unsupervised", "reinforcement", "nlp", "llm",
  "tokenization", "vocabulary", "encoder", "decoder", "fine-tuning", "pretrained", "transfer",
  // Arabic equivalents
  "محولات", "انتباه", "تضمين", "شبكة", "عصبية", "تعلم", "آلي", "عميق", "نموذج", "تدريب",
  "دالة", "خسارة", "انحدار", "تصنيف", "تجميع", "إشرافي", "تكرارية", "طبقة", "تنشيط",
]);

// دالة لتطبيع النص العربي (إزالة التشكيل والتوحيد)
// Function to normalize Arabic text (remove diacritics and unify)
function normalizeArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, "")  // إزالة التشكيل - Remove diacritics
    .replace(TATWEEL, "")  // إزالة التطويل - Remove tatweel
    .replace(ALEF_VARIANTS, "ا")  // توحيد أنواع الألف - Unify alef variants
    .replace(TA_MARBUTA, "ه")  // تحويل التاء المربوطة إلى هاء - Convert ta marbuta to ha
    .replace(ALEF_MAKSURA, "ي")  // تحويل الألف المقصورة إلى ياء - Convert alef maksura to ya
    .replace(YA_VARIANTS, "ي")  // توحيد أنواع الياء - Unify ya variants
    .replace(HAMZA_VARIANTS, "ء");  // توحيد أنواع الهمزة - Unify hamza variants
}

// دالة لتطبيع النص بشكل عام
// Function to normalize text in general
function normalizeText(input: string): string {
  return normalizeArabic(input)
    .toLowerCase()  // تحويل إلى أحرف صغيرة - Convert to lowercase
    .replace(/[\p{P}\p{S}]/gu, " ")  // استبدال علامات الترقيم والرموز بمسافات - Replace punctuation and symbols with spaces
    .replace(/\s+/g, " ")  // استبدال المسافات المتعددة بمسافة واحدة - Replace multiple spaces with single space
    .trim();  // إزالة المسافات من البداية والنهاية - Trim whitespace
}

// دالة للتحقق من كون الكلمة كلمة توقف
// Function to check if word is a stopword
function isStopword(word: string): boolean {
  const normalized = normalizeText(word);
  return ARABIC_STOPWORDS.has(normalized) || ENGLISH_STOPWORDS.has(normalized);
}

// دالة للحصول على وزن المصطلح (الأهمية)
// Function to get term weight (importance)
function getTermWeight(term: string): number {
  const normalized = normalizeText(term);
  if (IMPORTANT_TERMS.has(normalized)) return 5;  // مصطلحات مهمة - Important terms
  if (term.length > 6) return 2;  // كلمات طويلة - Long words
  return 1;  // كلمات عادية - Normal words
}

// دالة لتقسيم النص إلى وحدات (tokens)
// Function to tokenize text into tokens
function tokenize(input: string): string[] {
  const tokens = normalizeText(input)
    .split(" ")  // تقسيم حسب المسافات - Split by spaces
    .map((t) => t.trim())  // إزالة المسافات من كل وحدة - Trim each token
    .filter(Boolean);  // إزالة القيم الفارغة - Filter out empty values
  return tokens.filter((t) => {
    if (/^\d+$/.test(t)) return true;  // السماح بالأرقام - Allow numbers
    if (t.length < 2) return false;  // رفض الوحدات القصيرة جداً - Reject very short tokens
    if (isStopword(t)) return false;  // رفض كلمات التوقف - Reject stopwords
    return true;
  });
}

function escapeWebsearchToken(token: string): string {
  return token.replace(/[^\p{L}\p{N}_]+/gu, " ").trim();
}

function buildFtsQuery(tokens: string[]): string {
  const parts = tokens
    .map(escapeWebsearchToken)
    .filter(Boolean)
    .slice(0, 12);
  return parts.join(" OR ");
}

function expandQuery(query: string): string[] {
  const out: string[] = [];
  const qNorm = normalizeText(query);

  const termMaps: Record<string, string[]> = {
    "word embedding": ["word2vec", "embedding", "vector", "representation", "تمثيل", "كلمات", "تضمين"],
    "word2vec": ["word embedding", "embedding", "skip-gram", "cbow", "تضمين"],
    "embedding": ["word embedding", "vector", "representation", "تضمين", "تمثيل"],
    "bert": ["transformer", "attention", "بيرت", "محولات", "nlp", "encoder"],
    "بيرت": ["bert", "transformer", "attention", "محولات"],
    "transformer": ["attention", "bert", "محولات", "self-attention", "encoder", "decoder"],
    "attention": ["transformer", "self-attention", "انتباه", "mechanism"],
    "llm": ["large language model", "gpt", "نموذج لغوي", "transformer"],
    "gpt": ["llm", "transformer", "language model", "generative"],
    "nlp": ["natural language processing", "معالجة اللغة", "text", "لغة طبيعية"],
    "معالجة اللغة": ["nlp", "natural language processing"],
    "rnn": ["recurrent", "lstm", "gru", "تكرارية", "sequence"],
    "lstm": ["rnn", "recurrent", "long short term memory", "gru"],
    "cnn": ["convolutional", "convolution", "طيية", "image"],
    "neural network": ["شبكة عصبية", "deep learning", "nn", "perceptron"],
    "شبكة عصبية": ["neural network", "deep learning", "عميق"],
    "overfitting": ["regularization", "إفراط", "تجاوز", "variance", "generalization"],
    "regularization": ["overfitting", "l1", "l2", "dropout", "تنظيم", "penalty"],
    "backpropagation": ["gradient", "backward", "انتشار عكسي", "chain rule"],
    "gradient descent": ["optimization", "sgd", "adam", "انحدار", "learning rate"],
    "classification": ["تصنيف", "classifier", "softmax", "categories"],
    "تصنيف": ["classification", "classifier", "فئات"],
    "regression": ["انحدار", "linear", "prediction", "continuous"],
    "clustering": ["تجميع", "kmeans", "unsupervised", "groups"],
    "supervised": ["إشرافي", "labeled", "training", "classification", "regression"],
    "unsupervised": ["غير إشرافي", "unlabeled", "clustering", "dimensionality"],
    "deep learning": ["تعلم عميق", "neural network", "layers", "representation"],
    "تعلم عميق": ["deep learning", "neural", "شبكة عصبية"],
  };

  for (const [key, expansions] of Object.entries(termMaps)) {
    if (qNorm.includes(normalizeText(key))) {
      out.push(...expansions);
    }
  }

  const lectureMatch = query.match(/(?:lec|lecture|محاضر[ةه])\s*(\d+)/i);
  if (lectureMatch) {
    const num = lectureMatch[1];
    out.push(`lec${num}`, `lecture${num}`, `lecture ${num}`, `lec ${num}`, `محاضرة ${num}`, `Lec${num}.pdf`);
  }

  const numMatch = query.match(/\b(\d+)\b/);
  if (numMatch) {
    out.push(numMatch[1]);
  }

  return out;
}

async function getAiKeywords(query: string, apiKey: string, timeoutMs = 1200): Promise<string[]> {
  const toolDef = {
    type: "function",
    function: {
      name: "extract_keywords",
      description: "Extract search keywords from a question about course materials. Include English, Arabic, and transliterations.",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Up to 15 relevant keywords/phrases for document retrieval",
          },
        },
        required: ["keywords"],
        additionalProperties: false,
      },
    },
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Extract 10-15 search keywords for course material retrieval. Include English technical terms, Arabic equivalents, and common transliterations.",
          },
          { role: "user", content: query },
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

    const parsed = JSON.parse(args);
    return Array.isArray(parsed?.keywords)
      ? parsed.keywords.filter((k: unknown) => typeof k === "string").slice(0, 15)
      : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

// خدمة الطلبات الرئيسية
// Main request service
serve(async (req) => {
  // معالجة طلبات OPTIONS (preflight)
  // Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // تحليل جسم الطلب
    // Parse request body
    const body = await req.json();
    const query: string = body?.query;  // الاستعلام - Query
    const topK: number = typeof body?.topK === "number" ? Math.min(Math.max(body.topK, 1), 20) : 8;  // عدد النتائج (1-20) - Number of results (1-20)
    const mode: string = body?.mode || "fast";  // الوضع: fast أو accurate - Mode: fast or accurate

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // حماية المعلومات الشخصية - اكتشاف ورفض المعلومات الشخصية
    // PII Guard - Detect and reject personal information
    const PII_PATTERNS = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(?:\+?[0-9]{1,4}[-.\s]?)?(?:\(?[0-9]{2,4}\)?[-.\s]?)?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g,
      studentId: /(?:student\s*id|رقم\s*(?:الطالب|القيد|الجامعي))[\s:]*[A-Z0-9]{5,}/gi,
      nationalId: /\b[0-9]{9,14}\b/g,
    };

    const containsPII = (text: string): { hasPII: boolean; types: string[] } => {
      const detected: string[] = [];
      if (PII_PATTERNS.email.test(text)) detected.push("email");
      if (PII_PATTERNS.phone.test(text)) detected.push("phone");
      if (PII_PATTERNS.studentId.test(text)) detected.push("student ID");
      const nationalIdMatch = text.match(PII_PATTERNS.nationalId);
      if (nationalIdMatch && nationalIdMatch[0] && nationalIdMatch[0].length >= 9) detected.push("ID number");
      return { hasPII: detected.length > 0, types: detected };
    };

    const piiCheck = containsPII(query);
    if (piiCheck.hasPII) {
      console.log(`[RAG] PII detected: ${piiCheck.types.join(", ")}`);
      const piiWarning = "⚠️ تم اكتشاف بيانات شخصية في سؤالك (" + piiCheck.types.join("، ") + "). " +
        "من فضلك أزل البيانات الشخصية (البريد الإلكتروني، رقم الهاتف، رقم الطالب) وأعد إرسال السؤال.";
      
      return new Response(JSON.stringify({ 
        answer: piiWarning, 
        citations: [], 
        chunks: [],
        pii_warning: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[RAG] Query: "${query}", topK: ${topK}, mode: ${mode}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
// ⚠️ مؤقت - احذف بعد النسخ!
console.log("🔑 LOVABLE_API_KEY:", LOVABLE_API_KEY);
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const t0 = Date.now();

    const baseTokens = tokenize(query);
    const expansions = expandQuery(query);

    let allTokens = Array.from(
      new Set([...baseTokens, ...expansions.flatMap(tokenize)])
    ).filter((t) => t.length >= 2);

    const runRetrieval = async (tokens: string[]) => {
      const tStart = Date.now();

      const ftsQuery = buildFtsQuery(tokens);
      const ftsPromise = ftsQuery
        ? supabase
            .from("document_chunks")
            .select("id, content, source, page, chunk_index")
            .textSearch("content", ftsQuery, { type: "websearch", config: "simple" })
            .limit(30)
        : Promise.resolve({ data: [] as any[] });

      const topKeywords = tokens.slice(0, 6).map((k) => k.replace(/,/g, " "));
      const trigramOr = topKeywords.map((kw) => `content.ilike.%${kw}%`).join(",");
      const trigramPromise = trigramOr
        ? supabase
            .from("document_chunks")
            .select("id, content, source, page, chunk_index")
            .or(trigramOr)
            .limit(40)
        : Promise.resolve({ data: [] as any[] });

      const sourceTokens = tokens.filter(
        (kw) => /lec|lecture|محاضر/i.test(kw) || /\.pdf$/i.test(kw)
      );
      const sourceOr = sourceTokens
        .slice(0, 6)
        .map((kw) => `source.ilike.%${kw.replace(/,/g, " ")}%`)
        .join(",");

      const sourcePromise = sourceOr
        ? supabase
            .from("document_chunks")
            .select("id, content, source, page, chunk_index")
            .or(sourceOr)
            .limit(40)
        : Promise.resolve({ data: [] as any[] });

      const [ftsRes, trigramRes, sourceRes] = await Promise.all([ftsPromise, trigramPromise, sourcePromise]);

      const ftsResults = (ftsRes as any).data || [];
      const trigramResults = (trigramRes as any).data || [];
      const sourceResults = (sourceRes as any).data || [];

      console.log(
        `[RAG] Retrieval: fts=${ftsResults.length}, trigram=${trigramResults.length}, source=${sourceResults.length} in ${Date.now() - tStart}ms`
      );

      return { ftsResults, trigramResults, sourceResults };
    };

    const first = await runRetrieval(allTokens);

    const firstTotal = first.ftsResults.length + first.trigramResults.length + first.sourceResults.length;
    
    // Only use AI keywords in accurate mode or if we have weak recall
    if (mode === "accurate" || firstTotal < Math.max(10, topK * 3)) {
      const aiKeywords = await getAiKeywords(query, LOVABLE_API_KEY, mode === "accurate" ? 2000 : 1200);
      if (aiKeywords.length) {
        allTokens = Array.from(
          new Set([...allTokens, ...aiKeywords.flatMap(tokenize)])
        ).filter((t) => t.length >= 2);
      }
    }

    console.log(`[RAG] Keywords(${allTokens.length}): ${allTokens.slice(0, 30).join(", ")}`);

    const { ftsResults, trigramResults, sourceResults } = await runRetrieval(allTokens);

    console.log(`[RAG] Total pipeline pre-score: ${Date.now() - t0}ms`);

    const allChunks = [...ftsResults, ...trigramResults, ...sourceResults];
    const uniqueChunks = new Map<string, any>();
    for (const chunk of allChunks) {
      if (!uniqueChunks.has(chunk.id)) {
        uniqueChunks.set(chunk.id, chunk);
      }
    }

    type ScoredChunk = {
      id: string;
      content: string;
      source: string;
      page: number;
      chunk_index: number;
      score: number;
    };

    const scored: ScoredChunk[] = [];
    const queryNorm = normalizeText(query);

    for (const chunk of uniqueChunks.values()) {
      const haystack = `${chunk.source} ${chunk.content}`;
      const haystackNorm = normalizeText(haystack);

      let score = 0;

      // Weighted keyword matches
      for (const kw of allTokens) {
        const kwNorm = normalizeText(kw);
        if (haystackNorm.includes(kwNorm)) {
          const weight = getTermWeight(kw);
          score += 3 * weight;
          if (haystack.includes(kw)) {
            score += 1 * weight;
          }
        }
      }

      // Source file match bonus
      const sourceNorm = normalizeText(chunk.source);
      for (const kw of allTokens) {
        if (sourceNorm.includes(normalizeText(kw))) {
          score += 5;
        }
      }

      // Full query phrase match
      if (queryNorm.length > 5 && haystackNorm.includes(queryNorm)) {
        score += 15;
      }

      // Content length factor
      if (chunk.content.length > 100) score += 1;
      if (chunk.content.length > 300) score += 1;

      if (score > 0) {
        scored.push({ ...chunk, score });
      }
    }

    const relevantChunks = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[RAG] Scored ${scored.length} chunks, returning top ${relevantChunks.length}`);
    console.log(`[RAG] Top scores: ${relevantChunks.slice(0, 3).map(c => `${c.score} (${c.source})`).join(", ")}`);

    const context = relevantChunks.length > 0
      ? relevantChunks
          .map((c) => `[المصدر: ${c.source}, صفحة: ${c.page ?? 0}]\n${c.content}`)
          .join("\n\n---\n\n")
      : "";

    if (!context) {
      const answer =
        "لا أجد معلومات كافية داخل مواد المقرر للإجابة على هذا السؤال. " +
        "تأكد من رفع ملفات المقرر أولاً، ثم جرّب كتابة كلمات مفتاحية واضحة.";

      await supabase.from("question_history").insert({ question: query, answer, citations: [] });

      return new Response(JSON.stringify({ answer, citations: [], chunks: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `أنت مساعد تعليمي ذكي لمقرر جامعي. مهمتك الإجابة على أسئلة الطلاب بناءً على محتوى المقرر المُعطى.

قواعد صارمة:
1. أجب فقط باستخدام المعلومات الموجودة في (السياق) أدناه. لا تختلق معلومات.
2. إذا السياق يحتوي على الإجابة، اشرحها بوضوح وبالتفصيل.
3. إذا لم تجد الإجابة في السياق، قل ذلك بصراحة.
4. اذكر المصادر بصيغة [اسم_الملف ص X] في نهاية الإجابة.
5. أجب بنفس لغة السؤال (عربي أو إنجليزي).

مكافحة الغش:
- إذا طُلب حل واجب/امتحان: قدم شرحاً وخطوات فقط، لا الحل الكامل.

السياق من مواد المقرر:
${context}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: mode === "accurate" ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
        temperature: 0.3,
        max_tokens: mode === "accurate" ? 1000 : 700,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error("AI Gateway error:", aiResp.status, errorText);

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوزت حد الطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI Gateway error");
    }

    const aiData = await aiResp.json();
    const answer = aiData.choices?.[0]?.message?.content || "حدث خطأ في توليد الإجابة";

    const citations = relevantChunks.map((chunk) => ({
      source: chunk.source,
      page: chunk.page ?? 0,
      content: chunk.content.substring(0, 300) + (chunk.content.length > 300 ? "..." : ""),
    }));

    await supabase.from("question_history").insert({ question: query, answer, citations });

    console.log(`[RAG] Response generated with ${citations.length} citations in ${Date.now() - t0}ms`);

    return new Response(JSON.stringify({ answer, citations, chunks: relevantChunks.map((c) => c.content) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rag-ask:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
