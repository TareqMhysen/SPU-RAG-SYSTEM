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

// خدمة معالجة المستندات
// Document processing service
serve(async (req) => {
  // معالجة طلبات OPTIONS (preflight)
  // Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // الحصول على بيانات النموذج
    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;  // الملف - File
    const mode = (formData.get("mode") as string) || "fast";  // الوضع: fast أو accurate - Mode: fast or accurate

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const fileName = file.name;
    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log(`[ParseDoc] Processing: ${fileName}, type: ${fileType}, size: ${uint8Array.length}, mode: ${mode}`);

    const sanitizeText = (text: string): string => {
      return text
        .replace(/\u0000/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
        .replace(/\uFFFD/g, "")
        .trim();
    };

    // Convert to base64 in chunks to avoid stack overflow
    const uint8ToBase64 = (bytes: Uint8Array): string => {
      let binary = "";
      const chunkSize = 8_192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const sub = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...sub);
      }
      return btoa(binary);
    };

    let textContent = "";
    let pages: { pageNum: number; content: string }[] = [];

    if (fileType === "application/pdf") {
      console.log(`[ParseDoc] PDF detected, using Vision AI for OCR (mode: ${mode})`);

      const filePath = `${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("course-documents")
        .upload(filePath, uint8Array, { contentType: fileType });

      if (uploadError) {
        console.error("[ParseDoc] Storage upload failed:", uploadError);
      }

      const base64Data = uint8ToBase64(uint8Array);
      console.log(`[ParseDoc] Base64 length: ${base64Data.length}`);

      // Different prompts based on mode
      const ocrPrompt = mode === "accurate"
        ? `Extract ALL text from this PDF with maximum accuracy. This is a scanned lecture or handwritten document.

Critical instructions:
- Extract every single word, including headers, footers, margins, handwritten notes
- Preserve exact formatting: tables, lists, bullet points, numbered items
- If text is unclear, make your best guess and mark with [unclear]
- For diagrams/figures, describe them as [Figure: description]
- Prefix each page with: [Page N]
- Keep the original language (Arabic/English mixed is common)
- Do NOT summarize or skip any content

Return the complete extracted text.`
        : `Extract ALL text from this PDF accurately.

Rules:
- Do not summarize.
- Keep headings, lists, and tables as text.
- If you can detect pages, prefix each page with: [Page N]
- Keep the original language (Arabic/English).

Return only the extracted text.`;

      const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: mode === "accurate" ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
          temperature: 0.1,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: ocrPrompt },
                {
                  type: "file",
                  file: {
                    filename: fileName,
                    file_data: `data:application/pdf;base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error("[ParseDoc] OCR API failed:", ocrResponse.status, errorText);

        return new Response(
          JSON.stringify({
            success: false,
            message: "فشل استخراج النص من الـ PDF. تأكد من أن الملف غير مشفر وحاول مرة أخرى.",
            storagePath: filePath,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const ocrData = await ocrResponse.json();
      textContent = sanitizeText(ocrData.choices?.[0]?.message?.content || "");
      
      console.log(`[ParseDoc] OCR extracted ${textContent.length} characters`);

      if (textContent.length < 100) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "لم يتم استخراج نص كافٍ. تأكد من أن الـ PDF يحتوي على نص قابل للقراءة وليس صورًا فقط.",
            storagePath: filePath,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pageMarkers = textContent.match(/\[Page\s*\d+\]/gi) || [];
      
      if (pageMarkers.length > 1) {
        const pageSplits = textContent.split(/\[Page\s*\d+\]/i);
        for (let i = 0; i < pageSplits.length; i++) {
          const content = pageSplits[i].trim();
          if (content.length > 50) {
            pages.push({ pageNum: i + 1, content });
          }
        }
      } else {
        const charsPerPage = 2000;
        for (let i = 0; i < textContent.length; i += charsPerPage) {
          pages.push({
            pageNum: Math.floor(i / charsPerPage) + 1,
            content: textContent.slice(i, i + charsPerPage),
          });
        }
      }
    } else if (
      fileType === "text/plain" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md")
    ) {
      const decoder = new TextDecoder("utf-8");
      textContent = sanitizeText(decoder.decode(uint8Array));
      pages = [{ pageNum: 1, content: textContent }];
    } else {
      return new Response(
        JSON.stringify({ error: "نوع الملف غير مدعوم. استخدم PDF أو TXT أو MD." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!textContent.trim()) {
      return new Response(
        JSON.stringify({ error: "لم يتم استخراج أي نص من الملف" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ParseDoc] Content ready: ${pages.length} pages`);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ name: fileName, content: textContent })
      .select()
      .single();

    if (docError) {
      console.error("[ParseDoc] Document insert error:", docError);
      throw docError;
    }

    // Chunk sizes based on mode
    const chunkSize = mode === "accurate" ? 500 : 650;
    const chunkOverlap = mode === "accurate" ? 100 : 80;
    
    const chunks: {
      document_id: string;
      content: string;
      source: string;
      page: number;
      chunk_index: number;
    }[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const paragraphs = page.content.split(/\n\n+/);
      let currentChunk = "";

      for (const paragraph of paragraphs) {
        const trimmedPara = paragraph.trim();
        if (!trimmedPara) continue;

        if (currentChunk.length + trimmedPara.length > chunkSize && currentChunk.length > 0) {
          chunks.push({
            document_id: doc.id,
            content: currentChunk.trim(),
            source: fileName,
            page: page.pageNum,
            chunk_index: chunkIndex++,
          });
          
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText + " " + trimmedPara;
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
        }
      }

      if (currentChunk.trim().length > 30) {
        chunks.push({
          document_id: doc.id,
          content: currentChunk.trim(),
          source: fileName,
          page: page.pageNum,
          chunk_index: chunkIndex++,
        });
      }
    }

    if (chunks.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const { error: chunksError } = await supabase.from("document_chunks").insert(batch);
        if (chunksError) {
          console.error("[ParseDoc] Chunk insert error:", chunksError);
          throw chunksError;
        }
      }
    }

    console.log(`[ParseDoc] Created ${chunks.length} chunks for ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId: doc.id,
        fileName,
        chunksCreated: chunks.length,
        pagesProcessed: pages.length,
        characterCount: textContent.length,
        mode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ParseDoc] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
