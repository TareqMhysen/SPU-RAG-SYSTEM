// ذاكرة تخزين مؤقت بسيطة في الذاكرة + localStorage للإجابات المتكررة
// Simple in-memory + localStorage cache for repeated answers

// واجهة للإجابة المخزنة مؤقتاً
// Interface for cached answer
interface CachedAnswer {
  answer: string;  // الإجابة - Answer
  citations: any[];  // الاستشهادات - Citations
  chunks: string[];  // القطع النصية - Chunks
  timestamp: number;  // الطابع الزمني - Timestamp
}

// مفتاح التخزين المؤقت في localStorage
// Cache key in localStorage
const CACHE_KEY = "rag-answer-cache";
// مدة صلاحية التخزين المؤقت (ساعة واحدة بالميلي ثانية)
// Cache TTL (1 hour in milliseconds)
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
// الحد الأقصى لحجم التخزين المؤقت
// Maximum cache size
const MAX_CACHE_SIZE = 50;

function getCacheKey(query: string, topK: number): string {
  // تطبيع الاستعلام لتحسين ضربات التخزين المؤقت
  // Normalize query for better cache hits
  const normalized = query
    .toLowerCase()  // تحويل إلى أحرف صغيرة - Convert to lowercase
    .trim()  // إزالة المسافات من البداية والنهاية - Trim whitespace
    .replace(/\s+/g, " ")  // استبدال المسافات المتعددة بمسافة واحدة - Replace multiple spaces with single space
    .replace(/[؟?!.،,]/g, "");  // إزالة علامات الترقيم - Remove punctuation
  return `${normalized}__${topK}`;
}

function loadCache(): Map<string, CachedAnswer> {
  try {
    // الحصول على البيانات من localStorage
    // Get data from localStorage
    const raw = localStorage.getItem(CACHE_KEY);
    // إذا لم تكن هناك بيانات، إرجاع خريطة فارغة
    // If no data, return empty map
    if (!raw) return new Map();
    // تحليل البيانات من JSON
    // Parse data from JSON
    const parsed = JSON.parse(raw);
    // إرجاع خريطة من المدخلات
    // Return map from entries
    return new Map(Object.entries(parsed));
  } catch {
    // في حالة الخطأ، إرجاع خريطة فارغة
    // On error, return empty map
    return new Map();
  }
}

function saveCache(cache: Map<string, CachedAnswer>): void {
  try {
    // تحويل إلى كائن وتقييد الحجم
    // Convert to object and limit size
    const entries = Array.from(cache.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp)  // ترتيب حسب الطابع الزمني (الأحدث أولاً) - Sort by timestamp (newest first)
      .slice(0, MAX_CACHE_SIZE);  // أخذ أول MAX_CACHE_SIZE عنصر فقط - Take only first MAX_CACHE_SIZE items
    
    // تحويل المدخلات إلى كائن
    // Convert entries to object
    const obj = Object.fromEntries(entries);
    // حفظ في localStorage
    // Save to localStorage
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // تجاهل أخطاء التخزين
    // Ignore storage errors
  }
}

export function getCachedAnswer(query: string, topK: number): CachedAnswer | null {
  // تحميل التخزين المؤقت
  // Load cache
  const cache = loadCache();
  // الحصول على مفتاح التخزين المؤقت
  // Get cache key
  const key = getCacheKey(query, topK);
  // الحصول على الإجابة المخزنة مؤقتاً
  // Get cached answer
  const cached = cache.get(key);
  
  // إذا لم تكن هناك إجابة مخزنة مؤقتاً
  // If no cached answer
  if (!cached) return null;
  
  // التحقق من انتهاء الصلاحية
  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    // حذف الإجابة المنتهية الصلاحية
    // Delete expired answer
    cache.delete(key);
    saveCache(cache);
    return null;
  }
  
  // إرجاع الإجابة المخزنة مؤقتاً
  // Return cached answer
  return cached;
}

export function setCachedAnswer(
  query: string,
  topK: number,
  answer: string,
  citations: any[],
  chunks: string[]
): void {
  // تحميل التخزين المؤقت
  // Load cache
  const cache = loadCache();
  // الحصول على مفتاح التخزين المؤقت
  // Get cache key
  const key = getCacheKey(query, topK);
  
  // حفظ الإجابة في التخزين المؤقت
  // Save answer to cache
  cache.set(key, {
    answer,  // الإجابة - Answer
    citations,  // الاستشهادات - Citations
    chunks,  // القطع النصية - Chunks
    timestamp: Date.now(),  // الطابع الزمني الحالي - Current timestamp
  });
  
  // حفظ التخزين المؤقت
  // Save cache
  saveCache(cache);
}

export function clearAnswerCache(): void {
  // حذف التخزين المؤقت من localStorage
  // Remove cache from localStorage
  localStorage.removeItem(CACHE_KEY);
}
