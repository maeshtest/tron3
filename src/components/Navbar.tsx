import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import TronnlixLogo from "@/components/TronnlixLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.markets"), path: "/#crypto" },
 
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <TronnlixLogo size={36} />
          <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tronnlix
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link to="/auth" className="hidden md:block">
            <Button variant="outline" size="sm">{t("nav.signIn")}</Button>
          </Link>
          <Link to="/auth" className="hidden md:block">
            <Button variant="gold" size="sm">{t("nav.register")}</Button>
          </Link>

          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className="block text-sm text-muted-foreground hover:text-primary py-2" onClick={() => setMobileOpen(false)}>
              {item.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/auth" className="flex-1"><Button variant="outline" size="sm" className="w-full">{t("nav.signIn")}</Button></Link>
            <Link to="/auth" className="flex-1"><Button variant="gold" size="sm" className="w-full">{t("nav.register")}</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
