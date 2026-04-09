import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DepositWalletConfig {
  address: string;
  network?: string;
  recommended?: boolean;
}

export interface SiteSettingsMap {
  site_name: string;
  support_email: string;
  enabled_cryptos: string[];
  deposit_wallets: Record<string, DepositWalletConfig>;
  min_deposit: number;
  min_withdraw: number;
  withdraw_fee_percent: number;
  maintenance_mode?: boolean;
  referral_bonus_percent?: number;
  [key: string]: any;
}

const DEFAULTS: SiteSettingsMap = {
  site_name: "Tronnlix",
  support_email: "support@tronnlix.com",
  enabled_cryptos: ["bitcoin", "ethereum", "tether", "solana", "binancecoin", "ripple", "cardano", "dogecoin"],
  deposit_wallets: {},
  min_deposit: 10,
  min_withdraw: 20,
  withdraw_fee_percent: 1,
};

/**
 * Fetches site settings.
 * Non-admin users get public settings via an edge function (no direct DB access).
 * Admin users read directly from the site_settings table.
 */
export function useSiteSettingsDB() {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULTS, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      // Try edge function first (works for all users)
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("public-settings");
        if (!fnError && fnData) {
          return { ...DEFAULTS, ...fnData } as SiteSettingsMap;
        }
      } catch {
        // Fall through to direct query for admins
      }

      // Fallback: direct query (only works for admins due to RLS)
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) {
        console.warn("site_settings direct query failed (expected for non-admins):", error.message);
        return DEFAULTS;
      }

      const map: Record<string, any> = { ...DEFAULTS };
      data?.forEach((row: any) => {
        map[row.key] = row.value;
      });
      return map as SiteSettingsMap;
    },
    staleTime: 60_000,
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    },
  });

  return { settings, isLoading, updateSetting };
}
