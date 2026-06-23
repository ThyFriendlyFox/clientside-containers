import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nv: {
          green: "#76b900",
          greenDark: "#5c9200",
        },
        ink: {
          950: "#0a0d0a",
          900: "#0e1310",
          850: "#121814",
          800: "#161d18",
          700: "#1d261f",
          600: "#283328",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
