// ============================================
// AuthIcons - Shared SVG icons + CM badge for auth pages
// Save as: client/src/pages/auth/AuthIcons.tsx
// ============================================

const TEETH = 16;

export const CMBadge = ({ size = 96 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <linearGradient id="cmBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6fb1ea" />
        <stop offset="100%" stopColor="#1e5faa" />
      </linearGradient>
    </defs>
    <g fill="#0f2340">
      {Array.from({ length: TEETH }).map((_, i) => (
        <rect
          key={i}
          x="56"
          y="1"
          width="8"
          height="15"
          rx="1.5"
          transform={`rotate(${(360 / TEETH) * i} 60 60)`}
        />
      ))}
    </g>
    <circle
      cx="60"
      cy="60"
      r="44"
      fill="url(#cmBadgeGrad)"
      stroke="#0a1830"
      strokeWidth="3"
    />
    <circle
      cx="60"
      cy="60"
      r="44"
      fill="none"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1"
    />
    <text
      x="60"
      y="73"
      textAnchor="middle"
      fontFamily="Arial, sans-serif"
      fontWeight={800}
      fontSize="36"
      fill="#ffffff"
    >
      CM
    </text>
  </svg>
);

export const UserIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9.9 4.24A9.5 9.5 0 0 1 12 4c7 0 11 7 11 7a17.9 17.9 0 0 1-3.4 4.55M6.6 6.6C3.7 8.4 1 12 1 12s4 7 11 7a9.6 9.6 0 0 0 4.4-1.05M14.1 14.1a3 3 0 1 1-4.2-4.2" />
    <path d="M1 1l22 22" />
  </svg>
);

export const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const GearIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const SnowflakeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11" />
    <path d="M12 2 9.5 4.5M12 2l2.5 2.5M12 22l-2.5-2.5M12 22l2.5-2.5M4.2 6.5 3.8 9.3M4.2 6.5 7 6M19.8 6.5l.4 2.8M19.8 6.5 17 6M4.2 17.5l-.4-2.8M4.2 17.5 7 18M19.8 17.5l.4-2.8M19.8 17.5 17 18" />
  </svg>
);

export const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Faint hexagon grid, corner-anchored, fading toward the center — matches the reference art
export const HexPattern = ({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) => (
  <svg
    className={className}
    viewBox="0 0 400 400"
    aria-hidden="true"
    style={flip ? { transform: "scaleX(-1)" } : undefined}
  >
    <defs>
      <pattern
        id={`hexGrid-${flip ? "r" : "l"}`}
        width="40"
        height="46.2"
        patternUnits="userSpaceOnUse"
      >
        <polygon
          points="20,0 40,11.5 40,34.5 20,46 0,34.5 0,11.5"
          fill="none"
          stroke="rgba(100,181,246,0.35)"
          strokeWidth="1"
        />
      </pattern>
      <radialGradient
        id={`hexFade-${flip ? "r" : "l"}`}
        cx="0%"
        cy="0%"
        r="100%"
      >
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="65%" stopColor="white" stopOpacity="0.35" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id={`hexMask-${flip ? "r" : "l"}`}>
        <rect
          width="400"
          height="400"
          fill={`url(#hexFade-${flip ? "r" : "l"})`}
        />
      </mask>
    </defs>
    <rect
      width="400"
      height="400"
      fill={`url(#hexGrid-${flip ? "r" : "l"})`}
      mask={`url(#hexMask-${flip ? "r" : "l"})`}
    />
  </svg>
);

// Glowing wave accent with a traveling light, anchored to the bottom of the page
export const WaveAccent = () => {
  const path =
    "M0,130 C150,70 260,180 420,120 C580,60 680,170 860,110 C1000,65 1100,110 1200,90";
  return (
    <svg
      className="wave-accent"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a90d9" stopOpacity="0" />
          <stop offset="50%" stopColor="#7ec4ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1e5faa" stopOpacity="0" />
        </linearGradient>
        <filter id="waveGlow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="2"
        filter="url(#waveGlow)"
      />
      <circle r="4" fill="#bfe1ff" filter="url(#waveGlow)">
        <animateMotion dur="9s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
};
