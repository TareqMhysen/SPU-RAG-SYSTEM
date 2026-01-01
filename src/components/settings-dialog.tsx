// استيراد الأيقونات والمكونات المطلوبة
// Import required icons and components
import { Settings2, Zap, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Settings } from "@/hooks/use-settings";

// نوع خصائص المكون
// Component props type
type Props = {
  settings: Settings;  // الإعدادات الحالية - Current settings
  onChange: (update: Partial<Settings>) => void;  // دالة تحديث الإعدادات - Settings update function
};

// مكون نافذة الإعدادات
// Settings dialog component
export function SettingsDialog({ settings, onChange }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 border-border/50 hover:bg-accent transition-all duration-300"
          aria-label="الإعدادات"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>الإعدادات</DialogTitle>
          <DialogDescription>تحكّم في إعدادات البحث والمعالجة والعرض</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* وضع المعالجة */}
          {/* Processing Mode */}
          <div className="space-y-3">
            <Label className="text-base">وضع المعالجة</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onChange({ processingMode: "fast" })}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-right ${
                  settings.processingMode === "fast"
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">سريع</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  OCR خفيف وتحليل سريع. مناسب للملفات النصية الواضحة.
                </p>
              </button>
              <button
                onClick={() => onChange({ processingMode: "accurate" })}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-right ${
                  settings.processingMode === "accurate"
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">دقيق</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  OCR متقدم للمحاضرات المصورة والملفات المعقدة.
                </p>
              </button>
            </div>
          </div>

          {/* عدد الأدلة (Top-K) */}
          {/* Top-K */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="topk">عدد الأدلة (Top-K)</Label>
              <span className="text-sm font-medium text-muted-foreground">{settings.topK}</span>
            </div>
            <Slider
              id="topk"
              min={1}
              max={10}
              step={1}
              value={[settings.topK]}
              onValueChange={([v]) => onChange({ topK: v })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              عدد أفضل المقاطع المسترجعة من المستندات لإظهارها واستخدامها في الإجابة.
            </p>
          </div>

          {/* Typewriter Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="speed">سرعة الكتابة (ms/حرف)</Label>
              <span className="text-sm font-medium text-muted-foreground">{settings.typewriterSpeed}</span>
            </div>
            <Slider
              id="speed"
              min={0}
              max={50}
              step={2}
              value={[settings.typewriterSpeed]}
              onValueChange={([v]) => onChange({ typewriterSpeed: v })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              كلما زادت القيمة، أصبحت الكتابة التدريجية أبطأ. اضبط على 0 لإلغاء التأثير.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
