// استيراد المكونات والمكتبات المطلوبة
// Import required components and libraries
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import ContentStatus from "./pages/ContentStatus";
import StudyTools from "./pages/StudyTools";
import DatabaseViewer from "./pages/DatabaseViewer";
import NotFound from "./pages/NotFound";

// إنشاء عميل Query لتخزين البيانات
// Create Query client for data caching
const queryClient = new QueryClient();

// المكون الرئيسي للتطبيق
// Main app component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />  {/* الصفحة الرئيسية - Home page */}
          <Route path="/app" element={<Index />} />  {/* صفحة التطبيق الرئيسية - Main app page */}
          <Route path="/status" element={<ContentStatus />} />  {/* صفحة حالة المحتوى - Content status page */}
          <Route path="/study" element={<StudyTools />} />  {/* صفحة أدوات الدراسة - Study tools page */}
          <Route path="/db" element={<DatabaseViewer />} />  {/* صفحة عرض قاعدة البيانات - Database viewer page */}
          <Route path="*" element={<NotFound />} />  {/* صفحة 404 - 404 page */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
