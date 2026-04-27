import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Deep, warm forest green — feels organic and premium
        brand: {
          DEFAULT: "#2f6d4e",
          dark: "#1f4a36",
          light: "#e8f2ec"
        },
        // Warm off-white for the page background
        cream: "#faf7f0",
        // Main text color
        ink: "#141b1f"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif"
        ]
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
