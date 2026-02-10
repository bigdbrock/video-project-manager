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
          900: "#080e1b",
          700: "#0f1a2d",
          500: "#3b465a",
          300: "#7483a1",
        },
        sand: {
          50: "#f7f3ef",
          100: "#efe6de",
          200: "#e4d8cd",
        },
        ember: {
          500: "#3c67b1",
          600: "#2f569a",
        },
        brand: {
          500: "#3c67b1",
          600: "#2f569a",
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
