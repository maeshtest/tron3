import { useState, useEffect } from "react";

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  supportEmail: string;
  enabledCryptos: string[];
  depositWallets: Record<string, string>;
  minDeposit: number;
  minWithdraw: number;
  withdrawFeePercent: number;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Athena",
  logoUrl: "",
  supportEmail: "support@athena.com",
  enabledCryptos: ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano", "polkadot", "dogecoin"],
  depositWallets: {
    bitcoin: "bc1q72hzpunerdjz0napz0ruq2elzkwtmprq2r9q3a",
    ethereum: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68",
    solana: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    binancecoin: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
    ripple: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
    cardano: "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  },
  minDeposit: 10,
  minWithdraw: 20,
  withdrawFeePercent: 1,
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem("athena_site_settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("athena_site_settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
