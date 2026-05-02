import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep, warm forest green — organic premium
        brand: {
          DEFAULT: "#2f6d4e",
          dark: "#1f4a36",
          deep: "#143427",
          light: "#e8f2ec",
          soft: "#f3f8f5",
          ring: "rgba(47,109,78,0.18)",
        },
        // Warm off-white background
        cream: {
          DEFAULT: "#faf7f0",
          deep: "#f4efe4",
        },
        // Text colors
        ink: {
          DEFAULT: "#141b1f",
          soft: "#3a4549",
          mute: "#6b757a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },
      letterSpacing: {
        "tight-display": "-0.022em",
        "tighter-display": "-0.03em",
      },
      borderRadius: {
        "4xl": "1.75rem",
        "5xl": "2.25rem",
      },
      boxShadow: {
        // Premium, low-contrast layered elevations
        soft: "0 1px 2px rgba(20,27,31,0.04), 0 4px 14px rgba(20,27,31,0.06)",
        elevated:
          "0 1px 2px rgba(20,27,31,0.05), 0 8px 22px rgba(20,27,31,0.08)",
        floating:
            "0 2px 4px rgba(20,27,31,0.05), 0 18px 40px rgba(20,27,31,0.12)",
        ring: "0 0 0 1px rgba(20,27,31,0.06)",
        "ring-brand": "0 0 0 1px rgba(47,109,78,0.30)",
        "inner-soft": "inset 0 0 0 1px rgba(20,27,31,0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "soft-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 350ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
