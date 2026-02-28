import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        full: "9999px",
      },
      colors: {
        void: "#1C272F",
        surface: "#1E2F3D",
        elevated: "#213A4D",
        accent: "#2180D6",
        "accent-dim": "#1C549F",
        "accent-hover": "#4CC1E9",
        "accent-glow": "#97F0F7",
        border: "#1C549F",
        primary: "#E8F0F8",
        secondary: "#7A9AB5",
      },
    },
  },
  plugins: [],
};

export default config;
