// استيراد React
// Import React
import * as React from "react";

// نقطة التوقف للشاشات المحمولة (بالبكسل)
// Mobile breakpoint (in pixels)
const MOBILE_BREAKPOINT = 768;

// Hook للتحقق من كون الجهاز محمول
// Hook to check if device is mobile
export function useIsMobile() {
  // حالة كون الجهاز محمول
  // Mobile device state
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  // تأثير للتحقق من حجم الشاشة
  // Effect to check screen size
  React.useEffect(() => {
    // إنشاء media query listener
    // Create media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // دالة للتحقق من حجم الشاشة عند التغيير
    // Function to check screen size on change
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    // إضافة مستمع للتغييرات
    // Add listener for changes
    mql.addEventListener("change", onChange);
    // التحقق الأولي
    // Initial check
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    // تنظيف المستمع عند إلغاء التحميل
    // Cleanup listener on unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // إرجاع القيمة (تحويل undefined إلى false)
  // Return value (convert undefined to false)
  return !!isMobile;
}
