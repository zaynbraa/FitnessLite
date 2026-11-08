/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./src/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "#F2F2F7",
          card: "#FFFFFF",
          text: "#000000",
          secondary: "#8E8E93",
          separator: "rgba(60, 60, 67, 0.12)",
          border: "rgba(0, 0, 0, 0.04)",
          red: "#FF2D55",
          orange: "#FF9500",
          blue: "#007AFF",
          cyan: "#32ADE6",
          green: "#34C759",
        },
      },
    },
  },
  plugins: [],
};
