// استيراد hooks من React
// Import React hooks
import { useEffect, useMemo, useState } from "react";

// دالة للتحقق من تفضيل تقليل الحركة (للإمكانات)
// Function to check for reduced motion preference (for accessibility)
function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// نوع خصائص مكون TypewriterText
// TypewriterText component props type
type TypewriterTextProps = {
  text: string;  // النص المراد عرضه - Text to display
  className?: string;  // فئات CSS إضافية - Additional CSS classes
  /** milliseconds per character */  // الميلي ثانية لكل حرف
  speedMs?: number;  // السرعة بالميلي ثانية - Speed in milliseconds
  dir?: "auto" | "rtl" | "ltr";  // اتجاه النص - Text direction
};

// مكون لعرض النص بتأثير الآلة الكاتبة
// Component to display text with typewriter effect
export function TypewriterText({ text, className, speedMs = 12, dir = "auto" }: TypewriterTextProps) {
  // التحقق من تفضيل تقليل الحركة (محسوب مرة واحدة)
  // Check for reduced motion preference (computed once)
  const reduced = useMemo(() => prefersReducedMotion(), []);
  // حالة النص المعروض حالياً
  // Current displayed text state
  const [shown, setShown] = useState(reduced ? text : "");

  // تأثير لعرض النص تدريجياً
  // Effect to display text gradually
  useEffect(() => {
    // إذا كان المستخدم يفضل تقليل الحركة، اعرض النص كاملاً
    // If user prefers reduced motion, show full text
    if (reduced) {
      setShown(text);
      return;
    }

    // إعادة تعيين النص المعروض
    // Reset displayed text
    setShown("");
    let i = 0;
    // إنشاء مؤقت لإضافة حرف واحد في كل مرة
    // Create interval to add one character at a time
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));  // عرض النص حتى الحرف الحالي - Show text up to current character
      if (i >= text.length) window.clearInterval(id);  // إيقاف المؤقت عند الانتهاء - Stop interval when done
    }, Math.max(4, speedMs));  // التأخير بين كل حرف - Delay between each character

    // تنظيف المؤقت عند إلغاء التحميل
    // Cleanup interval on unmount
    return () => window.clearInterval(id);
  }, [text, speedMs, reduced]);

  return (
    <p className={className} dir={dir}>
      {shown}
    </p>
  );
}
