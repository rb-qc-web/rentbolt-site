import { ImageResponse } from "next/og";

// iOS home-screen icon. Safari ignores SVG favicons for "Add to Home Screen",
// so this renders the same mark as a PNG at the size Apple asks for.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1F5C",
        }}
      >
        {/* Inline SVG rather than a font glyph: ImageResponse ships no fonts by
            default, and a missing font renders as blank boxes. */}
        <svg width="110" height="126" viewBox="0 0 28 32" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E2C87E" />
              <stop offset="100%" stopColor="#C9A84C" />
            </linearGradient>
          </defs>
          <path
            d="M16.5 1L3 18H12.5L10.5 31L25 13H15L16.5 1Z"
            fill="url(#g)"
            stroke="#B8972F"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size
  );
}
