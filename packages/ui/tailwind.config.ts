import type { Config } from "tailwindcss";
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms(),
  ],
} satisfies Config;
