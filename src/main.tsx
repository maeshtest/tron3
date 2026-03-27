import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Apply dark mode on load
const stored = localStorage.getItem("tronnlix-app-store");
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.state?.darkMode !== false) {
      document.documentElement.classList.add("dark");
    }
  } catch {
    document.documentElement.classList.add("dark");
  }
} else {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
