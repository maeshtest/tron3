import { Link } from "react-router-dom";
import TronnlixLogo from "@/components/TronnlixLogo";
import { Mail, Youtube, MessageCircle, Github } from "lucide-react";

const footerSections = [
  {
    title: "About",
    links: [
      { label: "About Us", href: "/help" },
      { label: "Contact Us", href: "/help" },
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Disclaimer", href: "#" },
      { label: "Our Story", href: "#" },
      { label: "Trust & Safety", href: "#" },
    ],
  },
  {
    title: "Buy Crypto",
    links: [
      { label: "Buy BTC", href: "/coin/bitcoin" },
      { label: "Buy ETH", href: "/coin/ethereum" },
      { label: "Buy SOL", href: "/coin/solana" },
      { label: "Buy XRP", href: "/coin/ripple" },
      { label: "Buy DOGE", href: "/coin/dogecoin" },
      { label: "Buy AVAX", href: "/coin/avalanche-2" },
      { label: "Buy USDT", href: "/coin/tether" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Spot Trading", href: "/spot-trading" },
      { label: "Futures Trading", href: "/futures" },
      { label: "Copy Trading", href: "/bots" },
      { label: "Earn", href: "/earn" },
      { label: "Converter", href: "/converter" },
      { label: "P2P Market", href: "/p2p" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Market Maker", href: "/bots" },
      { label: "Referral Reward", href: "/referral" },
      { label: "VIP", href: "/bots" },
      { label: "Fee Schedule", href: "/help" },
      { label: "Trading Bots", href: "/bots" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Support", href: "/help" },
      { label: "Announcements", href: "#" },
      { label: "Security", href: "/security" },
      { label: "KYC Verification", href: "/kyc" },
    ],
  },
];

const socialIcons = [
  { icon: Mail, href: "#", label: "Email" },
  { icon: MessageCircle, href: "#", label: "Telegram" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      {/* Logo & tagline */}
      <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
        <div className="md:w-56 shrink-0">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <TronnlixLogo size={32} />
            <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tronnlix
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Your Gateway to Borderless Trading
          </p>
        </div>

        {/* Link columns */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          {socialIcons.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="p-2 rounded-full bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title={s.label}
            >
              <s.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          © 2017-2026 Tronnlix.com. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
