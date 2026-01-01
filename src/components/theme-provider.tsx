// استيراد React والمكتبات المطلوبة
// Import React and required libraries
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// نوع خصائص موفر المظهر
// Theme provider props type
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

// مكون موفر المظهر (الوضع الفاتح/الداكن)
// Theme provider component (light/dark mode)
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"  // استخدام class لتطبيق المظهر - Use class to apply theme
      defaultTheme="system"  // المظهر الافتراضي: النظام - Default theme: system
      enableSystem  // تفعيل اكتشاف مظهر النظام - Enable system theme detection
      disableTransitionOnChange  // تعطيل الانتقال عند تغيير المظهر - Disable transition on theme change
      {...props}  // تمرير الخصائص الإضافية - Pass additional props
    >
      {children}
    </NextThemesProvider>
  );
}
