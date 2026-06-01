/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1F5C",
          light: "#1A3278",
          dark: "#061440",
          50: "#E8EBF3",
          100: "#C5CBE0",
          200: "#8F9BC5",
          900: "#040E2A",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C87E",
          dark: "#A8882E",
          subtle: "#F5EDD4",
          50: "#FBF7EC",
        },
      },
      fontFamily: {
        display: ['"Outfit"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(10,31,92,0.06)",
        "card-hover": "0 8px 32px rgba(10,31,92,0.12)",
        gold: "0 4px 20px rgba(201,168,76,0.25)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
