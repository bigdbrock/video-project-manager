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
        ink: {
          900: "#0b1220",
          700: "#111b2e",
          500: "#4b5563",
          300: "#8a96b0",
        },
        sand: {
          50: "#f6f2ee",
          100: "#f1ebe5",
          200: "#e6ded6",
        },
        ember: {
          500: "#5d78a6",
          600: "#4c6794",
        },
        brand: {
          500: "#5d78a6",
          600: "#4c6794",
        },
      },
      boxShadow: {
        card: "0 18px 45px -30px rgba(11, 18, 32, 0.4)",
      },
      borderRadius: {
        xl: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
