/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e", /* لون طبي مريح - تيل غامق */
        secondary: "#0d9488",
      },
    },
  },
  plugins: [],
}
