/**
 * SVG crystal icon — pentagon crystal shape (Vexels-inspired).
 * Faceted gem with 3 visible faces + internal detail lines + specular highlights.
 * Remapped from original purple/pink gradients to Memory Crystal brand blues.
 *
 * Pentagon vertices (1200x1200 space):
 *   Top(600,77)  UL(50,477)  LL(260,1123)  LR(940,1123)  UR(1150,477)
 *
 * Use size prop for pixel dimensions. Defaults to 24x24.
 * Set glow={true} for the neon drop-shadow variant.
 */

import { useId } from "react";

export default function CrystalIcon({
  size = 24,
  glow = false,
  className = "",
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  const baseId = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1200 1200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={glow ? { filter: "drop-shadow(0 0 8px rgba(33,128,214,0.6))" } : undefined}
    >
      <defs>
        {/* Base gradient — full width, light blue → dark blue */}
        <linearGradient
          id={`${baseId}-mc-base`}
          gradientUnits="userSpaceOnUse"
          x1="50"
          x2="1150"
          y1="600"
          y2="600"
        >
          <stop offset="0.03" stopColor="#97F0F7" />
          <stop offset="0.45" stopColor="#4CC1E9" />
          <stop offset="1" stopColor="#1E6DBB" />
        </linearGradient>
        {/* Left face gradient — ice blue → crystal blue */}
        <linearGradient
          id={`${baseId}-mc-left`}
          gradientUnits="userSpaceOnUse"
          x1="50"
          x2="600"
          y1="600"
          y2="600"
        >
          <stop offset="0.03" stopColor="#4CC1E9" />
          <stop offset="1" stopColor="#2180D6" />
        </linearGradient>
        {/* Right face gradient — crystal blue → medium navy */}
        <linearGradient
          id={`${baseId}-mc-right`}
          gradientUnits="userSpaceOnUse"
          x1="600"
          x2="1150"
          y1="600"
          y2="600"
        >
          <stop offset="0.03" stopColor="#2180D6" />
          <stop offset="1" stopColor="#1C549F" />
        </linearGradient>
      </defs>

      {/* === 3 MAIN FACES === */}

      {/* Full pentagon base */}
      <path
        d="M600 76.919 L50 476.517 L260.081 1123.081 L939.919 1123.081 L1150 476.517 Z"
        fill={`url(#${baseId}-mc-base)`}
      />
      {/* Left face — top → upper-left → lower-left */}
      <path
        d="M600 76.919 L50 476.517 L260.081 1123.081 Z"
        fill={`url(#${baseId}-mc-left)`}
      />
      {/* Right face — top → lower-right → upper-right */}
      <path
        d="M600 76.919 L939.919 1123.081 L1150 476.517 Z"
        fill={`url(#${baseId}-mc-right)`}
      />
    </svg>
  );
}
