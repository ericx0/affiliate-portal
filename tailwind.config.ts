import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#fef3c7", 500: "#1F3A5F", 600: "#16294A" },
      },
    },
  },
  plugins: [],
};
export default config;
