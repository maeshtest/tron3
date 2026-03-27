import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Plus, Search, MessageCircle, Flag, Share2, ChevronDown, Filter, Star, Clock, Shield, Wallet, ArrowUpDown, TrendingUp, TrendingDown, Users, AlertCircle, X } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";

const CRYPTO_FILTERS = ["All", "BTC", "ETH", "LTC", "SOL", "USDT", "BNB", "XRP"];
const PAYMENT_METHODS = [
  "All Payment Methods",
  "Bank Transfer",
  "M-Pesa",
  "PayPal",
  "Venmo",
  "Wire Transfer",
  "USDT TRC20",
  "USDT ERC20",
  "Cash",
  "Apple Pay",
  "Google Pay",
];
const SORT_OPTIONS = [
  { label: "Best Price", value: "bestPrice" },
  { label: "Price: Low to High", value: "priceAsc" },
  { label: "Price: High to Low", value: "priceDesc" },
  { label: "Trade Completion", value: "completionDesc" },
  { label: "Trade Count", value: "tradesDesc" },
];

// Sample offers extended with more realistic data
const sampleOffers = [
  {
    id: "1",
    user: "Kwame Asante",
    avatar: "KA",
    verified: true,
    vip: true,
    trades: 731,
    completion: 98,
    side: "sell",
    crypto: "BTC",
    cryptoId: "bitcoin",
    price: 63406.8,
    priceChange: -1.3,
    minAmount: 50,
    maxAmount: 4700,
    amountCrypto: 0.07,
    minCrypto: 0.00078856,
    maxCrypto: 0.07412456,
    methods: ["USDT TRC20", "BTC"],
    rating: 4.9,
    responseTime: "< 5 min",
    color: "#F7931A",
    location: "Accra, Ghana",
  },
  {
    id: "2",
    user: "Amara Diallo",
    avatar: "AD",
    verified: true,
    vip: false,
    trades: 762,
    completion: 96,
    side: "sell",
    crypto: "ETH",
    cryptoId: "ethereum",
    price: 1721.7,
    priceChange: -0.9,
    minAmount: 50,
    maxAmount: 2450,
    amountCrypto: 0.76,
    minCrypto: 0.02904,
    maxCrypto: 1.539132,
    methods: ["USDT TRC20", "USDT ERC20"],
    rating: 4.7,
    responseTime: "< 10 min",
    color: "#627EEA",
    location: "Dakar, Senegal",
  },
  {
    id: "3",
    user: "Kofi Mensah",
    avatar: "KM",
    verified: true,
    vip: false,
    trades: 855,
    completion: 96,
    side: "sell",
    crypto: "ETH",
    cryptoId: "ethereum",
    price: 1878.1,
    priceChange: 1.4,
    minAmount: 200,
    maxAmount: 3700,
    amountCrypto: 1.06,
    minCrypto: 0.106493,
    maxCrypto: 1.97012,
    methods: ["ETH"],
    rating: 4.8,
    responseTime: "< 3 min",
    color: "#627EEA",
    location: "Kumasi, Ghana",
  },
  {
    id: "4",
    user: "Sekou Traore",
    avatar: "ST",
    verified: true,
    vip: false,
    trades: 445,
    completion: 94,
    side: "sell",
    crypto: "BTC",
    cryptoId: "bitcoin",
    price: 57116.1,
    priceChange: 0.8,
    minAmount: 100,
    maxAmount: 5000,
    amountCrypto: 0.05,
    minCrypto: 0.00105049,
    maxCrypto: 0.06952786,
    methods: ["USDT TRC20", "BTC"],
    rating: 4.6,
    responseTime: "< 15 min",
    color: "#F7931A",
    location: "Bamako, Mali",
  },
  {
    id: "5",
    user: "Jamal Ndiaye",
    avatar: "JN",
    verified: true,
    vip: false,
    trades: 320,
    completion: 91,
    side: "buy",
    crypto: "USDT",
    cryptoId: "tether",
    price: 1.01,
    minAmount: 100,
    maxAmount: 10000,
    amountCrypto: 9900,
    minCrypto: 100,
    maxCrypto: 9900,
    methods: ["PayPal"],
    rating: 4.5,
    responseTime: "< 20 min",
    color: "#26A17B",
    location: "Dakar, Senegal",
  },
  {
    id: "6",
    user: "Olu Makinde",
    avatar: "OM",
    verified: false,
    vip: false,
    trades: 156,
    completion: 89,
    side: "sell",
    crypto: "SOL",
    cryptoId: "solana",
    price: 87.5,
    priceChange: -2.1,
    minAmount: 25,
    maxAmount: 1500,
    amountCrypto: 17.14,
    minCrypto: 0.285,
    maxCrypto: 17.14,
    methods: ["Bank Transfer"],
    rating: 4.2,
    responseTime: "< 30 min",
    color: "#9945FF",
    location: "Lagos, Nigeria",
  },
  {
    id: "7",
    user: "Tariq Khan",
    avatar: "TK",
    verified: true,
    vip: true,
    trades: 1203,
    completion: 99,
    side: "sell",
    crypto: "LTC",
    cryptoId: "litecoin",
    price: 54.2,
    priceChange: -0.5,
    minAmount: 20,
    maxAmount: 2000,
    amountCrypto: 36.9,
    minCrypto: 0.369,
    maxCrypto: 36.9,
    methods: ["M-Pesa", "Bank Transfer"],
    rating: 4.9,
    responseTime: "< 2 min",
    color: "#BFBBBB",
    location: "Nairobi, Kenya",
  },
  {
    id: "8",
    user: "Rashid Bello",
    avatar: "RB",
    verified: true,
    vip: false,
    trades: 498,
    completion: 95,
    side: "buy",
    crypto: "BTC",
    cryptoId: "bitcoin",
    price: 63200,
    priceChange: -1.5,
    minAmount: 500,
    maxAmount: 20000,
    amountCrypto: 0.31,
    minCrypto: 0.0079,
    maxCrypto: 0.3164,
    methods: ["Wire Transfer", "USDT TRC20"],
    rating: 4.7,
    responseTime: "< 8 min",
    color: "#F7931A",
    location: "Abuja, Nigeria",
  },
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
  const { prices } = useCryptoPrices();

  const getCoinImage = (cryptoId: string) => prices.find(p => p.id === cryptoId)?.image || "";

  // Filter and sort offers
  const filtered = useMemo(() => {
    let filteredOffers = sampleOffers.filter(o => {
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

    // Sorting
    switch (sortBy) {
      case "priceAsc":
        filteredOffers.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        filteredOffers.sort((a, b) => b.price - a.price);
        break;
      case "completionDesc":
        filteredOffers.sort((a, b) => b.completion - a.completion);
        break;
      case "tradesDesc":
        filteredOffers.sort((a, b) => b.trades - a.trades);
        break;
      case "bestPrice":
      default:
        // For buy: lowest price first, for sell: highest price first
        if (tab === "buy") filteredOffers.sort((a, b) => a.price - b.price);
        else filteredOffers.sort((a, b) => b.price - a.price);
        break;
    }
    return filteredOffers;
  }, [tab, cryptoFilter, search, amountFilter, methodFilter, sortBy]);

  // Stats
  const totalOffers = filtered.length;
  const bestPrice = totalOffers ? (tab === "buy" ? filtered[0]?.price : filtered[0]?.price) : 0;

  // Render stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : hasHalf && i === fullStars ? "fill-yellow-400 text-yellow-400 half-star" : "text-muted-foreground"}`}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">P2P Marketplace</h1>
            <p className="text-sm text-muted-foreground">Buy and sell crypto directly with other users</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setShowPostAd(true)}>
              <Plus className="h-3.5 w-3.5" /> Post Ad
            </Button>
          </div>
        </div>

        {/* Buy/Sell Tabs & Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setTab("buy")}
              className={`px-5 py-2 text-sm font-semibold transition-all ${tab === "buy" ? "bg-profit text-white" : "bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              Buy
            </button>
            <button
              onClick={() => setTab("sell")}
              className={`px-5 py-2 text-sm font-semibold transition-all ${tab === "sell" ? "bg-loss text-white" : "bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              Sell
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="text-muted-foreground">Secure Escrow</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">24/7 Support</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">{totalOffers} Ads</span>
            </div>
            {bestPrice > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-profit" />
                <span className="text-muted-foreground">Best {tab === "buy" ? "Buy" : "Sell"}: ${bestPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Crypto</label>
              <div className="flex flex-wrap gap-1">
                {CRYPTO_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setCryptoFilter(f)}
                    className={`px-2 py-1 rounded-md text-xs ${cryptoFilter === f ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Method</label>
              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
                className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Search and Amount Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search merchant"
              className="w-full h-10 rounded-lg bg-card border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <input
            type="number"
            value={amountFilter}
            onChange={e => setAmountFilter(e.target.value)}
            placeholder="Amount (USD)"
            className="h-10 rounded-lg bg-card border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-40"
          />
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setAmountFilter(""); setMethodFilter("All Payment Methods"); setCryptoFilter("All"); }} className="gap-1">
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>

        {/* Offers Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/20">
            <div className="col-span-3">Merchant</div>
            <div className="col-span-2">Price (USD)</div>
            <div className="col-span-3">Amount / Limits</div>
            <div className="col-span-2">Payment Methods</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No offers match your filters.
              </div>
            )}
            {filtered.map(offer => {
              const coinImg = getCoinImage(offer.cryptoId);
              return (
                <div key={offer.id} className="p-4 lg:px-5 lg:py-4 hover:bg-secondary/20 transition-colors">
                  {/* Mobile view: separate card */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                          {offer.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{offer.user}</span>
                            {offer.verified && <span className="text-[10px] text-primary">✓ Verified</span>}
                            {offer.vip && <span className="text-[10px] text-amber-400">VIP</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(offer.rating)}
                            <span className="text-[10px] text-muted-foreground">{offer.trades} trades</span>
                            <span className="text-[10px] text-profit">{offer.completion}%</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{offer.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">${offer.price.toLocaleString()}</p>
                        <p className={`text-[10px] ${offer.priceChange >= 0 ? "text-profit" : "text-loss"}`}>
                          {offer.priceChange >= 0 ? "+" : ""}{offer.priceChange}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">{offer.amountCrypto.toFixed(8)} {offer.crypto}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Limits</p>
                        <p className="text-muted-foreground">${offer.minAmount} - ${offer.maxAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {offer.methods.map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{m}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant={tab === "buy" ? "cta" : "destructive"} size="sm" className="text-xs px-4">
                        {tab === "buy" ? "Buy" : "Sell"} {offer.crypto}
                      </Button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary">
                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop view: grid */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                    {/* Merchant */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {offer.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{offer.user}</span>
                          {offer.verified && <span className="text-[10px] text-primary">✓</span>}
                          {offer.vip && <span className="text-[10px] text-amber-400">👑</span>}
                        </div>
                        {renderStars(offer.rating)}
                        <p className="text-[10px] text-muted-foreground">
                          {offer.trades} trades | {offer.completion}% completion
                        </p>
                        <p className="text-[10px] text-muted-foreground">{offer.location}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-foreground">${offer.price.toLocaleString()}</p>
                      {offer.priceChange !== undefined && (
                        <span className={`text-[10px] font-medium ${offer.priceChange >= 0 ? "text-profit" : "text-loss"}`}>
                          {offer.priceChange >= 0 ? "+" : ""}{offer.priceChange}%
                        </span>
                      )}
                      <p className="text-[10px] text-muted-foreground">≈ {offer.price} USD</p>
                    </div>

                    {/* Amount / Limits */}
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-foreground">
                        {offer.amountCrypto.toFixed(8)} {offer.crypto}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {offer.minCrypto.toFixed(6)} - {offer.maxCrypto.toFixed(6)} {offer.crypto}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ${offer.minAmount} - ${offer.maxAmount.toLocaleString()} USD
                      </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {offer.methods.map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Button
                        variant={tab === "buy" ? "cta" : "destructive"}
                        size="sm"
                        className="text-xs px-4"
                      >
                        {tab === "buy" ? "Buy" : "Sell"} {offer.crypto}
                      </Button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary" title="Chat">
                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Stay Safe on P2P</p>
              <p>Always complete trades within the platform escrow. Never share private keys or send funds outside the system. Verify user ratings and complete KYC for better trust.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Post Ad Modal */}
      {showPostAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Post New Ad</h2>
              <button onClick={() => setShowPostAd(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1">Type</label>
                <div className="flex gap-2">
                  <Button variant="gold" size="sm" className="flex-1">Buy</Button>
                  <Button variant="outline" size="sm" className="flex-1">Sell</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Crypto</label>
                <select className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary">
                  {CRYPTO_FILTERS.filter(f => f !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Price (USD)</label>
                <input type="number" placeholder="0.00" className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Available Amount ({tab === "buy" ? "USD" : "Crypto"})</label>
                <input type="number" placeholder="0.00" className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Payment Methods</label>
                <select multiple className="w-full h-24 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground">
                  {PAYMENT_METHODS.slice(1).map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <Button variant="gold" className="w-full">Post Ad</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default P2PMarketPage;
