// استيراد المكتبات المطلوبة
// Import required libraries
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

// إنشاء جذر React وتقديم التطبيق
// Create React root and render app
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
