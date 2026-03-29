import { Shield, Star, Crown, Gem } from "lucide-react";

const TIER_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  free: { label: "Free", icon: Shield, className: "text-muted-foreground bg-secondary border-border" },
  pro: { label: "Pro", icon: Star, className: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  elite: { label: "Elite", icon: Crown, className: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  vip: { label: "VIP", icon: Gem, className: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
};

export default function AccountTierBadge({ tier, compact }: { tier: string; compact?: boolean }) {
  const config = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.free;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.className}`}>
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg border ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
