export function BoltIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2C87E" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      <path
        d="M16.5 1L3 18H12.5L10.5 31L25 13H15L16.5 1Z"
        fill="url(#boltGrad)"
        stroke="#B8972F"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function BoltIconSolid({ size = 16, color = "#C9A84C" }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5 1L3 18H12.5L10.5 31L25 13H15L16.5 1Z"
        fill={color}
      />
    </svg>
  );
}
