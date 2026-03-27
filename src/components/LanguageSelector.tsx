import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const LanguageSelector = ({ compact = false }: { compact?: boolean }) => {
  const { language, setLanguage } = useAppStore();
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <select
      value={language}
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 rounded-md bg-secondary border border-border px-1.5 text-xs text-foreground focus:outline-none"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {compact ? `${l.flag} ${l.code.toUpperCase()}` : `${l.flag} ${l.label}`}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
