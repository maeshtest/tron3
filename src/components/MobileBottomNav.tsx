import { Home, TrendingUp, ArrowLeftRight, Bot, ArrowDown, ArrowUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const items = [
  { icon: Home, path: "/dashboard", key: "nav.dashboard" },
  { icon: TrendingUp, path: "/markets", key: "nav.markets" },
  { icon: ArrowLeftRight, path: "/spot-trading", key: "nav.trade" },
  { icon: ArrowDown, path: "/deposit", key: "nav.deposit" },
  { icon: ArrowUp, path: "/withdraw", key: "nav.withdraw" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around h-14">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(item.key, item.key.split(".")[1])}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
