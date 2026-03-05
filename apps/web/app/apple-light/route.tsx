import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f9ff",
        }}
      >
        <svg width="130" height="130" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="50" x2="1150" y1="600" y2="600">
              <stop offset=".03" stopColor="#79DAF0" />
              <stop offset=".45" stopColor="#37A6D7" />
              <stop offset="1" stopColor="#1E5AA3" />
            </linearGradient>
            <linearGradient id="l" gradientUnits="userSpaceOnUse" x1="50" x2="600" y1="600" y2="600">
              <stop offset=".03" stopColor="#52BFEA" />
              <stop offset="1" stopColor="#1B6BC0" />
            </linearGradient>
            <linearGradient id="r" gradientUnits="userSpaceOnUse" x1="600" x2="1150" y1="600" y2="600">
              <stop offset=".03" stopColor="#2C7FCF" />
              <stop offset="1" stopColor="#163F84" />
            </linearGradient>
          </defs>
          <path d="M600 76.919 L50 476.517 L260.081 1123.081 L939.919 1123.081 L1150 476.517 Z" fill="url(#b)" />
          <path d="M600 76.919 L50 476.517 L260.081 1123.081 Z" fill="url(#l)" />
          <path d="M600 76.919 L939.919 1123.081 L1150 476.517 Z" fill="url(#r)" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
