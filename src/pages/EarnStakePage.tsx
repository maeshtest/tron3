import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Coins, Lock, TrendingUp, Wallet, Clock, ArrowUpRight, ArrowDownRight, AlertCircle, X, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useWallets } from "@/hooks/useWallets";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "sonner";

// Staking options (APY, lock days, min stake)
const stakingOptions = [
  { id: "ethereum", coin: "ETH", name: "Ethereum", apy: 4.5, lockDays: 30, minStake: 0.1 },
  { id: "solana", coin: "SOL", name: "Solana", apy: 7.2, lockDays: 60, minStake: 1 },
  { id: "polkadot", coin: "DOT", name: "Polkadot", apy: 12.0, lockDays: 90, minStake: 10 },
  { id: "cardano", coin: "ADA", name: "Cardano", apy: 5.8, lockDays: 30, minStake: 50 },
  { id: "avalanche-2", coin: "AVAX", name: "Avalanche", apy: 8.5, lockDays: 45, minStake: 5 },
  { id: "matic-network", coin: "MATIC", name: "Polygon", apy: 6.3, lockDays: 30, minStake: 100 },
];

interface StakingPosition {
  id: string;
  cryptoId: string;
  coinSymbol: string;
  amount: number;
  startDate: string;
  endDate: string;
  apy: number;
  lockDays: number;
  status: "active" | "ended";
}

// Helper: get mock or localStorage staking positions
const getStakingPositions = (): StakingPosition[] => {
  const saved = localStorage.getItem("staking_positions");
  if (saved) return JSON.parse(saved);
  return [];
};

const saveStakingPositions = (positions: StakingPosition[]) => {
  localStorage.setItem("staking_positions", JSON.stringify(positions));
};

