import { forwardRef } from "react";
import { Link } from "react-router-dom";

interface VerityLogoProps {
  variant?: "full" | "icon";
  className?: string;
  linkTo?: string;
}

/**
 * Verity brand logo — angular wing-tipped V with gold starburst spark.
 *
 * Brand colours:
 *   Charcoal  #212121  (light-mode V + text)
 *   White     #F3F3F3  (dark-mode V + text)
 *   Gold      #D4AF37  (spark accent — always)
 */
const VerityLogo = forwardRef<HTMLAnchorElement | SVGSVGElement, VerityLogoProps>(({
  variant = "full",
  className = "",
  linkTo = "/",
}, _ref) => {
  /* Shared SVG defs: golden glow filter for dark mode */
  const defs = (
    <defs>
      <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0.83 0 0 0 0  0.69 0 0 0 0  0.22 0 0 0 0  0 0 0 0.6 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  /* Angular wing-tipped V — filled shape using currentColor */
  const vShape = (
    <path
      d="M4 6 C4 6 8 5 13 12 L24 38 L35 12 C40 5 44 6 44 6 L42 8 C42 8 39 8 36 14 L24 42 L12 14 C9 8 6 8 6 8 Z"
      fill="currentColor"
    />
  );

  /* ---------- icon only (V + spark) ---------- */
  const icon = (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "icon" ? className || "h-8 w-8" : "h-full w-auto"}
      aria-label="Verity — Australian Speed-Dating"
      role="img"
    >
      {defs}
      {vShape}
      <g style={{ transformOrigin: "38px 11px", animation: "sparkEntry 0.8s ease-out both" }}>
        <path
          d="M38 4 L39.2 8.5 L43 6.5 L40.5 10 L45 10.8 L40.8 12.5 L44 15.5 L39.5 14 L39.8 18.5 L38 14.5 L36.2 18.5 L36.5 14 L32 15.5 L35.2 12.5 L31 10.8 L35.5 10 L33 6.5 L36.8 8.5 Z"
          fill="#D4AF37"
        />
      </g>
    </svg>
  );

  if (variant === "icon") {
    return linkTo ? (
      <Link to={linkTo} className="inline-flex text-foreground">
        {icon}
      </Link>
    ) : (
      icon
    );
  }

  /* ---------- full lockup (icon + VERITY text) ---------- */
  const full = (
    <svg
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || "h-8 w-auto"}
      aria-label="Verity — Australian Speed-Dating"
      role="img"
    >
      {defs}
      {vShape}
      <g style={{ transformOrigin: "38px 11px", animation: "sparkEntry 0.8s ease-out both" }}>
        <path
          d="M38 4 L39.2 8.5 L43 6.5 L40.5 10 L45 10.8 L40.8 12.5 L44 15.5 L39.5 14 L39.8 18.5 L38 14.5 L36.2 18.5 L36.5 14 L32 15.5 L35.2 12.5 L31 10.8 L35.5 10 L33 6.5 L36.8 8.5 Z"
          fill="#D4AF37"
        />
      </g>
      {/* VERITY wordmark */}
      <text
        x="56"
        y="33"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize="22"
        letterSpacing="6"
        fill="currentColor"
      >
        VERITY
      </text>
    </svg>
  );

  return linkTo ? (
    <Link to={linkTo} className="inline-flex text-foreground">
      {full}
    </Link>
  ) : (
    full
  );
});

VerityLogo.displayName = "VerityLogo";

export default VerityLogo;
