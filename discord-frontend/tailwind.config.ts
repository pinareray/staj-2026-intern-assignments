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
        "primary-container": "#ad2831",
        "surface-container-lowest": "#0f0e0a",
        "surface": "#14140f",
        "background": "#14140f",
        "surface-container-highest": "#36352f",
        "outline-variant": "#594140",
        "surface-container-high": "#2b2a24",
        "on-surface": "#e6e2d9",
        "on-surface-variant": "#e1bfbd",
        "secondary-container": "#8f1b1c",
        "surface-container": "#20201a",
        "surface-container-low": "#1c1c16",
        "on-background": "#e6e2d9",
        "primary": "#ffb3b0",
        "outline": "#a88988",
        "on-primary": "#e6e2d9",
        "on-primary-fixed-variant": "#ffb3b0",
        // Crimson Library arkaplan renkleri
        "mahogany-dark": "#250902",
        "mahogany-red": "#38040e",
        "black-cherry": "#640d14",
        "dark-wine": "#800e13",
      },
      fontFamily: {
        "libre": ["'Libre Caslon Text'", "serif"],
        "hanken": ["'Hanken Grotesk'", "sans-serif"],
      },
      spacing: {
        "xs": "4px",
        "sm": "12px",
        "md": "24px",
        "lg": "48px",
        "xl": "80px",
      },
      maxWidth: {
        // Özel spacing token'ları max-w-md gibi sınıfları ezmesin diye
        "md": "28rem",
        "lg": "32rem",
        "xl": "36rem",
      },
    },
  },
  plugins: [],
};
export default config;
