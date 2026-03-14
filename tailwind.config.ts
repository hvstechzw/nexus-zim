import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Nexus-specific palette
        "nexus-slate": "hsl(222 47% 11%)",
        "nexus-silver": "hsl(210 14% 89%)",
        "nexus-muted": "hsl(215 20% 46%)",
        "nexus-surface": "hsl(210 40% 96%)",
        "nexus-live": "hsl(0 84% 60%)",
      },
      borderRadius: {
        // Sharp — Swiss watch aesthetic
        lg: "0px",
        md: "0px",
        sm: "0px",
        DEFAULT: "0px",
        xl: "2px",   // Only for micro internal pill badges
      },
      fontFamily: {
        display: ["Instrument Sans", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "score-lg": ["clamp(3rem, 8vw, 7rem)", { lineHeight: "1", letterSpacing: "-0.05em" }],
        "score-md": ["clamp(1.5rem, 4vw, 2.5rem)", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-xl": ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(1.75rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
      },
      spacing: {
        "section": "12vh",
        "px-05": "0.5px",
      },
      borderWidth: {
        "05": "0.5px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "score-flip": {
          "0%":   { transform: "rotateX(0deg)", opacity: "1" },
          "50%":  { transform: "rotateX(90deg)", opacity: "0" },
          "51%":  { transform: "rotateX(-90deg)", opacity: "0" },
          "100%": { transform: "rotateX(0deg)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "score-flip": "score-flip 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionTimingFunction: {
        precision: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        state: "200ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
