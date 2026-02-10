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
          900: "#0b0f1f",
          700: "#1b2238",
          500: "#3a425c",
          300: "#7a86a6",
        },
        sand: {
          50: "#f8f4ef",
          100: "#efe7dc",
          200: "#e2d4c1",
        },
        ember: {
          500: "#f46b45",
          600: "#e6542f",
        },
      },
      boxShadow: {
        card: "0 20px 60px -30px rgba(15, 23, 42, 0.45)",
      },
      borderRadius: {
        xl: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
