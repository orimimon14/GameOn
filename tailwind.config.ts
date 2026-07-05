import type { Config } from "tailwindcss";

// Canonical design tokens — docs/design/DESIGN_SYSTEM.md §13 (ADR-009).
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: {
          DEFAULT: "#1E293B",
          elevated: "#273449",
          input: "rgba(15,23,42,0.72)",
          glass: "rgba(30,41,59,0.72)",
          overlay: "rgba(15,23,42,0.82)",
        },
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        premium: {
          DEFAULT: "#F59E0B",
          foreground: "#0F172A",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#052E24",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "rgba(255,255,255,0.10)",
        text: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          subtle: "#64748B",
          inverse: "#0F172A",
          premium: "#FCD34D",
          success: "#6EE7B7",
          danger: "#FCA5A5",
        },
      },
      fontFamily: {
        sans: [
          "Rubik",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["Rubik", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        hero: "40px",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.28)",
        elevated: "0 24px 80px rgba(0,0,0,0.38)",
        "glow-primary": "0 0 32px rgba(99,102,241,0.42)",
        "glow-premium": "0 0 36px rgba(245,158,11,0.38)",
        "glow-success": "0 0 32px rgba(16,185,129,0.34)",
        "glow-danger": "0 0 32px rgba(239,68,68,0.32)",
        "inner-glass": "inset 0 1px 0 rgba(255,255,255,0.10)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pop: "pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        match: "match-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pan: {
          "0%": { transform: "scale(1.1) translateX(-2%) translateY(-2%)" },
          "50%": { transform: "scale(1.2) translateX(2%) translateY(2%)" },
          "100%": { transform: "scale(1.1) translateX(-2%) translateY(-2%)" },
        },
        "match-pop": {
          "0%": { transform: "scale(0.5) rotate(-10deg)", opacity: "0" },
          "70%": { transform: "scale(1.1) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
