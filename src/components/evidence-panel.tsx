// استيراد الأيقونات والمكونات المطلوبة
// Import required icons and components
import { ChevronDown, ChevronUp, FileText, Expand, Shrink } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// واجهة الاستشهاد
// Citation interface
interface Citation {
  source: string;  // المصدر - Source
  page: number;  // رقم الصفحة - Page number
  content: string;  // المحتوى - Content
}

// نوع خصائص المكون
// Component props type
type Props = {
  citations: Citation[];  // قائمة الاستشهادات - List of citations
};

// مكون لوحة الأدلة (الاستشهادات)
// Evidence panel (citations) component
export function EvidencePanel({ citations }: Props) {
  // حالة فتح/إغلاق اللوحة
  // Panel open/close state
  const [open, setOpen] = useState(true);
  // حالة العناصر الموسعة (التي تم النقر عليها لعرض المزيد)
  // Expanded items state (items clicked to show more)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  // إذا لم تكن هناك استشهادات، لا تعرض شيء
  // If no citations, don't render anything
  if (!citations?.length) return null;

  // دالة لتبديل حالة التوسع/الطي لعنصر محدد
  // Function to toggle expand/collapse state for specific item
  const toggleExpand = (idx: number) => {
    setExpandedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Card className="border-border/50 bg-muted/20 shadow-md overflow-hidden animate-fade-in-up hover:shadow-lg transition-shadow duration-300" dir="rtl">
      <CardHeader className="py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors duration-300 group" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            <FileText className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
            الأدلة المسترجعة ({citations.length})
          </CardTitle>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" 
            aria-label={open ? "إخفاء الأدلة" : "إظهار الأدلة"}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform duration-300" /> : <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform duration-300" />}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 pb-4">
          <ScrollArea className="h-[min(60vh,600px)]">
            <div className="space-y-3">
              {citations.map((c, idx) => {
                const isExpanded = expandedItems[idx];
                const isLongContent = c.content.length > 300;

                const clampStyle: CSSProperties | undefined =
                  !isExpanded && isLongContent
                    ? ({
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as CSSProperties)
                    : undefined;

                return (
                  <div key={idx} className="p-4 rounded-lg bg-background/60 border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-md animate-fade-in-up group" style={{ animationDelay: `${idx * 50}ms` }}>
                    {/* Header - RTL */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap" dir="rtl">
                      <Badge variant="secondary" className="font-medium text-xs group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300">
                        <FileText className="h-3 w-3 ml-1 group-hover:scale-110 transition-transform duration-300" />
                        {c.source}
                      </Badge>
                      <Badge variant="outline" className="text-xs group-hover:border-primary/30 transition-all duration-300">
                        صفحة {c.page}
                      </Badge>
                    </div>

                    {/* Content - auto direction */}
                    <div
                      className="text-sm text-foreground leading-relaxed"
                      dir="auto"
                      style={{
                        unicodeBidi: "plaintext",
                        textAlign: "start",
                        ...(clampStyle ?? {}),
                      }}
                    >
                      {c.content
                        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
                        .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
                        .replace(/_([^_]+)_/g, '$1') // Remove _italic_
                        .replace(/__([^_]+)__/g, '$1')} {/* Remove __bold__ */}
                    </div>

                    {/* Expand/Collapse Button */}
                    {isLongContent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExpand(idx);
                        }}
                        className="mt-2 h-8 text-xs text-primary hover:text-primary/80 gap-1 hover:scale-105 hover:bg-primary/10 transition-all duration-300 group"
                      >
                        {isExpanded ? (
                          <>
                            <Shrink className="h-3 w-3 group-hover:scale-110 transition-transform duration-300" />
                            عرض أقل
                          </>
                        ) : (
                          <>
                            <Expand className="h-3 w-3 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                            عرض المزيد
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

