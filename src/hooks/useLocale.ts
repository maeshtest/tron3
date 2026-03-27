import { useAppStore } from "@/stores/useAppStore";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  sw: "sw-KE",
  ar: "ar-SA",
  fr: "fr-FR",
  hi: "hi-IN",
  es: "es-ES",
};

export function useLocale() {
  const language = useAppStore((s) => s.language);
  const locale = LOCALE_MAP[language] || "en-US";

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

  const formatNumber = (num: number, opts?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, opts).format(num);

  const formatDate = (date: string | Date) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));

  const formatDateTime = (date: string | Date) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

  return { locale, formatCurrency, formatNumber, formatDate, formatDateTime };
}
