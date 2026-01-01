// استيراد المكتبات المطلوبة
// Import required libraries
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// إعداد Vite
// Vite configuration
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",  // الاستماع على جميع عناوين IP - Listen on all IP addresses
    port: 8081,  // المنفذ - Port
    strictPort: false,  // السماح بتغيير المنفذ إذا كان مشغول - Allow port change if busy
  },
  // الإضافات: React و componentTagger في وضع التطوير فقط
  // Plugins: React and componentTagger in development mode only
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    // إنشاء اسم مستعار للمسار "@" يشير إلى مجلد src
    // Create alias "@" that points to src folder
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
