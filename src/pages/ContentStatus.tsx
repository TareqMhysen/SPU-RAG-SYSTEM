import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  FileText,
  Layers,
  BarChart3,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Clock,
} from "lucide-react";

interface DocumentStats {
  id: string;
  name: string;
  created_at: string;
  chunkCount: number;
  topKeywords: string[];
  hasOcrIssues: boolean;
}

export default function ContentStatus() {
  const [documents, setDocuments] = useState<DocumentStats[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch documents
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name, created_at, content")
        .order("created_at", { ascending: false });

      if (!docs) return;

      // Fetch chunks per document
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("document_id, content");

      if (!chunks) return;

      // Process statistics
      const chunkMap = new Map<string, string[]>();
      chunks.forEach((c) => {
        const existing = chunkMap.get(c.document_id) || [];
        existing.push(c.content);
        chunkMap.set(c.document_id, existing);
      });

      // Extract keywords and detect OCR issues
      const docStats: DocumentStats[] = docs.map((doc) => {
        const docChunks = chunkMap.get(doc.id) || [];
        const allText = docChunks.join(" ");

        // Simple keyword extraction
        const words = allText
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3);

        const wordFreq = new Map<string, number>();
        words.forEach((w) => {
          wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
        });

        const topKeywords = Array.from(wordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([word]) => word);

        // Detect potential OCR issues (lots of gibberish or replacement chars)
        const hasOcrIssues =
          (allText.match(/[\uFFFD]/g)?.length || 0) > 5 ||
          (allText.match(/[^\p{L}\p{N}\s\p{P}]/gu)?.length || 0) > allText.length * 0.1;

        return {
          id: doc.id,
          name: doc.name,
          created_at: doc.created_at,
          chunkCount: docChunks.length,
          topKeywords,
          hasOcrIssues,
        };
      });

      setDocuments(docStats);
      setTotalChunks(chunks.length);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const avgChunksPerDoc = documents.length > 0 ? Math.round(totalChunks / documents.length) : 0;
  const docsWithIssues = documents.filter((d) => d.hasOcrIssues).length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-primary/15 to-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">حالة المحتوى</h1>
                <p className="text-xs text-muted-foreground">مراقبة جودة الملفات والـ Chunks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
              <Link to="/app">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  العودة للتطبيق
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: FileText,
              label: "إجمالي الملفات",
              value: documents.length,
              color: "from-purple-500 to-purple-600",
            },
            {
              icon: Layers,
              label: "إجمالي الـ Chunks",
              value: totalChunks,
              color: "from-pink-500 to-pink-600",
            },
            {
              icon: BarChart3,
              label: "متوسط Chunks/ملف",
              value: avgChunksPerDoc,
              color: "from-orange-500 to-orange-600",
            },
            {
              icon: docsWithIssues > 0 ? AlertTriangle : CheckCircle2,
              label: "ملفات بمشاكل OCR",
              value: docsWithIssues,
              color: docsWithIssues > 0 ? "from-red-500 to-red-600" : "from-green-500 to-green-600",
            },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                  >
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documents Detail */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              تفاصيل الملفات
            </CardTitle>
            <CardDescription>معلومات تفصيلية عن كل ملف والكلمات المفتاحية المستخرجة</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-6 rounded-2xl bg-muted/30 border border-border/30 hover:border-purple-500/30 transition-all duration-300"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg" dir="auto">
                              {doc.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(doc.created_at).toLocaleDateString("ar-SA")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {doc.chunkCount} chunk
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.hasOcrIssues ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              مشاكل OCR
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              جيد
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>حجم المحتوى</span>
                          <span>{doc.chunkCount} / {Math.max(...documents.map((d) => d.chunkCount))} chunks</span>
                        </div>
                        <Progress
                          value={(doc.chunkCount / Math.max(...documents.map((d) => d.chunkCount))) * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Keywords */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">الكلمات المفتاحية الأكثر تكراراً:</p>
                        <div className="flex flex-wrap gap-2">
                          {doc.topKeywords.map((kw, ki) => (
                            <Badge
                              key={ki}
                              variant="secondary"
                              className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">لا توجد ملفات</p>
                  <p className="text-sm mt-1">أضف ملفات المقرر لبدء التحليل</p>
                  <Link to="/app" className="mt-4">
                    <Button className="gap-2">
                      إضافة ملفات
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
