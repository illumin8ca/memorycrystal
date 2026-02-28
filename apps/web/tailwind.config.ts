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
        void: "#090909",
        surface: "#141414",
        elevated: "#1e1e1e",
        accent: "#0066ff",
        "accent-dim": "#0044cc",
        border: "#2a2a2a",
        primary: "#f0f0f0",
        secondary: "#888888",
      },
    },
  },
  plugins: [],
};

export default config;
