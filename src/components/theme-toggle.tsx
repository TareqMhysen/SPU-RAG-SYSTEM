// استيراد hooks والمكونات المطلوبة
// Import required hooks and components
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// مكون لتبديل المظهر (فاتح/داكن/نظام)
// Component to toggle theme (light/dark/system)
export function ThemeToggle() {
  // الحصول على المظهر الحالي ودالة التغيير
  // Get current theme and change function
  const { theme, setTheme, resolvedTheme } = useTheme();

  // المظهر الحالي (الافتراضي: النظام)
  // Current theme (default: system)
  const current = theme ?? "system";
  // الأيقونة المناسبة للمظهر الحالي
  // Icon appropriate for current theme
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  // قائمة خيارات المظهر
  // Theme options list
  const items: Array<{
    value: "system" | "light" | "dark";  // قيمة المظهر - Theme value
    label: string;  // التسمية - Label
    icon: typeof Sun;  // الأيقونة - Icon
  }> = [
    { value: "system", label: "النظام", icon: Laptop },  // مظهر النظام - System theme
    { value: "light", label: "فاتح", icon: Sun },  // المظهر الفاتح - Light theme
    { value: "dark", label: "داكن", icon: Moon },  // المظهر الداكن - Dark theme
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg h-10 w-10 border-border/50 hover:bg-accent hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
          aria-label="تبديل المظهر"
        >
          <Icon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const selected = current === item.value;

          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => setTheme(item.value)}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <ItemIcon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </span>
              {selected ? <Check className="h-4 w-4 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
