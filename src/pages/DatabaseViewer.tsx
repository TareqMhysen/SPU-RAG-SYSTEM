import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowRight,
  Database,
  FileText,
  Layers,
  History,
  RefreshCw,
  Search,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface DocumentRow {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  source: string;
  page: number;
  chunk_index: number;
  created_at: string;
}

interface HistoryRow {
  id: string;
  question: string;
  answer: string | null;
  citations: any;
  created_at: string;
}

export default function DatabaseViewer() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullContent, setShowFullContent] = useState<{ [key: string]: boolean }>({});

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch documents
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docs || []);

      // Fetch chunks
      const { data: chunksData, error: chunksError } = await supabase
        .from("document_chunks")
        .select("*")
        .order("created_at", { ascending: false });

      if (chunksError) throw chunksError;
      setChunks(chunksData || []);

      // Fetch history
      const { data: historyData, error: historyError } = await supabase
        .from("question_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleContent = (id: string) => {
    setShowFullContent((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChunks = chunks.filter(
    (chunk) =>
      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = history.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.answer && item.answer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportData = (tableName: string, data: any[]) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                    <Database className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">عرض قاعدة البيانات</h1>
                <p className="text-xs text-muted-foreground">استعراض جميع الجداول والمحتوى</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
              <Link to="/app">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  العودة للتطبيق
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستندات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">مستند إجمالي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأجزاء (Chunks)</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chunks.length}</div>
              <p className="text-xs text-muted-foreground">جزء إجمالي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سجل الأسئلة</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history.length}</div>
              <p className="text-xs text-muted-foreground">سجل إجمالي</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في جميع الجداول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 ml-2" />
              المستندات ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="chunks">
              <Layers className="h-4 w-4 ml-2" />
              الأجزاء ({filteredChunks.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 ml-2" />
              سجل الأسئلة ({filteredHistory.length})
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>جدول المستندات (documents)</CardTitle>
                    <CardDescription>جميع المستندات المخزنة في قاعدة البيانات</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportData("documents", documents)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تصدير JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="text-center py-8">جاري التحميل...</div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد مستندات</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>المحتوى</TableHead>
                          <TableHead>تاريخ الإنشاء</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-mono text-xs">{doc.id.substring(0, 8)}...</TableCell>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="text-sm">
                                {showFullContent[doc.id] ? (
                                  <div className="whitespace-pre-wrap break-words">{doc.content}</div>
                                ) : (
                                  <div className="text-muted-foreground">{truncateText(doc.content, 150)}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(doc.created_at).toLocaleString("ar-SA")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContent(doc.id)}
                                className="gap-1"
                              >
                                {showFullContent[doc.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                {showFullContent[doc.id] ? "إخفاء" : "عرض"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chunks Tab */}
          <TabsContent value="chunks" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>جدول الأجزاء (document_chunks)</CardTitle>
                    <CardDescription>جميع أجزاء المستندات مع البيانات الوصفية</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportData("document_chunks", chunks)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تصدير JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="text-center py-8">جاري التحميل...</div>
                  ) : filteredChunks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد أجزاء</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>معرف المستند</TableHead>
                          <TableHead>المصدر</TableHead>
                          <TableHead>الصفحة</TableHead>
                          <TableHead>الفهرس</TableHead>
                          <TableHead>المحتوى</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredChunks.map((chunk) => (
                          <TableRow key={chunk.id}>
                            <TableCell className="font-mono text-xs">{chunk.id.substring(0, 8)}...</TableCell>
                            <TableCell className="font-mono text-xs">{chunk.document_id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Badge variant="outline">{chunk.source}</Badge>
                            </TableCell>
                            <TableCell>{chunk.page}</TableCell>
                            <TableCell>{chunk.chunk_index}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="text-sm">
                                {showFullContent[chunk.id] ? (
                                  <div className="whitespace-pre-wrap break-words">{chunk.content}</div>
                                ) : (
                                  <div className="text-muted-foreground">{truncateText(chunk.content, 100)}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContent(chunk.id)}
                                className="gap-1"
                              >
                                {showFullContent[chunk.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                {showFullContent[chunk.id] ? "إخفاء" : "عرض"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>سجل الأسئلة (question_history)</CardTitle>
                    <CardDescription>جميع الأسئلة والأجوبة المسجلة</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportData("question_history", history)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تصدير JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="text-center py-8">جاري التحميل...</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا يوجد سجل</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>السؤال</TableHead>
                          <TableHead>الإجابة</TableHead>
                          <TableHead>الاستشهادات</TableHead>
                          <TableHead>تاريخ الإنشاء</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.id.substring(0, 8)}...</TableCell>
                            <TableCell className="font-medium max-w-md">{item.question}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="text-sm">
                                {showFullContent[item.id] ? (
                                  <div className="whitespace-pre-wrap break-words">{item.answer || "لا توجد إجابة"}</div>
                                ) : (
                                  <div className="text-muted-foreground">
                                    {truncateText(item.answer || "لا توجد إجابة", 100)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.citations ? (
                                <Badge variant="secondary">{JSON.stringify(item.citations).length} حرف</Badge>
                              ) : (
                                <Badge variant="outline">لا يوجد</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleString("ar-SA")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContent(item.id)}
                                className="gap-1"
                              >
                                {showFullContent[item.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                {showFullContent[item.id] ? "إخفاء" : "عرض"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

