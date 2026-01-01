// استيراد hooks والمكونات المطلوبة
// Import required hooks and components
import { useMemo, useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Calendar, BookOpen } from "lucide-react";

// دالة للتحقق من تفضيل تقليل الحركة (للإمكانات)
// Function to check for reduced motion preference (for accessibility)
function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// واجهة خصائص مكون الإجابة المنسقة
// Formatted answer component props interface
interface FormattedAnswerProps {
  text: string;  // النص المراد تنسيقه - Text to format
  className?: string;  // فئات CSS إضافية - Additional CSS classes
  speedMs?: number;  // سرعة العرض بالميلي ثانية - Display speed in milliseconds
  dir?: "auto" | "rtl" | "ltr";  // اتجاه النص - Text direction
}

// دالة لعرض عناصر القائمة مع تنسيق خاص
// Function to render list items with special formatting
function renderListItems(items: string[], sectionIdx: number) {
  return (
    <div key={`list-${sectionIdx}`} className="mb-6 space-y-3 animate-fade-in-up" style={{ animationDelay: `${sectionIdx * 50}ms` }}>
      {items.map((item, itemIdx) => {
        // تنظيف العنصر من رموز القائمة
        // Clean item from list symbols
        const cleanItem = item.replace(/^[*\-\u2022]\s+/, "").trim();
        
        // التحقق من نمط السنة (مثل **2013:**)
        // Check for year pattern (e.g., **2013:**)
        const yearMatch = cleanItem.match(/^\*\*(\d{4})\*\*:\s*(.+)/);
        if (yearMatch) {
          const [, year, contentText] = yearMatch;
          const cleanedContent = contentText
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
            .replace(/_([^_]+)_/g, '$1') // Remove _italic_
            .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
          
          return (
            <div
              key={itemIdx}
              className="flex flex-row-reverse items-start gap-3 p-4 rounded-xl bg-gradient-to-l from-primary/5 via-primary/3 to-transparent border border-primary/10 hover:border-primary/20 hover:bg-primary/10 transition-all duration-300 group"
              dir="rtl"
            >
              <div className="flex-shrink-0 mt-1">
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 border-primary/30 text-primary font-bold text-xs px-3 py-1 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300"
                >
                  <Calendar className="h-3 w-3 ml-1 inline" />
                  {year}
                </Badge>
              </div>
              <div className="flex-1 text-sm leading-relaxed text-foreground group-hover:text-foreground/90 transition-colors">
                {cleanedContent}
              </div>
            </div>
          );
        }
        
        // Check for bold text pattern (e.g., **Word2vec:**)
        const boldMatch = cleanItem.match(/^\*\*([^*]+)\*\*:\s*(.+)/);
        if (boldMatch) {
          const [, boldText, contentText] = boldMatch;
          const cleanedContent = contentText
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
            .replace(/_([^_]+)_/g, '$1') // Remove _italic_
            .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
          
          return (
            <div
              key={itemIdx}
              className="flex flex-row-reverse items-start gap-3 p-4 rounded-xl bg-gradient-to-l from-purple-500/5 via-purple-500/3 to-transparent border border-purple-500/10 hover:border-purple-500/20 hover:bg-purple-500/10 transition-all duration-300 group"
              dir="rtl"
            >
              <div className="flex-shrink-0">
                <Badge 
                  variant="outline" 
                  className="bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-xs px-3 py-1 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300"
                >
                  <BookOpen className="h-3 w-3 ml-1 inline" />
                  {boldText}
                </Badge>
              </div>
              <div className="flex-1 text-sm leading-relaxed text-foreground group-hover:text-foreground/90 transition-colors">
                {cleanedContent}
              </div>
            </div>
          );
        }
        
        // Regular list item - remove markdown formatting
        const cleanedText = cleanItem
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
          .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
          .replace(/_([^_]+)_/g, '$1') // Remove _italic_
          .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
        
        return (
          <div
            key={itemIdx}
            className="flex flex-row-reverse items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all duration-300 group"
            dir="rtl"
          >
            <div className="flex-shrink-0 mt-1.5">
              <div className="h-2 w-2 rounded-full bg-primary group-hover:scale-150 group-hover:bg-primary/80 transition-all duration-300" />
            </div>
            <div className="flex-1 text-sm leading-relaxed text-foreground group-hover:text-foreground/90 transition-colors">
              {cleanedText}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// مكون لعرض الإجابة المنسقة مع تأثير الآلة الكاتبة
// Component to display formatted answer with typewriter effect
export function FormattedAnswer({ text, className = "", speedMs = 12, dir = "auto" }: FormattedAnswerProps) {
  // التحقق من تفضيل تقليل الحركة (محسوب مرة واحدة)
  // Check for reduced motion preference (computed once)
  const reduced = useMemo(() => prefersReducedMotion(), []);
  // طول النص المعروض حالياً
  // Current displayed text length
  const [displayedLength, setDisplayedLength] = useState(reduced ? text.length : 0);

  // تأثير لعرض النص تدريجياً
  // Effect to display text gradually
  useEffect(() => {
    // إذا كان المستخدم يفضل تقليل الحركة، اعرض النص كاملاً
    // If user prefers reduced motion, show full text
    if (reduced) {
      setDisplayedLength(text.length);
      return;
    }

    // إعادة تعيين الطول المعروض
    // Reset displayed length
    setDisplayedLength(0);
    let i = 0;
    // إنشاء مؤقت لإضافة حرف واحد في كل مرة
    // Create interval to add one character at a time
    const id = window.setInterval(() => {
      i += 1;
      setDisplayedLength(i);  // تحديث الطول المعروض - Update displayed length
      if (i >= text.length) window.clearInterval(id);  // إيقاف المؤقت عند الانتهاء - Stop interval when done
    }, Math.max(4, speedMs));  // التأخير بين كل حرف - Delay between each character

    // تنظيف المؤقت عند إلغاء التحميل
    // Cleanup interval on unmount
    return () => window.clearInterval(id);
  }, [text, speedMs, reduced]);

  const displayedText = text.slice(0, displayedLength);

  const formattedContent = useMemo(() => {
    if (!displayedText.trim()) return [];
    
    // First, handle citations at the end
    const citationRegex = /(\[.*?\.pdf.*?\])/g;
    const citations: string[] = [];
    let textWithoutCitations = displayedText;
    
    // Extract citations
    const citationMatches = displayedText.match(citationRegex);
    if (citationMatches) {
      citations.push(...citationMatches);
      textWithoutCitations = displayedText.replace(citationRegex, "").trim();
    }
    
    // Split text into sections (paragraphs separated by double newlines)
    const sections = textWithoutCitations.split(/\n\s*\n/).filter(p => p.trim());
    
    const content: (JSX.Element | null)[] = [];
    let contentIdx = 0;
    
    sections.forEach((section) => {
      const trimmed = section.trim();
      if (!trimmed) return;
      
      // Check if section contains list items
      const lines = trimmed.split('\n');
      const hasListItems = lines.some(line => line.trim().match(/^[*\-\u2022]\s+/));
      
      if (hasListItems) {
        // Split into paragraphs and lists
        let currentParagraph = '';
        let currentList: string[] = [];
        
        lines.forEach((line) => {
          const trimmedLine = line.trim();
          
          if (trimmedLine.match(/^[*\-\u2022]\s+/)) {
            // If we have accumulated paragraph text, add it first
            if (currentParagraph.trim()) {
              const cleanedPara = currentParagraph.trim()
                .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
                .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
                .replace(/_([^_]+)_/g, '$1') // Remove _italic_
                .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
              
              content.push(
                <div key={`para-${contentIdx}`} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${contentIdx * 50}ms` }}>
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap" dir={dir}>
                    {cleanedPara}
                  </p>
                </div>
              );
              contentIdx++;
              currentParagraph = '';
            }
            // Add to list
            currentList.push(trimmedLine);
          } else if (trimmedLine) {
            // If we have accumulated list items, add them first
            if (currentList.length > 0) {
              content.push(renderListItems(currentList, contentIdx));
              contentIdx++;
              currentList = [];
            }
            // Add to paragraph
            currentParagraph += (currentParagraph ? '\n' : '') + trimmedLine;
          }
        });
        
        // Handle remaining paragraph or list
        if (currentParagraph.trim()) {
          const cleanedPara = currentParagraph.trim()
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
            .replace(/_([^_]+)_/g, '$1') // Remove _italic_
            .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
          
          content.push(
            <div key={`para-final-${contentIdx}`} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${contentIdx * 50}ms` }}>
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap" dir={dir}>
                {cleanedPara}
              </p>
            </div>
          );
          contentIdx++;
        }
        if (currentList.length > 0) {
          content.push(renderListItems(currentList, contentIdx));
          contentIdx++;
        }
      } else {
        // Regular paragraph without lists - remove markdown formatting
        const cleanedParagraph = trimmed
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
          .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
          .replace(/_([^_]+)_/g, '$1') // Remove _italic_
          .replace(/__([^_]+)__/g, '$1'); // Remove __bold__
        
        content.push(
          <div key={`para-${contentIdx}`} className="mb-4 animate-fade-in-up" style={{ animationDelay: `${contentIdx * 50}ms` }}>
            <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap" dir={dir}>
              {cleanedParagraph}
            </p>
          </div>
        );
        contentIdx++;
      }
    });
    
    // Add citations at the end if they exist
    if (citations.length > 0) {
      // Remove duplicates and sort
      const uniqueCitations = Array.from(new Set(citations));
      
      content.push(
        <div key="citations" className="mt-6 pt-4 border-t border-border/50 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-2" dir="rtl">
            <span className="text-xs text-muted-foreground font-medium mb-1">المصادر:</span>
            {uniqueCitations.map((citation, citIdx) => (
              <Badge
                key={citIdx}
                variant="secondary"
                className="text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:scale-110 transition-all duration-300 font-medium"
              >
                {citation}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
    
    return content;
  }, [displayedText, dir]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {formattedContent}
      </div>
    </div>
  );
}
