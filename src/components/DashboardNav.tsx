import { Home, TrendingUp, ArrowLeftRight, Bot, Wallet, LogOut, Moon, Sun, Shield, History } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWallets } from "@/hooks/useWallets";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAppStore } from "@/stores/useAppStore";
import { useAdmin } from "@/hooks/useAdmin";
import TronnlixLogo from "@/components/TronnlixLogo";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

const DashboardNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { wallets } = useWallets();
  const { prices } = useCryptoPrices();
  const { darkMode, toggleDarkMode } = useAppStore();
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, path: "/dashboard", label: t("nav.dashboard") },
    { icon: TrendingUp, path: "/markets", label: t("nav.markets") },
    { icon: ArrowLeftRight, path: "/spot-trading", label: t("nav.trade") },
    { icon: Bot, path: "/bots", label: t("nav.bots") },
    { icon: History, path: "/transactions", label: t("nav.history") },
  ];

  const totalUsd = wallets.reduce((sum, w) => {
    const price = w.crypto_id === "usdt" ? 1 : (prices.find(p => p.id === w.crypto_id)?.current_price ?? 0);
    return sum + w.balance * price;
  }, 0);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <TronnlixLogo size={28} />
          <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tronnlix</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 text-xs ${active ? "text-primary bg-primary/10 border-b-2 border-primary rounded-b-none" : "text-muted-foreground"}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />

          <button onClick={toggleDarkMode} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive">
                <Shield className="h-3.5 w-3.5" /> {t("nav.admin")}
              </Button>
            </Link>
          )}

          <Link to="/deposit">
            <Button variant="gold" size="sm" className="gap-2">
              <Wallet className="h-3.5 w-3.5" />
              ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
