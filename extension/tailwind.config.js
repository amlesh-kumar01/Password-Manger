/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4285F4",
        secondary: "#f5f5f5",
        dark: "#333333",
        light: "#ffffff",
        danger: "#f8d7da",
        success: "#d4edda"
      }
    },
  },
  plugins: [],
}
