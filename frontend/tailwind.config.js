/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}", "./src/routes/**/*.{js,ts,jsx,tsx}"],
  daiseyui: {
    themes: [
      {
        mytheme: {
          "primary": "#0094ff",
          "secondary": "#00ecff",
          "accent": "#00a3e1",
          "neutral": "#374151",
          "base-100": "#1d282f",
          "info": "#00a7db",
          "success": "#009600",
          "warning": "#ffb12b",
          "error": "#ff9f9c",
        },
      }
    ]
  },
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}

