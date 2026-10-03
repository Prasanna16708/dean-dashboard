import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'smoke-white': '#F5F5F7',
        'border-light': 'rgba(0, 0, 0, 0.1)',
        'border-dark': 'rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
};
export default config;