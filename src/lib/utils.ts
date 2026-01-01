// استيراد المكتبات المطلوبة
// Import required libraries
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// دالة لدمج الفئات CSS بطريقة ذكية
// Function to intelligently merge CSS classes
export function cn(...inputs: ClassValue[]) {
  // دمج الفئات باستخدام clsx ثم twMerge لإزالة التعارضات
  // Merge classes using clsx then twMerge to remove conflicts
  return twMerge(clsx(inputs));
}
