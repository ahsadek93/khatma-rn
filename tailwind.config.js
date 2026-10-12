/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["Cairo_400Regular"],
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        "secondary-foreground": "var(--color-secondary-foreground)",
        primary: "var(--color-primary)",
      },
    },
  },
  plugins: [],
};
