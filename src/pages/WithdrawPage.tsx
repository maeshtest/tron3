import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Inbox, AlertTriangle, ChevronDown, Copy, Check, DollarSign, ArrowRight } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { useAppStore } from "@/stores/useAppStore";
import { useSiteSettingsDB } from "@/hooks/useSiteSettingsDB";
import { toast } from "sonner";

const WITHDRAW_COINS = [
  { id: "tether", symbol: "USDT", networks: ["TRC-20", "ERC-20", "BEP-20"] },
  { id: "bitcoin", symbol: "BTC", networks: ["BTC"] },
  { id: "ethereum", symbol: "ETH", networks: ["ERC-20"] },
  { id: "binancecoin", symbol: "BNB", networks: ["BEP-20"] },
  { id: "ripple", symbol: "XRP", networks: ["XRP"] },
  { id: "solana", symbol: "SOL", networks: ["SOL"] },
  { id: "cardano", symbol: "ADA", networks: ["ADA"] },
];

const WithdrawPage = () => {
  const [selectedCrypto, setSelectedCrypto] = useState("tether");
  const [amountUSD, setAmountUSD] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [copied, setCopied] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const { prices, getSymbol } = useCryptoPrices();
  const { wallets, getBalance, loading: walletsLoading } = useWallets();
  const { transactions, createTransaction } = useTransactions();
  const { settings, isLoading: settingsLoading } = useSiteSettingsDB();
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  // Settings defaults
  const withdrawFee = settings?.withdraw_fee_percent || 1;
  const minWithdrawUSD = settings?.min_withdraw || 20;
  const maxWithdrawUSD = 10000; // or from settings

  // Selected coin info
  const selectedCoinMeta = WITHDRAW_COINS.find(c => c.id === selectedCrypto);
  const selectedPrice = prices.find(p => p.id === selectedCrypto);
  const cryptoBalance = getBalance(selectedCrypto);
  const usdtBalance = getBalance("tether");

  // Calculations
  const usdAmount = Number(amountUSD) || 0;
  const cryptoAmount = selectedCrypto === "tether" ? usdAmount : (selectedPrice ? usdAmount / selectedPrice.current_price : 0);
  const feeAmountUSD = usdAmount * (withdrawFee / 100);
  const netAmountUSD = usdAmount - feeAmountUSD;
  const netCryptoAmount = selectedCrypto === "tether" ? netAmountUSD : (selectedPrice ? netAmountUSD / selectedPrice.current_price : 0);

  // Total balance in USD
  const totalUsd = useMemo(() => {
    return wallets.reduce((sum, w) => {
      const price = w.crypto_id === "usdt" ? 1 : (prices.find(p => p.id === w.crypto_id)?.current_price ?? 0);
      return sum + w.balance * price;
    }, 0);
  }, [wallets, prices]);

  // Validation
  const isValidAmount = usdAmount >= minWithdrawUSD && usdAmount <= maxWithdrawUSD;
  const hasEnoughBalance = cryptoAmount <= cryptoBalance;
  const isValidAddress = walletAddress.trim().length > 0;
  const isValidNetwork = selectedNetwork ? selectedCoinMeta?.networks.includes(selectedNetwork) : true;
  const canWithdraw = isValidAmount && hasEnoughBalance && isValidAddress && isValidNetwork && !walletsLoading && !settingsLoading;

  // Handle withdraw request
  const handleWithdraw = async () => {
    if (!isValidAmount) {
      toast.error(`Amount must be between $${minWithdrawUSD} and $${maxWithdrawUSD}`);
      return;
    }
    if (!hasEnoughBalance) {
      toast.error(`Insufficient ${getSymbol(selectedCrypto)} balance. Available: ${cryptoBalance.toFixed(8)}`);
      return;
    }
    if (!isValidAddress) {
      toast.error("Please enter a valid wallet address");
      return;
    }
    if (!isValidNetwork) {
      toast.error("Please select a valid network");
      return;
    }

    try {
      await createTransaction({
        type: "withdrawal",
        crypto_id: selectedCrypto,
        amount: cryptoAmount,
        usd_amount: netAmountUSD,
        wallet_address: walletAddress,
      });
      toast.success("Withdrawal request submitted! Awaiting admin approval.");
      setAmountUSD("");
      setWalletAddress("");
      setSelectedNetwork("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Copy example address (for demo)
  const copyExampleAddress = () => {
    navigator.clipboard.writeText("0x742d35Cc6634C0532925a3b844Bc9e7cBc9e7c");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Example address copied");
  };

  // Pending withdrawals
  const pendingWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "pending");

  // Input classes
  const inputClass = "w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Withdrawals require admin approval and are typically processed within 24 hours
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-border rounded-2xl p-5 text-center">
          <p className="text-3xl font-display font-bold text-foreground">
            {sym}{totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Balance</p>
        </div>

        {/* Coin Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Select Coin</label>
          <div className="flex flex-wrap gap-2">
            {WITHDRAW_COINS.map(coin => {
              const img = prices.find(p => p.id === coin.id)?.image;
              const balance = getBalance(coin.id);
              return (
                <button
                  key={coin.id}
                  onClick={() => {
                    setSelectedCrypto(coin.id);
                    setSelectedNetwork(coin.networks[0]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCrypto === coin.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {img && <img src={img} alt={coin.symbol} className="w-5 h-5 rounded-full" />}
                  <span>{coin.symbol}</span>
                  <span className="text-xs opacity-70">({balance.toFixed(4)})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          {/* Amount in USD */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Amount ({sym})
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                placeholder={`Min $${minWithdrawUSD}`}
                className={`${inputClass} pl-9`}
                min={minWithdrawUSD}
                max={maxWithdrawUSD}
              />
            </div>
            {usdAmount > 0 && (
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>≈ {cryptoAmount.toFixed(selectedCrypto === "tether" ? 2 : 8)} {getSymbol(selectedCrypto)}</span>
                <span>Min: ${minWithdrawUSD} | Max: ${maxWithdrawUSD}</span>
              </div>
            )}
          </div>

          {/* Fee Breakdown */}
          {usdAmount > 0 && (
            <div className="bg-secondary/50 border border-border rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground">{sym}{usdAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee ({withdrawFee}%)</span>
                <span className="text-loss">-{sym}{feeAmountUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-1">
                <span className="text-foreground">You receive</span>
                <span className="text-profit">{sym}{netAmountUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>≈ {netCryptoAmount.toFixed(selectedCrypto === "tether" ? 2 : 8)} {getSymbol(selectedCrypto)}</span>
                <span></span>
              </div>
            </div>
          )}

          {/* Network Selection */}
          {selectedCoinMeta && selectedCoinMeta.networks.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Network</label>
              <div className="relative">
                <button
                  onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground flex items-center justify-between"
                >
                  <span>{selectedNetwork || "Select network"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showNetworkDropdown ? "rotate-180" : ""}`} />
                </button>
                {showNetworkDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {selectedCoinMeta.networks.map(net => (
                      <button
                        key={net}
                        onClick={() => {
                          setSelectedNetwork(net);
                          setShowNetworkDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors"
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Wallet Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={`Enter your ${getSymbol(selectedCrypto)} address`}
                className={`${inputClass} pr-10`}
              />
              <button
                onClick={copyExampleAddress}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                title="Paste example address"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Double‑check the address and network. Sending to wrong network may result in loss.
            </p>
          </div>

          {/* Important Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Withdrawals are reviewed by our team and typically processed within 24 hours. 
              A fee of {withdrawFee}% applies.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            variant="gold"
            className="w-full h-11"
            onClick={handleWithdraw}
            disabled={!canWithdraw || walletsLoading || settingsLoading}
          >
            {walletsLoading || settingsLoading ? "Loading..." : "Request Withdrawal"}
          </Button>
        </div>

        {/* Pending Withdrawals */}
        <div className="space-y-3">
          <h2 className="text-lg font-display font-bold text-foreground text-center">
            Pending Withdrawals
          </h2>
          {pendingWithdrawals.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.map(t => {
                const img = prices.find(p => p.id === t.crypto_id)?.image;
                return (
                  <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {img && <img src={img} alt={t.crypto_id} className="w-8 h-8 rounded-full" />}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {getSymbol(t.crypto_id)} Withdrawal
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()} • {t.network || "Network"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {sym}{t.usd_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Pending
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WithdrawPage;
