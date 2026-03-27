import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Gift, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

const ReferralPage = () => {
  const { user } = useAuth();
  const referralCode = user?.id?.slice(0, 8).toUpperCase() || "TRONNLIX";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const stats = [
    { label: "Total Referrals", value: "0", icon: Users },
    { label: "Total Earnings", value: "$0.00", icon: DollarSign },
    { label: "Pending Rewards", value: "$0.00", icon: Gift },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Referral Program</h1>
          <p className="text-sm text-muted-foreground">Invite friends and earn rewards on their trades</p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground truncate font-mono">
              {referralLink}
            </div>
            <Button variant="gold" size="sm" className="gap-2 shrink-0" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Earn 10% commission on every trade your referrals make</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Share Your Link", desc: "Send your unique referral link to friends" },
              { step: "2", title: "Friends Sign Up", desc: "They create an account using your link" },
              { step: "3", title: "Earn Rewards", desc: "Get 10% commission on their trading fees" },
            ].map(s => (
              <div key={s.step} className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <p className="text-sm font-semibold text-foreground mb-1">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
