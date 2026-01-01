import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Send,
  BookOpen,
  FileText,
  History,
  Sparkles,
  Upload,
  Trash2,
  GraduationCap,
  Brain,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Plus,
  MessageSquare,
  Lightbulb,
  Layers,
  Search,
  Clock,
  Quote,
  Zap,
  Target,
  BookMarked,
  Home,
  BarChart3,
  Heart,
  AlertCircle,
  Copy,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { TypewriterText } from "@/components/typewriter-text";
import { SettingsDialog } from "@/components/settings-dialog";
import { EvidencePanel } from "@/components/evidence-panel";
import { FormattedAnswer } from "@/components/formatted-answer";
import { useSettings } from "@/hooks/use-settings";
import { copyToClipboard } from "@/lib/copy-utils";

interface Citation {
  source: string;
  page: number;
  content: string;
}

interface RAGResponse {
  answer: string;
  citations: Citation[];
  chunks: string[];
}

interface HistoryItem {
  id: string;
  question: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  created_at: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizCitation {
  source: string;
  page: number;
  quote: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  citations?: QuizCitation[];
}

interface SummaryBullet {
  text: string;
  citations: QuizCitation[];
}

// Sample course content for Machine Learning
const SAMPLE_DOCS = [
  {
    name: "Chapter 1 - Introduction to Machine Learning",
    content: `Machine Learning Introduction

Machine Learning (ML) is a subset of Artificial Intelligence (AI) that enables systems to learn and improve from experience without being explicitly programmed.

Types of Machine Learning:

1. Supervised Learning
Supervised learning uses labeled datasets to train algorithms. The model learns from input-output pairs.
Examples: Classification, Regression
Applications: Spam detection, Price prediction, Medical diagnosis

2. Unsupervised Learning
Unsupervised learning works with unlabeled data to find hidden patterns or groupings.
Examples: Clustering, Dimensionality Reduction
Applications: Customer segmentation, Anomaly detection

3. Reinforcement Learning
Reinforcement learning trains agents to make decisions by rewarding desired behaviors.
Examples: Game playing, Robotics
Applications: Self-driving cars, Game AI

Key Concepts:
- Features: Input variables used for prediction
- Labels: Output variables we want to predict
- Training Data: Data used to train the model
- Test Data: Data used to evaluate model performance
- Model: Mathematical representation learned from data`,
  },
  {
    name: "Chapter 2 - Overfitting and Regularization",
    content: `Overfitting and Regularization

What is Overfitting?
Overfitting occurs when a model learns the training data too well, including its noise and outliers. This results in poor generalization to new, unseen data.

Signs of Overfitting:
- High accuracy on training data
- Low accuracy on test/validation data
- Complex model with many parameters
- Model memorizes rather than learns

Causes of Overfitting:
1. Too complex model
2. Too little training data
3. Training for too many epochs
4. Noise in training data

How to Prevent Overfitting:

1. Cross-Validation
Split data into k folds, train on k-1, validate on 1. Repeat k times.

2. Regularization
L1 Regularization (Lasso): Adds absolute value of weights to loss function
L2 Regularization (Ridge): Adds squared weights to loss function
Elastic Net: Combines L1 and L2

3. Dropout
Randomly disable neurons during training to prevent co-adaptation.

4. Early Stopping
Stop training when validation loss starts increasing.

5. Data Augmentation
Artificially increase training data size through transformations.

6. Reduce Model Complexity
Use simpler models with fewer parameters.

Bias-Variance Tradeoff:
- High Bias (Underfitting): Model too simple
- High Variance (Overfitting): Model too complex
- Goal: Find optimal balance`,
  },
  {
    name: "Chapter 3 - Neural Networks Basics",
    content: `Neural Networks Fundamentals

What are Neural Networks?
Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers.

Architecture Components:

1. Input Layer
Receives raw input data. Number of neurons equals number of features.

2. Hidden Layers
Process information between input and output. Can have multiple layers (deep learning).

3. Output Layer
Produces final predictions. Number of neurons depends on task type.

4. Weights and Biases
Parameters learned during training that determine neuron connections strength.

Activation Functions:

1. Sigmoid: Range (0,1), Used for binary classification

2. ReLU: f(x) = max(0,x), Most popular, helps with vanishing gradient

3. Tanh: Range (-1,1), Zero-centered

4. Softmax: Used for multi-class classification, Outputs probability distribution

Training Process:

1. Forward Propagation
Input flows through network, produces prediction.

2. Loss Calculation
Compare prediction with actual label using loss function.

3. Backpropagation
Calculate gradients of loss with respect to weights.

4. Weight Update
Adjust weights using optimization algorithm (SGD, Adam).

Common Loss Functions:
- MSE (Regression)
- Cross-Entropy (Classification)
- Binary Cross-Entropy (Binary Classification)`,
  },
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState("ask");

  // History search and filter state
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const [studyTopic, setStudyTopic] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [summaryBullets, setSummaryBullets] = useState<SummaryBullet[]>([]);
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [studyLoading, setStudyLoading] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background upload state
  interface UploadTask {
    id: string;
    fileName: string;
    status: "processing" | "completed" | "failed";
    progress: number;
    message?: string;
    chunksCreated?: number;
  }
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);

