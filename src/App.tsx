import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CryptoWalletPage from "./pages/CryptoWalletPage.tsx";
import FiatWalletPage from "./pages/FiatWalletPage.tsx";
import P2PMarketPage from "./pages/P2PMarketPage.tsx";
import MarketsPage from "./pages/MarketsPage.tsx";
import SpotTradingPage from "./pages/SpotTradingPage.tsx";
import CoinDetailPage from "./pages/CoinDetailPage.tsx";
import FuturesPage from "./pages/FuturesPage.tsx";
import BotsPage from "./pages/BotsPage.tsx";
import EarnStakePage from "./pages/EarnStakePage.tsx";
import ReferralPage from "./pages/ReferralPage.tsx";
import ConverterPage from "./pages/ConverterPage.tsx";
import DepositPage from "./pages/DepositPage.tsx";
import WithdrawPage from "./pages/WithdrawPage.tsx";
import TransactionHistoryPage from "./pages/TransactionHistoryPage.tsx";
import PaymentMethodsPage from "./pages/PaymentMethodsPage.tsx";
import KYCPage from "./pages/KYCPage.tsx";
import SecurityPage from "./pages/SecurityPage.tsx";
import HelpPage from "./pages/HelpPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/coin/:coinId" element={<CoinDetailPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/crypto-wallet" element={<ProtectedRoute><CryptoWalletPage /></ProtectedRoute>} />
            <Route path="/fiat-wallet" element={<ProtectedRoute><FiatWalletPage /></ProtectedRoute>} />
            <Route path="/p2p" element={<ProtectedRoute><P2PMarketPage /></ProtectedRoute>} />
            <Route path="/markets" element={<ProtectedRoute><MarketsPage /></ProtectedRoute>} />
            <Route path="/spot-trading" element={<ProtectedRoute><SpotTradingPage /></ProtectedRoute>} />
            <Route path="/futures" element={<ProtectedRoute><FuturesPage /></ProtectedRoute>} />
            <Route path="/bots" element={<ProtectedRoute><BotsPage /></ProtectedRoute>} />
            <Route path="/earn" element={<ProtectedRoute><EarnStakePage /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
            <Route path="/converter" element={<ProtectedRoute><ConverterPage /></ProtectedRoute>} />
            <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
            <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
