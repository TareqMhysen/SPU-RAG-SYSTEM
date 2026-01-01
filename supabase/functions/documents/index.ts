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

// خدمة إدارة المستندات
// Document management service
serve(async (req) => {
  // معالجة طلبات OPTIONS (preflight)
  // Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // تحليل جسم الطلب
    // Parse request body
    const { action, document, chunkSize = 500 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // إضافة مستند جديد
    // Add new document
    if (action === "add") {
      const { name, content } = document;

      // التحقق من وجود الاسم والمحتوى
      // Check if name and content exist
      if (!name || !content) {
        return new Response(
          JSON.stringify({ error: "Document name and content are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // إدراج المستند في قاعدة البيانات
      // Insert document into database
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({ name, content })
        .select()
        .single();

      if (docError) throw docError;

      // تقسيم المحتوى إلى قطع
      // Split content into chunks
      const chunks: { document_id: string; content: string; source: string; page: number; chunk_index: number }[] = [];
      
      // تقسيم حسب الفقرات أو الحجم
      // Split by paragraphs or by size
      const paragraphs = content.split(/\n\n+/);
      let currentChunk = "";
      let chunkIndex = 0;
      let pageEstimate = 1;

      for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
          chunks.push({
            document_id: doc.id,
            content: currentChunk.trim(),
            source: name,
            page: pageEstimate,
            chunk_index: chunkIndex++,
          });
          currentChunk = paragraph;
          pageEstimate = Math.ceil(chunkIndex / 3) + 1; // Estimate page
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        }
      }

      // Add remaining content
      if (currentChunk.trim()) {
        chunks.push({
          document_id: doc.id,
          content: currentChunk.trim(),
          source: name,
          page: pageEstimate,
          chunk_index: chunkIndex,
        });
      }

      // Insert chunks
      if (chunks.length > 0) {
        const { error: chunksError } = await supabase.from("document_chunks").insert(chunks);
        if (chunksError) throw chunksError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          documentId: doc.id, 
          chunksCreated: chunks.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // قائمة المستندات
    // List documents
    if (action === "list") {
      const { data: documents, error } = await supabase
        .from("documents")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });  // ترتيب حسب التاريخ (الأحدث أولاً) - Order by date (newest first)

      if (error) throw error;

      return new Response(JSON.stringify({ documents }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // حذف مستند
    // Delete document
    if (action === "delete") {
      const { documentId } = document;

      // التحقق من وجود معرف المستند
      // Check if document ID exists
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // حذف المستند من قاعدة البيانات
      // Delete document from database
      const { error } = await supabase.from("documents").delete().eq("id", documentId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in documents:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