  const { toast } = useToast();
  const { settings, setSettings, loaded: settingsLoaded } = useSettings();

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("question_history")
      .select("id, question, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  }, []);

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase.from("documents").select("id, name, created_at").order("created_at", { ascending: false });
    if (data) setDocuments(data);
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchDocuments();
  }, [fetchHistory, fetchDocuments]);

  // Filter history based on search and date
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search filter
      if (historySearch.trim() && !item.question.toLowerCase().includes(historySearch.toLowerCase())) {
        return false;
      }
      // Date filter
      if (historyDateFilter !== "all") {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        if (historyDateFilter === "today") {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (itemDate < today) return false;
        } else if (historyDateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < weekAgo) return false;
        } else if (historyDateFilter === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < monthAgo) return false;
        }
      }
      return true;
    });
  }, [history, historySearch, historyDateFilter]);

  // Copy functions
  const copyAnswer = async () => {
    if (!response?.answer) return;
    await copyToClipboard(response.answer, "تم نسخ الإجابة بنجاح", "فشل في نسخ الإجابة");
  };

  const copyEvidence = async () => {
    if (!response?.citations?.length) return;
    const evidenceText = response.citations
      .map((c, i) => `[${i + 1}] ${c.source} - صفحة ${c.page}\n${c.content}`)
      .join("\n\n");
    await copyToClipboard(evidenceText, "تم نسخ الأدلة بنجاح", "فشل في نسخ الأدلة");
  };

  const handleAsk = useCallback(
    async (questionQuery?: string) => {
      const q = questionQuery || query;
      if (!q.trim()) return;

      setLoading(true);
      setResponse(null);
      try {
        const { data, error } = await supabase.functions.invoke("rag-ask", {
          body: { query: q, topK: settings.topK },
        });
        if (error) throw error;
        setResponse(data);
        fetchHistory();
      } catch {
        toast({ title: "خطأ", description: "حدث خطأ أثناء معالجة السؤال", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [query, settings.topK, fetchHistory, toast]
  );

  const handleUploadDocument = async () => {
    if (!docName.trim() || !docContent.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم ومحتوى المستند", variant: "destructive" });
      return;
    }

    setUploadLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("documents", {
        body: { action: "add", document: { name: docName, content: docContent } },
      });
      if (error) throw error;
      toast({ title: "تم بنجاح", description: `تم إضافة "${docName}" وتقسيمه إلى ${data.chunksCreated} جزء` });
      setDocName("");
      setDocContent("");
      fetchDocuments();
    } catch {
      toast({ title: "خطأ", description: "فشل في رفع المستند", variant: "destructive" });
    } finally {
      setUploadLoading(false);
    }
  };

  // Background file upload with progress
  const handleFileUpload = async (file: File) => {
    const allowedExtensions = [".pdf", ".txt", ".md"];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!allowedExtensions.includes(fileExt)) {
      toast({ title: "خطأ", description: "يرجى رفع ملف PDF أو TXT أو MD", variant: "destructive" });
      return;
    }

    // Create upload task
    const taskId = crypto.randomUUID();
    const newTask: UploadTask = {
      id: taskId,
      fileName: file.name,
      status: "processing",
      progress: 10,
      message: "جاري القراءة...",
    };
    setUploadTasks(prev => [newTask, ...prev]);

    // Process in background
    const processFile = async () => {
      try {
        if (fileExt === ".txt" || fileExt === ".md") {
          // Text files - quick processing
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 30, message: "جاري التحليل..." } : t));
          const text = await file.text();
          
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 60, message: "جاري التقسيم..." } : t));
          const { data, error } = await supabase.functions.invoke("documents", {
            body: { action: "add", document: { name: file.name, content: text } },
          });
          
          if (error) throw error;
          
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            status: "completed", 
            progress: 100, 
            message: "تمت المعالجة",
            chunksCreated: data.chunksCreated 
          } : t));
          
          fetchDocuments();
        } else {
          // PDF files - OCR processing (takes longer)
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 20, message: "جاري رفع الملف..." } : t));
          
          const formData = new FormData();
          formData.append("file", file);
          formData.append("mode", settings.processingMode);

          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 40, message: "جاري OCR..." } : t));
          
          const { data, error } = await supabase.functions.invoke("parse-document", {
            body: formData,
          });

          if (error) throw error;

          const dataJson = data as { error?: string; success?: boolean; message?: string; chunksCreated?: number };

          if (dataJson?.error || dataJson?.success === false) {
            throw new Error(dataJson?.error || dataJson?.message || "Upload failed");
          }
          
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            status: "completed", 
            progress: 100, 
            message: "تمت المعالجة",
            chunksCreated: dataJson.chunksCreated 
          } : t));
          
          fetchDocuments();
        }
      } catch (err) {
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          status: "failed", 
          progress: 100, 
          message: err instanceof Error ? err.message : "فشل في المعالجة"
        } : t));
      }
    };

    // Start background processing
    processFile();
  };

  const removeUploadTask = (taskId: string) => {
    setUploadTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const addSampleDocuments = async () => {
    setUploadLoading(true);
    try {
      for (const doc of SAMPLE_DOCS) {
        await supabase.functions.invoke("documents", {
          body: { action: "add", document: doc },
        });
      }
      toast({ title: "تم إضافة مستندات تجريبية", description: "تم إضافة 3 فصول من مقرر Machine Learning" });
      fetchDocuments();
    } catch {
      toast({ title: "خطأ", description: "فشل في إضافة المستندات", variant: "destructive" });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await supabase.functions.invoke("documents", {
        body: { action: "delete", document: { documentId: id } },
      });
      toast({ title: "تم الحذف" });
      fetchDocuments();
    } catch {
      toast({ title: "خطأ", description: "فشل في الحذف", variant: "destructive" });
    }
  };

  const generateFlashcards = async () => {
    if (!studyTopic.trim()) return;
    setFlashcardsLoading(true);
    setFlashcards([]);
    try {
      const { data, error } = await supabase.functions.invoke("study-tools", {
        body: { topic: studyTopic, n: 5, type: "flashcards" },
      });
      if (error) throw error;
      setFlashcards(data.flashcards || []);
      setCurrentCard(0);
      setShowAnswer(false);
      setFlipped(false);
    } catch {
      toast({ title: "خطأ", description: "فشل في إنشاء البطاقات", variant: "destructive" });
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!studyTopic.trim()) return;
    setQuizLoading(true);
    setQuizQuestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("study-tools", {
        body: { topic: studyTopic, n: 5, type: "quiz", difficulty: quizDifficulty },
      });
      if (error) throw error;
      setQuizQuestions(data.questions || []);
      setSelectedAnswers({});
    } catch {
      toast({ title: "خطأ", description: "فشل في إنشاء الاختبار", variant: "destructive" });
    } finally {
      setQuizLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!studyTopic.trim()) return;
    setSummaryLoading(true);
    setSummaryBullets([]);
    try {
      const { data, error } = await supabase.functions.invoke("study-tools", {
        body: { topic: studyTopic, n: 6, type: "summarize" },
      });
      if (error) throw error;
      setSummaryBullets(data.bullets || []);
    } catch {
      toast({ title: "خطأ", description: "فشل في إنشاء التلخيص", variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const clearHistory = async () => {
    await supabase.from("question_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setHistory([]);
  };

  const handleFlipCard = () => {
    setFlipped(true);
    setShowAnswer(!showAnswer);
    setTimeout(() => setFlipped(false), 300);
  };

  const quizScore = Object.entries(selectedAnswers).reduce((acc, [idx, ans]) => {
    return acc + (quizQuestions[parseInt(idx)]?.correct === ans ? 1 : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 dark:bg-purple-500/10 blur-3xl animate-pulse bg-drift" style={{ animationDuration: '15s' }} />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-primary/5 dark:bg-cyan-500/10 blur-3xl animate-pulse bg-drift" style={{ animationDuration: '20s', animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-primary/5 dark:bg-pink-500/10 blur-3xl animate-pulse bg-drift" style={{ animationDuration: '18s', animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-pink-500/3 dark:from-purple-500/5 dark:via-transparent dark:to-pink-500/5 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" dir="rtl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
                  <GraduationCap className="h-7 w-7 text-primary-foreground" />
                </div>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-l from-primary via-primary/80 to-foreground bg-clip-text text-transparent">
                    RAG Course Assistant
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  مساعد ذكي يجيب من مواد المقرر مع الاستشهادات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-purple-500/10">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">الرئيسية</span>
                </Button>
              </Link>
              <Link to="/status">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-purple-500/10">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">الحالة</span>
                </Button>
              </Link>
              <Badge variant="secondary" className="hidden sm:flex gap-1 px-3 py-1">
                <Layers className="h-3 w-3" />
                {documents.length} مستند
              </Badge>
              <SettingsDialog settings={settings} onChange={setSettings} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex justify-center">
            <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-muted/50 p-1.5 backdrop-blur-sm border border-border/50">
              <TabsTrigger
                value="ask"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">اسأل</span>
              </TabsTrigger>
              <TabsTrigger
                value="study"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">أدوات الدراسة</span>
              </TabsTrigger>
              <TabsTrigger
                value="docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">المستندات</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ASK TAB */}
          <TabsContent value="ask" className="space-y-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row-reverse gap-8 items-start">
              {/* Sidebar - Appears on RIGHT in RTL */}
              <div className="w-full lg:w-[300px] space-y-6">
                {/* History Card - Enhanced */}
                <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm overflow-hidden relative isolate">
                  {/* Animated Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  
                  <CardHeader className="pb-3 relative z-10 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/50">
                    <div className="flex flex-row-reverse items-center justify-between">
                      <CardTitle className="flex flex-row-reverse items-center gap-2 text-base">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md opacity-50" />
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        سجل الأسئلة
                        {filteredHistory.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                            {filteredHistory.length}
                          </Badge>
                        )}
                      </CardTitle>
                      {history.length > 0 && (
                        <Button variant="ghost" size="icon" onClick={clearHistory} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-300 hover:scale-110">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Search Input - Enhanced */}
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <Input
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="ابحث في السجل..."
                        className="h-10 pr-10 pl-9 text-sm rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                        dir="rtl"
                      />
                      {historySearch && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHistorySearch("")}
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-300 hover:scale-110"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Date Filter - Enhanced */}
                    <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-gradient-to-r from-muted/40 to-muted/20 border border-border/30" dir="rtl">
                      {([
                        { value: "all", label: "الكل", icon: Filter },
                        { value: "today", label: "اليوم", icon: Calendar },
                        { value: "week", label: "الأسبوع", icon: Calendar },
                        { value: "month", label: "الشهر", icon: Calendar },
                      ] as const).map((f) => {
                        const Icon = f.icon;
                        return (
                          <Button
                            key={f.value}
                            variant={historyDateFilter === f.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setHistoryDateFilter(f.value)}
                            className={`h-8 text-xs px-3 rounded-lg transition-all duration-300 ${
                              historyDateFilter === f.value 
                                ? "shadow-md shadow-primary/20 scale-105" 
                                : "hover:bg-muted/50 hover:scale-105"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 ml-1.5" />
                            {f.label}
                          </Button>
                        );
                      })}
                    </div>

                    <Separator className="opacity-50" />

                    {/* History List */}
                    <ScrollArea className="h-[200px]">
                      {filteredHistory.length > 0 ? (
                        <div className="space-y-2">
                          {filteredHistory.map((item, idx) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setQuery(item.question);
                                handleAsk(item.question);
                              }}
                              className="w-full text-right p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-primary/30 animate-fade-in-up group relative overflow-hidden"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                              <p 
                                className="text-sm font-medium text-right text-foreground group-hover:text-primary transition-colors relative z-10" 
                                dir="rtl"
                                style={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {item.question}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1.5 flex flex-row-reverse items-center gap-1 justify-end relative z-10">
                                <Clock className="h-3 w-3 group-hover:scale-110 transition-transform duration-300" />
                                {new Date(item.created_at).toLocaleDateString("ar-SA")}
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : history.length > 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground animate-fade-in">
                          <Search className="h-10 w-10 mb-2 opacity-30" />
                          <p className="text-sm">لا توجد نتائج</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => { setHistorySearch(""); setHistoryDateFilter("all"); }}
                            className="text-xs mt-1"
                          >
                            مسح الفلاتر
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground animate-fade-in">
                          <History className="h-10 w-10 mb-2 opacity-30" />
                          <p className="text-sm">لا توجد أسئلة سابقة</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Quick Tips - Redesigned */}
                <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm overflow-hidden relative isolate">
                  {/* Animated Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  
                  <CardHeader className="pb-4 relative z-10 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
                    <CardTitle className="flex flex-row-reverse items-center gap-3 text-base" dir="rtl">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-50" />
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-lg shadow-primary/10">
                          <Lightbulb className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                        </div>
                      </div>
                      <span className="font-bold">نصائح للأسئلة</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-4 space-y-3">
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-4 hover:border-blue-500/40 hover:shadow-md transition-all duration-300" dir="rtl">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="flex flex-row-reverse items-center gap-3 relative z-10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-right flex-1">كن محدداً في سؤالك</span>
                      </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-4 hover:border-purple-500/40 hover:shadow-md transition-all duration-300" dir="rtl">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="flex flex-row-reverse items-center gap-3 relative z-10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform duration-300">
                          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-right flex-1">اسأل عن مفهوم واحد في كل مرة</span>
                      </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 p-4 hover:border-green-500/40 hover:shadow-md transition-all duration-300" dir="rtl">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="flex flex-row-reverse items-center gap-3 relative z-10">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-right flex-1">استخدم المصطلحات التقنية</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area - Appears on LEFT in RTL */}
              <div className="flex-1 space-y-6">
                {/* Question Input Card - Enhanced */}
                <Card className="overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm animate-fade-in-up hover:shadow-primary/10 transition-shadow duration-300 relative isolate">
                  {/* Animated Background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  
                  <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden border-b border-border/50">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
                    <CardTitle className="flex flex-row-reverse items-center gap-3 text-xl relative z-10">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                          <MessageSquare className="h-6 w-6 text-primary animate-pulse-slow" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-l from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                          اطرح سؤالك
                        </h3>
                        <CardDescription className="text-right mt-1">سيتم البحث في مواد المقرر وإعطاء إجابة مع المصادر</CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 relative z-10">
                    <div className="relative group">
                      <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAsk())}
                        placeholder="مثال: ما هو الـ Overfitting وكيف نتجنبه؟"
                        className="min-h-[160px] resize-none border-2 border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all duration-300 text-base leading-relaxed text-right rounded-xl p-4"
                        dir="rtl"
                      />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-lg border border-border/30">
                        <span className="font-medium">Enter</span>
                        <span>للإرسال</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAsk()}
                      disabled={loading || !query.trim()}
                      size="lg"
                      className="w-full h-14 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] hover:-translate-y-0.5"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin relative z-10" />
                          <span className="relative z-10">جاري البحث والتحليل...</span>
                        </>
                      ) : (
                        <>
                          <Search className="ml-2 h-5 w-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                          <span className="relative z-10">إرسال السؤال</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Response Card - Enhanced */}
                {response && (
                  <Card className="overflow-hidden border-border/50 shadow-2xl shadow-green-500/10 bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm animate-scale-in hover:shadow-green-500/20 transition-shadow duration-300 relative isolate">
                    {/* Animated Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    
                    <CardHeader className="pb-4 bg-gradient-to-r from-green-500/15 via-green-500/10 to-transparent relative overflow-hidden border-b border-border/50">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,197,94,0.1),transparent)] animate-shimmer" />
                      <div className="flex flex-row-reverse items-center justify-between relative z-10">
                        <CardTitle className="flex flex-row-reverse items-center gap-3">
                          <div className="relative group">
                            <div className="absolute inset-0 bg-green-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse-slow" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold bg-gradient-to-l from-green-600 via-emerald-500 to-green-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                              الإجابة
                            </h3>
                          </div>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyAnswer}
                            className="h-9 text-xs gap-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 border-green-500/30 group relative overflow-hidden"
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <Copy className="h-3.5 w-3.5 relative z-10" />
                            <span className="relative z-10 font-semibold">نسخ الإجابة</span>
                          </Button>
                          {response.citations && response.citations.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyEvidence}
                              className="h-9 text-xs gap-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 hover:border-primary/50 transition-all duration-300 border-primary/30 group relative overflow-hidden"
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                              <Copy className="h-3.5 w-3.5 relative z-10" />
                              <span className="relative z-10 font-semibold">نسخ الأدلة</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FormattedAnswer
                        text={response.answer}
                        className="text-right"
                        dir="auto"
                        speedMs={settingsLoaded ? settings.typewriterSpeed : 12}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Evidence Panel (below answer) */}
                {response && response.citations && response.citations.length > 0 && (
                  <EvidencePanel citations={response.citations} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* STUDY TAB */}
          <TabsContent value="study" className="space-y-8 animate-fade-in">
            <div className="max-w-3xl mx-auto">
              {/* Topic Input - Enhanced */}
              <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm overflow-hidden relative">
                {/* Animated Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.05),transparent)] translate-x-[-100%] animate-shimmer" />
                
                <CardHeader className="bg-gradient-to-l from-purple-500/15 via-purple-500/10 to-transparent relative z-10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-l from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                        أدوات الدراسة الذكية
                      </CardTitle>
                      <CardDescription className="mt-1">أنشئ بطاقات مراجعة واختبارات من محتوى المقرر</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 relative z-10">
                  <div className="relative group">
                    <Input
                      value={studyTopic}
                      onChange={(e) => setStudyTopic(e.target.value)}
                      placeholder="أدخل الموضوع (مثال: Overfitting, Neural Networks, Regularization)"
                      className="h-14 text-base pr-12 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-purple-500/50 transition-all duration-300"
                      dir="auto"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                      <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4" dir="rtl">
                    {/* Flashcards Button - Enhanced */}
                    <Button
                      onClick={generateFlashcards}
                      disabled={flashcardsLoading || summaryLoading || quizLoading || !studyTopic.trim()}
                      variant="outline"
                      size="lg"
                      className={`h-20 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden flex flex-row-reverse items-center gap-3 ${
                        flashcardsLoading 
                          ? "bg-gradient-to-br from-blue-500/25 to-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/20" 
                          : "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 text-blue-600 dark:text-blue-400 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {flashcardsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin relative z-10" />
                      ) : (
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300">
                          <BookMarked className="h-5 w-5" />
                        </div>
                      )}
                      <div className="text-right relative z-10 flex-1" dir="rtl">
                        <div className="font-bold text-base">Flashcards</div>
                        <div className="text-xs opacity-80 mt-0.5">بطاقات مراجعة</div>
                      </div>
                    </Button>
                    
                    {/* Summary Button - Enhanced */}
                    <Button
                      onClick={generateSummary}
                      disabled={flashcardsLoading || summaryLoading || quizLoading || !studyTopic.trim()}
                      variant="outline"
                      size="lg"
                      className={`h-20 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden flex flex-row-reverse items-center gap-3 ${
                        summaryLoading 
                          ? "bg-gradient-to-br from-yellow-500/25 to-yellow-500/15 border-yellow-500 text-yellow-600 dark:text-yellow-400 shadow-xl shadow-yellow-500/20" 
                          : "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/20 hover:to-yellow-500/10 hover:border-yellow-500/50 hover:text-yellow-600 dark:hover:text-yellow-400 text-yellow-600 dark:text-yellow-400 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {summaryLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin relative z-10" />
                      ) : (
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 group-hover:bg-yellow-500/30 group-hover:scale-110 transition-all duration-300">
                          <Lightbulb className="h-5 w-5" />
                        </div>
                      )}
                      <div className="text-right relative z-10 flex-1" dir="rtl">
                        <div className="font-bold text-base">Summary</div>
                        <div className="text-xs opacity-80 mt-0.5">تلخيص</div>
                      </div>
                    </Button>
                    
                    {/* Quiz Button - Enhanced */}
                    <Button
                      onClick={generateQuiz}
                      disabled={flashcardsLoading || summaryLoading || quizLoading || !studyTopic.trim()}
                      variant="outline"
                      size="lg"
                      className={`h-20 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden flex flex-row-reverse items-center gap-3 ${
                        quizLoading 
                          ? "bg-gradient-to-br from-green-500/25 to-green-500/15 border-green-500 text-green-600 dark:text-green-400 shadow-xl shadow-green-500/20" 
                          : "border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400 text-green-600 dark:text-green-400 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/10"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {quizLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin relative z-10" />
                      ) : (
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-300">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                      )}
                      <div className="text-right relative z-10 flex-1" dir="rtl">
                        <div className="font-bold text-base">Quiz</div>
                        <div className="text-xs opacity-80 mt-0.5">اختبار</div>
                      </div>
                    </Button>
                  </div>

                  {/* Difficulty Selector for Quiz - Enhanced with Colors */}
                  <div className="flex flex-row-reverse items-center gap-4 flex-wrap p-4 rounded-xl bg-gradient-to-r from-muted/40 to-muted/20 border border-border/30" dir="rtl">
                    <span className="text-sm font-semibold text-foreground flex flex-row-reverse items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      صعوبة الاختبار:
                    </span>
                    <div className="flex flex-row-reverse gap-2">
                      {([
                        { value: "easy", label: "سهل", color: "green" },
                        { value: "medium", label: "متوسط", color: "yellow" },
                        { value: "hard", label: "صعب", color: "red" },
                      ] as const).map((d) => {
                        const isActive = quizDifficulty === d.value;
                        const colorClasses = {
                          green: isActive 
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg shadow-green-500/30" 
                            : "border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:border-green-500/50",
                          yellow: isActive 
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/30" 
                            : "border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50",
                          red: isActive 
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg shadow-red-500/30" 
                            : "border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50",
                        };
                        return (
                          <Button
                            key={d.value}
                            variant="outline"
                            size="sm"
                            onClick={() => setQuizDifficulty(d.value)}
                            className={`rounded-lg transition-all duration-300 border-2 font-semibold ${
                              isActive 
                                ? `${colorClasses[d.color]} scale-110` 
                                : `${colorClasses[d.color]} hover:scale-105`
                            }`}
                          >
                            {d.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Display */}
              {summaryBullets.length > 0 && (
                <Card className="mt-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm animate-scale-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      التلخيص
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {summaryBullets.map((bullet, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                        <p className="text-base leading-relaxed" dir="auto">{bullet.text}</p>
                        {bullet.citations && bullet.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-2">
                            {bullet.citations.map((c, ci) => (
                              <Badge key={ci} variant="outline" className="text-xs gap-1">
                                <Quote className="h-3 w-3" />
                                {c.source} ص{c.page}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Flashcards Display */}
              {flashcards.length > 0 && (
                <Card className="mt-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm animate-scale-in">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-blue-500" />
                        بطاقات المراجعة
                      </span>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {currentCard + 1} / {flashcards.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Card */}
                    <div
                      onClick={handleFlipCard}
                      className={`relative min-h-[220px] p-8 rounded-2xl cursor-pointer transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 ${
                        flipped ? "scale-95 rotate-y-180" : "scale-100"
                      } ${
                        showAnswer
                          ? "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 hover:shadow-xl hover:shadow-green-500/20"
                          : "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/20"
                      } border-2 group`}
                    >
                      <div className="absolute top-4 right-4">
                        <Badge variant={showAnswer ? "default" : "outline"} className="text-xs">
                          {showAnswer ? "الإجابة" : "السؤال"}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center justify-center h-full pt-6 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-xl font-medium text-center leading-relaxed relative z-10 animate-fade-in" dir="auto">
                          {showAnswer ? flashcards[currentCard].answer : flashcards[currentCard].question}
                        </p>
                        <p className="text-sm text-muted-foreground mt-6 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                          {showAnswer ? "اضغط للعودة للسؤال" : "اضغط لرؤية الإجابة"}
                        </p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentCard(Math.max(0, currentCard - 1));
                          setShowAnswer(false);
                        }}
                        disabled={currentCard === 0}
                        className="flex-1 h-12 rounded-xl hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 group"
                      >
                        <ChevronRight className="h-5 w-5 ml-2 group-hover:-translate-x-1 transition-transform duration-300" />
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1));
                          setShowAnswer(false);
                        }}
                        disabled={currentCard === flashcards.length - 1}
                        className="flex-1 h-12 rounded-xl hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 group"
                      >
                        التالي
                        <ChevronLeft className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Display */}
              {quizQuestions.length > 0 && (
                <Card className="mt-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm animate-scale-in">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-green-500" />
                        اختبار قصير
                      </span>
                      {Object.keys(selectedAnswers).length === quizQuestions.length && (
                        <Badge variant={quizScore >= quizQuestions.length * 0.7 ? "default" : "secondary"} className="text-sm px-4 py-1">
                          النتيجة: {quizScore} / {quizQuestions.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {quizQuestions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-6 rounded-2xl bg-muted/30 border border-border/50 animate-fade-in"
                        style={{ animationDelay: `${qIdx * 100}ms` }}
                      >
                        <p className="font-semibold mb-4 text-lg" dir="auto">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-3">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = oIdx === q.correct;
                            const showResult = selectedAnswers[qIdx] !== undefined;
                            const isWrong = isSelected && !isCorrect;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  const newAnswers = { ...selectedAnswers, [qIdx]: oIdx };
                                  setSelectedAnswers(newAnswers);
                                  // Show success toast for correct answer
                                  if (oIdx === q.correct) {
                                    setTimeout(() => {
                                      toast({
                                        title: "إجابة صحيحة! 🎉",
                                        description: "ممتاز! لقد أجبت بشكل صحيح",
                                        className: "bg-green-500/10 border-green-500/50",
                                      });
                                    }, 100);
                                  } else {
                                    // Show error toast for wrong answer
                                    setTimeout(() => {
                                      toast({
                                        title: "إجابة خاطئة ❌",
                                        description: "الإجابة الصحيحة هي: " + q.options[q.correct],
                                        variant: "destructive",
                                      });
                                    }, 100);
                                  }
                                }}
                                disabled={showResult}
                                className={`w-full text-right p-4 rounded-xl text-sm transition-all duration-300 flex flex-row-reverse items-center gap-3 relative overflow-hidden ${
                                  showResult
                                    ? isCorrect
                                      ? "bg-gradient-to-r from-green-500/30 to-green-500/10 text-green-700 dark:text-green-200 border-2 border-green-500 shadow-lg shadow-green-500/20 animate-scale-in"
                                      : isWrong
                                      ? "bg-gradient-to-r from-red-500/30 to-red-500/10 text-red-700 dark:text-red-200 border-2 border-red-500 shadow-lg shadow-red-500/20 animate-scale-in"
                                      : "bg-muted/30 border border-border/50 text-muted-foreground"
                                    : "bg-background hover:bg-accent border border-border/50 hover:border-primary/50 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md"
                                }`}
                                dir="auto"
                              >
                                {showResult && isCorrect && (
                                  <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
                                )}
                                {showResult && isWrong && (
                                  <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                                )}
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 relative z-10 transition-all duration-300 ${
                                    showResult
                                      ? isCorrect
                                        ? "border-green-500 bg-green-500/30 scale-110"
                                        : isWrong
                                        ? "border-red-500 bg-red-500/30 scale-110"
                                        : "border-border/50"
                                      : "border-border group-hover:border-primary/50"
                                  }`}
                                >
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 animate-scale-in" />
                                  )}
                                  {showResult && isWrong && (
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 animate-scale-in" />
                                  )}
                                  {!showResult && <span className="text-xs font-medium">{String.fromCharCode(65 + oIdx)}</span>}
                                </div>
                                <span className="flex-1 text-right relative z-10 font-medium">{opt}</span>
                                {showResult && isCorrect && (
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 text-2xl animate-bounce-slow">
                                    ✓
                                  </div>
                                )}
                                {showResult && isWrong && (
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 dark:text-red-400 text-2xl animate-bounce-slow">
                                    ✗
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="docs" className="space-y-8 animate-fade-in">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Documents List Card - Enhanced Design */}
              <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm order-first lg:order-last overflow-hidden relative">
                {/* Animated Background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <CardHeader className="relative z-10 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-50" />
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                          <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">المستندات المضافة</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">جميع المستندات المتاحة</p>
                      </div>
                    </span>
                    <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                      <Layers className="h-3 w-3 ml-1.5" />
                      {documents.length} مستند
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ScrollArea className="h-[450px] pr-4">
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 transition-all duration-300 border border-border/30 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 animate-fade-in-up hover:scale-[1.02] hover:-translate-y-1"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="flex flex-row-reverse items-center justify-between p-4 relative z-10">
                              <div className="flex flex-row-reverse items-center gap-4 flex-1 min-w-0">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-0 group-hover:opacity-50" />
                                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-blue-500/15 group-hover:from-primary/25 group-hover:to-blue-500/25 group-hover:scale-110 transition-all duration-300 shadow-md shadow-primary/10">
                                    <FileText className="h-7 w-7 text-primary group-hover:rotate-12 transition-transform duration-300" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="font-semibold text-base truncate group-hover:text-primary transition-colors duration-300 bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text" dir="auto">
                                    {doc.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1.5 flex flex-row-reverse items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
                                    {new Date(doc.created_at).toLocaleDateString("ar-SA")}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl hover:scale-110 hover:rotate-12 relative z-10 h-10 w-10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl" />
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30">
                            <FileText className="h-12 w-12 opacity-50" />
                          </div>
                        </div>
                        <p className="font-semibold text-base mb-1">لا توجد مستندات</p>
                        <p className="text-sm text-center max-w-xs">أضف مواد الكورس للبدء باستخدام المساعد</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Upload Card - Enhanced Design */}
              <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card/90 via-card/80 to-card/90 backdrop-blur-sm overflow-hidden order-last lg:order-first relative">
                {/* Animated Background */}
                <div className="absolute top-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,165,0,0.03),transparent)] translate-x-[-100%] animate-shimmer" />
                
                <CardHeader className="relative z-10 bg-gradient-to-l from-orange-500/10 via-orange-500/5 to-transparent border-b border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-50" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">إضافة مستند جديد</CardTitle>
                      <CardDescription className="mt-0.5">ارفع ملفات PDF, TXT, MD أو الصق النص مباشرة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 relative z-10">
                  {/* Mode Toggle - Enhanced */}
                  <div className="flex gap-2 p-1.5 bg-gradient-to-r from-muted/60 to-muted/40 rounded-xl border border-border/30">
                    <button
                      onClick={() => setUploadMode("file")}
                      className={`flex-1 py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group ${
                        uploadMode === "file" 
                          ? "bg-gradient-to-br from-orange-500/20 to-orange-500/10 shadow-lg shadow-orange-500/10 border border-orange-500/30 scale-[1.02]" 
                          : "hover:bg-background/50 border border-transparent"
                      }`}
                    >
                      {uploadMode === "file" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      )}
                      <FileUp className={`h-4 w-4 relative z-10 ${uploadMode === "file" ? "text-orange-600 dark:text-orange-400" : ""}`} />
                      <span className="relative z-10">رفع ملف</span>
                    </button>
                    <button
                      onClick={() => setUploadMode("text")}
                      className={`flex-1 py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group ${
                        uploadMode === "text" 
                          ? "bg-gradient-to-br from-orange-500/20 to-orange-500/10 shadow-lg shadow-orange-500/10 border border-orange-500/30 scale-[1.02]" 
                          : "hover:bg-background/50 border border-transparent"
                      }`}
                    >
                      {uploadMode === "text" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      )}
                      <FileText className={`h-4 w-4 relative z-10 ${uploadMode === "text" ? "text-orange-600 dark:text-orange-400" : ""}`} />
                      <span className="relative z-10">لصق نص</span>
                    </button>
                  </div>

                  {uploadMode === "file" ? (
                    <div className="space-y-6">
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileChange} className="hidden" />
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                          dragActive
                            ? "border-primary bg-gradient-to-br from-primary/15 to-primary/5 scale-[1.02] shadow-xl shadow-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-gradient-to-br hover:from-muted/40 hover:to-muted/20 hover:shadow-lg"
                        }`}
                      >
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10">
                          <div className="relative inline-block mb-5">
                            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
                            <div className={`relative flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/10 transition-all duration-300 ${
                              dragActive ? "scale-110 rotate-6" : "group-hover:scale-110 group-hover:rotate-6"
                            }`}>
                              <FileUp className={`h-10 w-10 text-primary transition-transform duration-300 ${
                                dragActive ? "animate-bounce" : "group-hover:animate-bounce"
                              }`} />
                            </div>
                          </div>
                          <p className="font-bold text-xl mb-2 bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text">
                            اسحب الملف هنا أو اضغط للرفع
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF, TXT, MD - حتى 10 ميجابايت
                          </p>
                        </div>
                      </div>

                      {/* Upload Tasks Progress - Enhanced */}
                      {uploadTasks.length > 0 && (
                        <div className="space-y-3">
                          {uploadTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 ${
                                task.status === "completed"
                                  ? "bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/40 shadow-lg shadow-green-500/5"
                                  : task.status === "failed"
                                  ? "bg-gradient-to-br from-red-500/15 to-red-500/5 border-red-500/40 shadow-lg shadow-red-500/5"
                                  : "bg-gradient-to-br from-muted/40 to-muted/20 border-border/50 hover:border-primary/30"
                              }`}
                            >
                              {(task.status === "completed" || task.status === "failed") && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                              )}
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                      task.status === "processing" ? "bg-primary/20" :
                                      task.status === "completed" ? "bg-green-500/20" :
                                      "bg-red-500/20"
                                    }`}>
                                      {task.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                      {task.status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                                      {task.status === "failed" && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                                    </div>
                                    <span className="font-semibold text-sm truncate max-w-[200px]">{task.fileName}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform" onClick={() => removeUploadTask(task.id)}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Progress 
                                  value={task.progress} 
                                  className={`h-2.5 mb-2 ${
                                    task.status === "completed" ? "bg-green-500/20" :
                                    task.status === "failed" ? "bg-red-500/20" :
                                    ""
                                  }`}
                                />
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground">{task.message}</span>
                                  {task.chunksCreated && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                                      {task.chunksCreated} chunks
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative my-6">
                        <Separator className="bg-border/50" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-sm text-muted-foreground font-medium">
                          أو
                        </span>
                      </div>

                      <Button
                        onClick={addSampleDocuments}
                        disabled={uploadLoading}
                        variant="outline"
                        size="lg"
                        className="w-full h-14 rounded-xl border-2 border-dashed bg-gradient-to-r from-primary/5 to-orange-500/5 hover:from-primary/10 hover:to-orange-500/10 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        {uploadLoading ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin relative z-10" />
                            <span className="relative z-10">جاري الإضافة...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="ml-2 h-5 w-5 relative z-10 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                            <span className="relative z-10 font-semibold">إضافة مستندات تجريبية (ML Course)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="relative">
                        <Input
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="اسم المستند (مثال: Chapter 1 - Introduction)"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all duration-300 text-base"
                          dir="auto"
                        />
                      </div>
                      <div className="relative">
                        <Textarea
                          value={docContent}
                          onChange={(e) => setDocContent(e.target.value)}
                          placeholder="الصق محتوى المستند هنا..."
                          className="min-h-[200px] resize-none rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                          dir="auto"
                        />
                      </div>
                      <Button
                        onClick={handleUploadDocument}
                        disabled={uploadLoading || !docName.trim() || !docContent.trim()}
                        size="lg"
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        {uploadLoading ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin relative z-10" />
                            <span className="relative z-10 font-semibold">جاري المعالجة...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="ml-2 h-5 w-5 relative z-10 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                            <span className="relative z-10 font-semibold">إضافة وتقسيم المستند</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Requirements Card - Enhanced Design */}
            <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] translate-x-[-100%] animate-shimmer" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <CardContent className="py-8 px-6 relative z-10">
                <div className="flex flex-row-reverse items-start gap-6 mb-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <Lightbulb className="h-8 w-8 text-primary animate-pulse-slow" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-l from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                      متطلبات المشروع (RAG Assignment)
                    </h3>
                    <p className="text-sm text-muted-foreground">المتطلبات الأساسية المكتملة للمشروع</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Requirement 1 */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-6 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300">
                          <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-base mb-2 text-right" dir="rtl">
                        تقسيم المستندات
                      </h4>
                      <p className="text-sm text-muted-foreground text-right leading-relaxed" dir="rtl">
                        تقسيم المستندات إلى <span className="font-medium text-foreground">Chunks</span> مع <span className="font-medium text-foreground">Metadata</span> (Source, Page)
                      </p>
                    </div>
                  </div>

                  {/* Requirement 2 */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-6 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-300">
                          <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-base mb-2 text-right" dir="rtl">
                        الاسترجاع والاستشهادات
                      </h4>
                      <p className="text-sm text-muted-foreground text-right leading-relaxed" dir="rtl">
                        استرجاع الأجزاء المناسبة والإجابة مع <span className="font-medium text-foreground">Citations</span>
                      </p>
                    </div>
                  </div>

                  {/* Requirement 3 */}
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-6 hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-300">
                          <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500/30 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-base mb-2 text-right" dir="rtl">
                        أدوات دراسة إضافية
                      </h4>
                      <p className="text-sm text-muted-foreground text-right leading-relaxed" dir="rtl">
                        <span className="font-medium text-foreground">Flashcards</span> و <span className="font-medium text-foreground">Quiz</span>: أدوات دراسة إضافية
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-6 bg-muted/30" dir="rtl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm mb-1">
            <span>صُنع بـ</span>
            <Heart className="h-4 w-4 text-pink-500 fill-pink-500 animate-pulse" />
            <span>بواسطة</span>
            <span className="font-bold bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent bidi-isolate" dir="ltr">Tareq Mhysen</span>
          </div>
          <p className="text-xs text-muted-foreground bidi-isolate" dir="ltr">RAG Course Assistant • {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
