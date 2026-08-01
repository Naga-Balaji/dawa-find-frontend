export default function Logo({ size = 32, withText = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Dawa-Find logo"
      >
        {/* Outer teardrop pin */}
        <path
          d="M24 2C13.5 2 5 10.4 5 20.7c0 14.5 19 25.3 19 25.3s19-10.8 19-25.3C43 10.4 34.5 2 24 2z"
          fill="url(#pinGradient)"
        />
        {/* Inner white disc */}
        <circle cx="24" cy="20" r="11" fill="white" />
        {/* Pill capsule inside — one half teal, one half coral */}
        <g transform="translate(24 20) rotate(-35)">
          <rect x="-9" y="-4" width="9" height="8" rx="4" fill="#0f766e" />
          <rect x="0" y="-4" width="9" height="8" rx="4" fill="#f97361" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="white" strokeWidth="1" />
        </g>
        <defs>
          <linearGradient id="pinGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
      </svg>
      {withText && (
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f766e' }}>
          Dawa<span style={{ color: '#f97361' }}>·</span>Find
        </span>
      )}
    </div>
  );
}
