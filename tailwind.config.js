/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        gray: {
          800: '#1f2937',
          900: '#111827',
        }
      },
    }
  },
  plugins: [],
}; 