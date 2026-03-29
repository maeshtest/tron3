import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, MessageCircle, Flag, Share2, ChevronDown, Filter,
  Star, Clock, Shield, Wallet, ArrowUpDown, TrendingUp, TrendingDown,
  Users, AlertCircle, X, DollarSign
} from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useWallet } from "@/hooks/useWallet"; // 👈 your new wallet hook
import { toast } from "sonner"; // or any toast library you use

const CRYPTO_FILTERS = ["All", "BTC", "ETH", "LTC", "SOL", "USDT", "BNB", "XRP"];
const PAYMENT_METHODS = [
  "All Payment Methods", "Bank Transfer", "M-Pesa", "PayPal", "Venmo",
  "Wire Transfer", "USDT TRC20", "USDT ERC20", "Cash", "Apple Pay", "Google Pay",
];
const SORT_OPTIONS = [
  { label: "Best Price", value: "bestPrice" },
  { label: "Price: Low to High", value: "priceAsc" },
  { label: "Price: High to Low", value: "priceDesc" },
  { label: "Trade Completion", value: "completionDesc" },
  { label: "Trade Count", value: "tradesDesc" },
];

// Initial sample offers (will be merged with user‑posted ads)
let initialOffers = [
  { id: "1", user: "Kwame Asante", avatar: "KA", verified: true, vip: true, trades: 731, completion: 98, side: "sell", crypto: "BTC", cryptoId: "bitcoin", price: 63406.8, priceChange: -1.3, minAmount: 50, maxAmount: 4700, amountCrypto: 0.07, minCrypto: 0.00078856, maxCrypto: 0.07412456, methods: ["USDT TRC20", "BTC"], rating: 4.9, responseTime: "< 5 min", color: "#F7931A", location: "Accra, Ghana" },
  { id: "2", user: "Amara Diallo", avatar: "AD", verified: true, vip: false, trades: 762, completion: 96, side: "sell", crypto: "ETH", cryptoId: "ethereum", price: 1721.7, priceChange: -0.9, minAmount: 50, maxAmount: 2450, amountCrypto: 0.76, minCrypto: 0.02904, maxCrypto: 1.539132, methods: ["USDT TRC20", "USDT ERC20"], rating: 4.7, responseTime: "< 10 min", color: "#627EEA", location: "Dakar, Senegal" },
  { id: "3", user: "Kofi Mensah", avatar: "KM", verified: true, vip: false, trades: 855, completion: 96, side: "sell", crypto: "ETH", cryptoId: "ethereum", price: 1878.1, priceChange: 1.4, minAmount: 200, maxAmount: 3700, amountCrypto: 1.06, minCrypto: 0.106493, maxCrypto: 1.97012, methods: ["ETH"], rating: 4.8, responseTime: "< 3 min", color: "#627EEA", location: "Kumasi, Ghana" },
  { id: "4", user: "Sekou Traore", avatar: "ST", verified: true, vip: false, trades: 445, completion: 94, side: "sell", crypto: "BTC", cryptoId: "bitcoin", price: 57116.1, priceChange: 0.8, minAmount: 100, maxAmount: 5000, amountCrypto: 0.05, minCrypto: 0.00105049, maxCrypto: 0.06952786, methods: ["USDT TRC20", "BTC"], rating: 4.6, responseTime: "< 15 min", color: "#F7931A", location: "Bamako, Mali" },
  { id: "5", user: "Jamal Ndiaye", avatar: "JN", verified: true, vip: false, trades: 320, completion: 91, side: "buy", crypto: "USDT", cryptoId: "tether", price: 1.01, minAmount: 100, maxAmount: 10000, amountCrypto: 9900, minCrypto: 100, maxCrypto: 9900, methods: ["PayPal"], rating: 4.5, responseTime: "< 20 min", color: "#26A17B", location: "Dakar, Senegal" },
  { id: "6", user: "Olu Makinde", avatar: "OM", verified: false, vip: false, trades: 156, completion: 89, side: "sell", crypto: "SOL", cryptoId: "solana", price: 87.5, priceChange: -2.1, minAmount: 25, maxAmount: 1500, amountCrypto: 17.14, minCrypto: 0.285, maxCrypto: 17.14, methods: ["Bank Transfer"], rating: 4.2, responseTime: "< 30 min", color: "#9945FF", location: "Lagos, Nigeria" },
  { id: "7", user: "Tariq Khan", avatar: "TK", verified: true, vip: true, trades: 1203, completion: 99, side: "sell", crypto: "LTC", cryptoId: "litecoin", price: 54.2, priceChange: -0.5, minAmount: 20, maxAmount: 2000, amountCrypto: 36.9, minCrypto: 0.369, maxCrypto: 36.9, methods: ["M-Pesa", "Bank Transfer"], rating: 4.9, responseTime: "< 2 min", color: "#BFBBBB", location: "Nairobi, Kenya" },
  { id: "8", user: "Rashid Bello", avatar: "RB", verified: true, vip: false, trades: 498, completion: 95, side: "buy", crypto: "BTC", cryptoId: "bitcoin", price: 63200, priceChange: -1.5, minAmount: 500, maxAmount: 20000, amountCrypto: 0.31, minCrypto: 0.0079, maxCrypto: 0.3164, methods: ["Wire Transfer", "USDT TRC20"], rating: 4.7, responseTime: "< 8 min", color: "#F7931A", location: "Abuja, Nigeria" },
];

