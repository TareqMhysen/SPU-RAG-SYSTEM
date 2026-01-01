// استيراد hooks من React
// Import React hooks
import { useEffect, useState } from "react";

// واجهة الإعدادات
// Settings interface
export interface Settings {
  topK: number;  // عدد المستندات المسترجعة - Number of retrieved documents
  typewriterSpeed: number;  // سرعة تأثير الآلة الكاتبة - Typewriter speed
  processingMode: "fast" | "accurate";  // وضع المعالجة - Processing mode
}

// الإعدادات الافتراضية
// Default settings
const DEFAULTS: Settings = { topK: 5, typewriterSpeed: 12, processingMode: "fast" };
// مفتاح التخزين في localStorage
// Storage key in localStorage
const STORAGE_KEY = "rag-assistant-settings";

function load(): Settings {
  try {
    // الحصول على الإعدادات من localStorage
    // Get settings from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    // إذا لم تكن هناك إعدادات محفوظة، إرجاع القيم الافتراضية
    // If no saved settings, return defaults
    if (!raw) return DEFAULTS;
    // تحليل البيانات من JSON
    // Parse data from JSON
    const parsed = JSON.parse(raw);
    // إرجاع الإعدادات مع التحقق من صحة الأنواع
    // Return settings with type validation
    return {
      topK: typeof parsed.topK === "number" ? parsed.topK : DEFAULTS.topK,
      typewriterSpeed:
        typeof parsed.typewriterSpeed === "number"
          ? parsed.typewriterSpeed
          : DEFAULTS.typewriterSpeed,
      processingMode:
        parsed.processingMode === "fast" || parsed.processingMode === "accurate"
          ? parsed.processingMode
          : DEFAULTS.processingMode,
    };
  } catch {
    // في حالة الخطأ، إرجاع القيم الافتراضية
    // On error, return defaults
    return DEFAULTS;
  }
}

function save(settings: Settings) {
  // حفظ الإعدادات في localStorage
  // Save settings to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Hook لإدارة الإعدادات
// Hook to manage settings
export function useSettings() {
  // حالة الإعدادات الحالية
  // Current settings state
  const [settings, setSettingsState] = useState<Settings>(DEFAULTS);
  // حالة تحميل الإعدادات
  // Settings loading state
  const [loaded, setLoaded] = useState(false);

  // تحميل الإعدادات عند التحميل الأولي
  // Load settings on initial mount
  useEffect(() => {
    setSettingsState(load());
    setLoaded(true);
  }, []);

  // دالة لتحديث الإعدادات
  // Function to update settings
  const setSettings = (update: Partial<Settings>) => {
    // دمج الإعدادات الحالية مع التحديثات الجديدة
    // Merge current settings with new updates
    const next = { ...settings, ...update };
    // تحديث الحالة
    // Update state
    setSettingsState(next);
    // حفظ الإعدادات
    // Save settings
    save(next);
  };

  // إرجاع الإعدادات ودالة التحديث وحالة التحميل
  // Return settings, update function, and loading state
  return { settings, setSettings, loaded };
}
