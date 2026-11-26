export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" aria-hidden="true">
      <rect x="4" y="3" width="30" height="32" rx="4" fill="#0B6B4F" stroke="#17261F" strokeWidth="2.5" />
      <path d="M10 12h18M10 18h18M10 24h11" stroke="#FBF7EC" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="27" r="5" fill="#F2A33A" stroke="#17261F" strokeWidth="2" />
    </svg>
  );
}
