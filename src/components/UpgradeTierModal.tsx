import { useState } from "react";
import { Star, Crown, Gem, Check, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TIERS = [
  {
    id: "pro",
    label: "Pro",
    icon: Star,
    price: 99,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    features: ["Access Pro bots", "Priority signals", "Advanced analytics"],
  },
  {
    id: "elite",
    label: "Elite",
    icon: Crown,
    price: 299,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    features: ["Access Elite + Pro bots", "AI strategies", "Premium support", "Higher limits"],
  },
  {
    id: "vip",
    label: "VIP",
    icon: Gem,
    price: 999,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    features: ["All bot tiers", "Exclusive VIP bots", "1-on-1 support", "Early access", "Custom strategies"],
  },
];

export default function UpgradeTierModal({ currentTier, onClose, onUpgraded }: { currentTier: string; onClose: () => void; onUpgraded: () => void }) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "pay" | "verifying">("select");
  const depositAddress = settings.depositWallets?.["bitcoin"] || settings.depositWallets?.["ethereum"] || "No deposit address configured";

  const selected = TIERS.find(t => t.id === selectedTier);

  const handlePay = () => {
    if (!selected) return;
    setStep("pay");
  };

  const handleVerify = async () => {
    if (!user || !selected) return;
    setStep("verifying");
    // Simulate payment verification
    setTimeout(async () => {
      await supabase.from("profiles").update({ account_tier: selected.id } as any).eq("user_id", user.id);
      toast.success(`Upgraded to ${selected.label}!`);
      onUpgraded();
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Upgrade Account Tier</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {step === "select" && (
          <div className="p-4 space-y-3">
            {TIERS.filter(t => {
              const order: Record<string, number> = { free: 0, pro: 1, elite: 2, vip: 3 };
              return (order[t.id] || 0) > (order[currentTier?.toLowerCase()] || 0);
            }).map(tier => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTier === tier.id ? `${tier.color} border-current` : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-bold text-foreground">{tier.label}</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">${tier.price}</span>
                  </div>
                  <ul className="space-y-1">
                    {tier.features.map(f => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-400" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <Button
              className="w-full h-11 mt-2"
              disabled={!selectedTier}
              onClick={handlePay}
            >
              {selectedTier ? `Upgrade to ${selected?.label} — $${selected?.price}` : "Select a tier"}
            </Button>
          </div>
        )}

        {step === "pay" && selected && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Send <span className="text-foreground font-bold">${selected.price} USDT</span> to activate your {selected.label} tier.
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={depositAddress} size={120} />
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Deposit Address</p>
              <p className="text-xs text-foreground font-mono break-all">{depositAddress}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(depositAddress); toast.success("Copied!"); }}
              className="w-full text-xs py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
            >
              Copy Address
            </button>
            <Button className="w-full h-11" onClick={handleVerify}>
              <Wallet className="h-4 w-4 mr-2" /> I've Paid — Verify
            </Button>
          </div>
        )}

        {step === "verifying" && (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-foreground font-medium">Verifying payment...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
