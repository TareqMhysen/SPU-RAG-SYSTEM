// استيراد دالة toast
// Import toast function
import { toast } from "@/hooks/use-toast";

// دالة لنسخ النص إلى الحافظة
// Function to copy text to clipboard
export async function copyToClipboard(text: string, successMessage: string, errorMessage: string) {
  try {
    // نسخ النص إلى الحافظة
    // Copy text to clipboard
    await navigator.clipboard.writeText(text);
    // إظهار رسالة نجاح
    // Show success message
    toast({ title: "تم النسخ", description: successMessage });
  } catch {
    // في حالة الخطأ، إظهار رسالة خطأ
    // On error, show error message
    toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
  }
}