const P2PMarketPage = () => {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [cryptoFilter, setCryptoFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("All Payment Methods");
  const [sortBy, setSortBy] = useState("bestPrice");
  const [showFilters, setShowFilters] = useState(false);
  const [showPostAd, setShowPostAd] = useState(false);
  const [offers, setOffers] = useState(initialOffers);
  const { prices } = useCryptoPrices();
  const { fiatBalance, cryptoBalances, deposit, buyCrypto, sellCrypto } = useWallet();

  const getCoinImage = (cryptoId: string) => prices.find(p => p.id === cryptoId)?.image || "";

  // Filter & sort offers (same as before, but now using dynamic offers state)
  const filtered = useMemo(() => {
    let filteredOffers = offers.filter(o => {
      if (tab === "buy" ? o.side !== "sell" : o.side !== "buy") return false;
      if (cryptoFilter !== "All" && o.crypto !== cryptoFilter) return false;
      if (search && !o.user.toLowerCase().includes(search.toLowerCase())) return false;
      if (amountFilter) {
        const amt = Number(amountFilter);
        if (amt < o.minAmount || amt > o.maxAmount) return false;
      }
      if (methodFilter !== "All Payment Methods" && !o.methods.includes(methodFilter)) return false;
      return true;
    });

    switch (sortBy) {
      case "priceAsc": filteredOffers.sort((a, b) => a.price - b.price); break;
      case "priceDesc": filteredOffers.sort((a, b) => b.price - a.price); break;
      case "completionDesc": filteredOffers.sort((a, b) => b.completion - a.completion); break;
      case "tradesDesc": filteredOffers.sort((a, b) => b.trades - a.trades); break;
      default:
        if (tab === "buy") filteredOffers.sort((a, b) => a.price - b.price);
        else filteredOffers.sort((a, b) => b.price - a.price);
        break;
    }
    return filteredOffers;
  }, [tab, cryptoFilter, search, amountFilter, methodFilter, sortBy, offers]);

  const totalOffers = filtered.length;
  const bestPrice = totalOffers ? (tab === "buy" ? filtered[0]?.price : filtered[0]?.price) : 0;

  // 🛒 Handle Buy
  const handleBuy = async (offer: typeof offers[0]) => {
    const totalCost = offer.price * offer.amountCrypto;
    if (totalCost > fiatBalance) {
      toast.error(`Insufficient balance. Need $${totalCost.toFixed(2)}. Please deposit first.`);
      // Optionally open deposit modal
      const shouldDeposit = confirm("Not enough fiat. Would you like to deposit?");
      if (shouldDeposit) await deposit(totalCost - fiatBalance);
      return;
    }
    if (totalCost < offer.minAmount || totalCost > offer.maxAmount) {
      toast.error(`Amount out of range ($${offer.minAmount} - $${offer.maxAmount})`);
      return;
    }
    try {
      buyCrypto(offer.crypto, offer.amountCrypto, totalCost);
      toast.success(`Bought ${offer.amountCrypto} ${offer.crypto} for $${totalCost.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 🛒 Handle Sell
  const handleSell = async (offer: typeof offers[0]) => {
    const cryptoAmount = offer.amountCrypto;
    const totalReceive = offer.price * cryptoAmount;
    const currentBalance = cryptoBalances[offer.crypto] || 0;
    if (currentBalance < cryptoAmount) {
      toast.error(`Insufficient ${offer.crypto} balance. You have ${currentBalance.toFixed(6)} ${offer.crypto}`);
      return;
    }
    if (totalReceive < offer.minAmount || totalReceive > offer.maxAmount) {
      toast.error(`Receive amount out of range ($${offer.minAmount} - $${offer.maxAmount})`);
      return;
    }
    try {
      sellCrypto(offer.crypto, cryptoAmount, totalReceive);
      toast.success(`Sold ${cryptoAmount} ${offer.crypto} for $${totalReceive.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 📝 Post new ad (simulator – adds to local state)
  const postNewAd = (adData: any) => {
    const newId = String(Date.now());
    const newOffer = {
      id: newId,
      user: "You", // current user
      avatar: "ME",
      verified: true,
      vip: false,
      trades: 0,
      completion: 100,
      side: adData.type,
      crypto: adData.crypto,
      cryptoId: adData.crypto.toLowerCase(),
      price: adData.price,
      priceChange: 0,
      minAmount: adData.minAmount,
      maxAmount: adData.maxAmount,
      amountCrypto: adData.amount,
      minCrypto: adData.amount * (adData.minAmount / adData.maxAmount), // rough
      maxCrypto: adData.amount,
      methods: adData.methods,
      rating: 5.0,
      responseTime: "< 1 min",
      color: "#000000",
      location: "Your City",
    };
    setOffers(prev => [newOffer, ...prev]);
    toast.success("Ad posted successfully!");
    setShowPostAd(false);
  };

  const renderStars = (rating: number) => { /* same as before */ };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header with Deposit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">P2P Marketplace</h1>
            <p className="text-sm text-muted-foreground">Buy and sell crypto directly with other users</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => deposit(100)} className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Deposit (Simulate)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowPostAd(true)}>
              <Plus className="h-3.5 w-3.5" /> Post Ad
            </Button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-6 text-sm">
          <div><span className="text-muted-foreground">💰 Fiat balance:</span> <strong>${fiatBalance.toFixed(2)}</strong></div>
          <div><span className="text-muted-foreground">📊 Crypto:</span> {Object.entries(cryptoBalances).map(([c, v]) => v > 0 ? `${c}: ${v.toFixed(4)} ` : "").filter(Boolean).join(" | ") || "None"}</div>
        </div>

        {/* Rest of UI (tabs, filters, table, etc.) - same as original, but replace the Buy/Sell button actions */}
        {/* ... (copy the exact same JSX from your original component, only change the onClick handlers) */}
        {/* For brevity, I'll show only the changed part inside the offers loop */}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* header... */}
          <div className="divide-y divide-border">
            {filtered.map(offer => (
              <div key={offer.id} className="p-4 lg:px-5 lg:py-4">
                {/* Mobile & Desktop views - same as original, but modify the button onClick */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant={tab === "buy" ? "cta" : "destructive"}
                    size="sm"
                    className="text-xs px-4"
                    onClick={() => tab === "buy" ? handleBuy(offer) : handleSell(offer)}
                  >
                    {tab === "buy" ? "Buy" : "Sell"} {offer.crypto}
                  </Button>
                  <button className="p-1.5 rounded-lg hover:bg-secondary">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post Ad Modal - updated to call postNewAd */}
        {showPostAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Post New Ad</h2>
                <button onClick={() => setShowPostAd(false)} className="p-1 hover:bg-secondary rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Ad form fields - same as original, but add state and onSubmit */}
                {/* For brevity, assume you have local state: type, crypto, price, amount, minAmount, maxAmount, methods */}
                <Button variant="gold" className="w-full" onClick={() => {
                  // collect form values and call postNewAd
                  postNewAd({ type: "buy", crypto: "BTC", price: 60000, amount: 0.1, minAmount: 100, maxAmount: 5000, methods: ["Bank Transfer"] });
                }}>Post Ad</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default P2PMarketPage;
