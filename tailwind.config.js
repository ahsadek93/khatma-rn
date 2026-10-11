/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "dark",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        card: "var(--color-card)",
        "card-foreground": "var(--color-card-foreground)",
        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",
        gold: "var(--color-gold)",
        muted: "var(--color-muted)",
        "muted-foreground": "var(--color-muted-foreground)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
    },
  },
  plugins: [],
};