const EarnStakePage = () => {
  const { prices, getSymbol, loading: pricesLoading } = useCryptoPrices();
  const { wallets, getBalance, fetchWallets } = useWallets();
  const { user } = useAuth();
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);

  // Load staking positions from localStorage on mount
  useEffect(() => {
    setStakingPositions(getStakingPositions());
  }, []);

  // Save positions whenever they change
  useEffect(() => {
    if (stakingPositions.length) {
      saveStakingPositions(stakingPositions);
    }
  }, [stakingPositions]);

  // Calculate total staked in USD
  const totalStakedUSD = useMemo(() => {
    let total = 0;
    stakingPositions.forEach(pos => {
      const price = prices.find(p => p.id === pos.cryptoId)?.current_price || 0;
      total += pos.amount * price;
    });
    return total;
  }, [stakingPositions, prices]);

  // Calculate total earned (mock – based on APY and time passed)
  const totalEarnedUSD = useMemo(() => {
    let earned = 0;
    const now = Date.now();
    stakingPositions.forEach(pos => {
      if (pos.status !== "active") return;
      const start = new Date(pos.startDate).getTime();
      const daysStaked = (now - start) / (1000 * 60 * 60 * 24);
      const apyDaily = pos.apy / 365 / 100;
      const earnedInCoin = pos.amount * apyDaily * daysStaked;
      const price = prices.find(p => p.id === pos.cryptoId)?.current_price || 0;
      earned += earnedInCoin * price;
    });
    return earned;
  }, [stakingPositions, prices]);

  const activeStakesCount = stakingPositions.filter(p => p.status === "active").length;

  // Get coin image from price data
  const getCoinImage = (cryptoId: string) => {
    return prices.find(p => p.id === cryptoId)?.image || "";
  };

  // Handle stake
  const handleStake = async () => {
    if (!selectedOption) return;
    const amount = Number(stakeAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount < selectedOption.minStake) {
      toast.error(`Minimum stake is ${selectedOption.minStake} ${selectedOption.coin}`);
      return;
    }
    const balance = getBalance(selectedOption.id);
    if (amount > balance) {
      toast.error(`Insufficient balance. You have ${balance.toFixed(4)} ${selectedOption.coin}`);
      return;
    }

    setStakeLoading(true);
    try {
      // Deduct from wallet via supabase
      const wallet = wallets.find(w => w.crypto_id === selectedOption.id);
      if (wallet) {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("wallets").update({ balance: balance - amount }).eq("id", wallet.id);
      }
      await fetchWallets();

      // Create new staking position
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + selectedOption.lockDays);

      const newPosition: StakingPosition = {
        id: Date.now().toString(),
        cryptoId: selectedOption.id,
        coinSymbol: selectedOption.coin,
        amount: amount,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        apy: selectedOption.apy,
        lockDays: selectedOption.lockDays,
        status: "active",
      };
      const updated = [...stakingPositions, newPosition];
      setStakingPositions(updated);
      toast.success(`Staked ${amount} ${selectedOption.coin} for ${selectedOption.lockDays} days!`);
      setStakeAmount("");
      setModalOpen(false);
      setSelectedOption(null);
    } catch (err: any) {
      toast.error(err.message || "Staking failed");
    } finally {
      setStakeLoading(false);
    }
  };

  // Unstake (ends position)
  const unstake = async (position: StakingPosition) => {
    if (new Date(position.endDate) > new Date()) {
      toast.warning(`This stake is locked until ${new Date(position.endDate).toLocaleDateString()}`);
      return;
    }
    // Add amount back to wallet
    const wallet = wallets.find(w => w.crypto_id === position.cryptoId);
    if (wallet) {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + position.amount }).eq("id", wallet.id);
    }
    await fetchWallets();
    const updated = stakingPositions.filter(p => p.id !== position.id);
    setStakingPositions(updated);
    toast.success(`Unstaked ${position.amount} ${position.coinSymbol}`);
  };

  // Helper to format date
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  // Loading state
  if (pricesLoading && prices.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Earn & Stake</h1>
          <p className="text-sm text-muted-foreground">Stake your crypto and earn passive income</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Staked", value: `${sym}${totalStakedUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Coins },
            { label: "Total Earned", value: `${sym}${totalEarnedUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingUp },
            { label: "Active Stakes", value: activeStakesCount.toString(), icon: Lock },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Staking Options */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Available Staking Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakingOptions.map(opt => {
              const price = prices.find(p => p.id === opt.id);
              const image = price?.image || "";
              return (
                <div key={opt.id} className="bg-secondary/50 rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer" onClick={() => { setSelectedOption(opt); setModalOpen(true); }}>
                  <div className="flex items-center gap-3 mb-3">
                    {image && <img src={image} alt={opt.name} className="w-8 h-8 rounded-full" />}
                    <div>
                      <p className="text-sm font-bold text-foreground">{opt.coin}</p>
                      <p className="text-xs text-muted-foreground">{opt.name}</p>
                    </div>
                    <span className="ml-auto text-lg font-bold text-profit">{opt.apy}% APY</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Lock: {opt.lockDays} days</span>
                    <span>Min: {opt.minStake} {opt.coin}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">Available: {getBalance(opt.id).toFixed(4)} {opt.coin}</span>
                    <Button variant="gold" size="sm" className="text-xs h-8">Stake Now</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Stakes */}
        {stakingPositions.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Your Active Stakes</h2>
            <div className="space-y-3">
              {stakingPositions.map(pos => {
                const isLocked = new Date(pos.endDate) > new Date();
                const progress = ((Date.now() - new Date(pos.startDate).getTime()) / (pos.lockDays * 24 * 60 * 60 * 1000)) * 100;
                const price = prices.find(p => p.id === pos.cryptoId)?.current_price || 0;
                const valueUSD = pos.amount * price;
                return (
                  <div key={pos.id} className="bg-secondary/30 rounded-xl p-4 border border-border">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <img src={getCoinImage(pos.cryptoId)} alt={pos.coinSymbol} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{pos.coinSymbol}</p>
                          <p className="text-xs text-muted-foreground">{pos.amount} {pos.coinSymbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{sym}{valueUSD.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">APY: {pos.apy}%</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Locked until {formatDate(pos.endDate)}</span>
                        <span>{progress.toFixed(0)}% complete</span>
                      </div>
                      <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      {!isLocked && (
                        <Button variant="outline" size="sm" onClick={() => unstake(pos)} className="text-xs gap-1">
                          <ArrowUpRight className="h-3 w-3" /> Unstake
                        </Button>
                      )}
                      {isLocked && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stake Modal */}
        {modalOpen && selectedOption && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src={getCoinImage(selectedOption.id)} alt={selectedOption.coin} className="w-6 h-6 rounded-full" />
                  <h2 className="text-lg font-bold text-foreground">Stake {selectedOption.coin}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-secondary/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="text-profit font-bold">{selectedOption.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lock Period</span>
                    <span className="text-foreground">{selectedOption.lockDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Stake</span>
                    <span className="text-foreground">{selectedOption.minStake} {selectedOption.coin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="text-foreground font-medium">{getBalance(selectedOption.id).toFixed(4)} {selectedOption.coin}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Amount to Stake ({selectedOption.coin})</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={e => setStakeAmount(e.target.value)}
                    placeholder={`Min ${selectedOption.minStake}`}
                    className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground"
                  />
                  {stakeAmount && Number(stakeAmount) < selectedOption.minStake && (
                    <p className="text-xs text-loss mt-1">Minimum stake is {selectedOption.minStake} {selectedOption.coin}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button variant="gold" className="flex-1" onClick={handleStake} disabled={stakeLoading || Number(stakeAmount) < selectedOption.minStake}>
                    {stakeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stake Now"}
                  </Button>
                </div>
                <div className="flex items-start gap-2 p-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Funds will be locked for {selectedOption.lockDays} days. Early withdrawal is not possible.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EarnStakePage;
