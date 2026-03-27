import { forwardRef } from "react";

interface TronnlixLogoProps {
  className?: string;
  size?: number;
}

const TronnlixLogo = forwardRef<SVGSVGElement, TronnlixLogoProps>(
  ({ className = "", size = 32 }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tronnlixGrad" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="55" stroke="url(#tronnlixGrad)" strokeWidth="2" opacity="0.2" />
      <polygon
        points="60,25 90,45 90,75 60,95 30,75 30,45"
        fill="url(#tronnlixGrad)"
        opacity="0.15"
      />
      <path
        d="M40 45 H80 M60 45 V80"
        stroke="url(#tronnlixGrad)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="60" cy="15" r="3" fill="hsl(var(--accent))" />
      <circle cx="105" cy="60" r="3" fill="hsl(var(--primary))" />
      <circle cx="60" cy="105" r="3" fill="hsl(var(--accent))" />
      <circle cx="15" cy="60" r="3" fill="hsl(var(--primary))" />
    </svg>
  )
);

TronnlixLogo.displayName = "TronnlixLogo";

export default TronnlixLogo;
