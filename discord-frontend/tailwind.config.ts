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
        // micodex light theme + crimson accent
        "primary-container": "#ad2831",
        "surface-container-lowest": "#ffffff",
        "surface": "#ffffff",
        "background": "#f7f4ef",
        "surface-container-highest": "#e7e2da",
        "outline-variant": "#d6d3d1",
        "surface-container-high": "#ede9e3",
        "on-surface": "#1c1917",
        "on-surface-variant": "#78716c",
        "secondary-container": "#8f1b1c",
        "surface-container": "#f3efe8",
        "surface-container-low": "#f5f5f4",
        "on-background": "#1c1917",
        "primary": "#ad2831",
        "outline": "#a8a29e",
        "on-primary": "#ffffff",
        "on-primary-fixed-variant": "#8f1b1c",
        // Layout eşlemeleri (eski sınıf adları → light)
        "mahogany-dark": "#efeae3",
        "mahogany-red": "#ffffff",
        "black-cherry": "#f3efe8",
        "dark-wine": "#e7e2da",
      },
      fontFamily: {
        "libre": ["'Libre Caslon Text'", "serif"],
        "hanken": ["'Hanken Grotesk'", "sans-serif"],
      },
      spacing: {
        "space-xs": "4px",
        "space-sm": "12px",
        "space-md": "24px",
        "space-lg": "48px",
        "space-xl": "80px",
      },
      maxWidth: {
        "content-md": "28rem",
        "content-lg": "32rem",
        "content-xl": "36rem",
      },
    },
  },
  plugins: [],
};
export default config;
