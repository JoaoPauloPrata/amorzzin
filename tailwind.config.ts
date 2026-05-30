import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        rose: {
          DEFAULT: "#FF4E88",
          50: "#FFF1F5",
          100: "#FFE4ED",
          200: "#FFC7DA",
          300: "#FF9DBE",
          400: "#FF6FA0",
          500: "#FF4E88",
          600: "#E83574",
          700: "#C42463",
          800: "#9E1A52",
          900: "#7A1240",
        },
        lilac: {
          DEFAULT: "#A26BE8",
          50: "#F6F0FE",
          100: "#EBDEFC",
          200: "#D6BDF9",
          300: "#C19BF5",
          400: "#A26BE8",
          500: "#8A4FD8",
          600: "#7138BD",
          700: "#5A2A99",
          800: "#451F76",
          900: "#311756",
        },
        cream: "#FFF6F0",
        ink: "#1A1325",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 32px -8px rgba(255, 78, 136, 0.25)",
        glow: "0 0 40px -10px rgba(162, 107, 232, 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms ease-out both",
        "float-y": "float-y 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
