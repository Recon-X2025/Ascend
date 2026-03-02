import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        /*
         * REQUIRED for UI/shadcn compatibility — do not remove.
         * Components use: text-foreground, bg-background, border-input, ring, ring-offset-background,
         * bg-accent, text-accent-foreground, bg-secondary, muted, primary. Each must exist here.
         */
        /* Ascend design system — use CSS vars */
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-mid": "var(--border-mid)",
        green: "var(--green)",
        "green-dark": "var(--green-dark)",
        "green-light": "var(--green-light)",
        "green-mid": "var(--green-mid)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-4": "var(--ink-4)",
        "ink-5": "var(--ink-5)",
        /* shadcn/UI primitives — must exist for text-foreground, bg-background, etc. */
        background: "var(--bg)",
        foreground: "var(--ink)",
        input: "var(--border)",
        ring: "var(--green)",
        /* Legacy aliases for existing components */
        primary: {
          DEFAULT: "var(--green)",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "var(--green-light)",
          foreground: "var(--ink)",
          green: "var(--green)",
          blue: "#1A56DB",
        },
        "text-primary": "var(--ink)",
        "text-secondary": "var(--ink-3)",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--ink-3)",
        },
        secondary: "var(--surface-2)",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 24px rgba(0, 0, 0, 0.08)",
        "card-active": "0 0 0 2px var(--green)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
