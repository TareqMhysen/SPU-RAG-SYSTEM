// استيراد المكونات والمكتبات المطلوبة
// Import required components and libraries
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// واجهة خصائص رابط التنقل المتوافق
// Compatible navigation link props interface
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;  // فئات CSS الأساسية - Base CSS classes
  activeClassName?: string;  // فئات CSS عند النشاط - CSS classes when active
  pendingClassName?: string;  // فئات CSS أثناء الانتظار - CSS classes when pending
}

// مكون رابط التنقل مع دعم الفئات الشرطية
// Navigation link component with conditional class support
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // دمج الفئات حسب حالة الرابط (نشط/في انتظار)
        // Merge classes based on link state (active/pending)
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

// تعيين اسم العرض للمكون (للتطوير)
// Set display name for component (for development)
NavLink.displayName = "NavLink";

export { NavLink };
