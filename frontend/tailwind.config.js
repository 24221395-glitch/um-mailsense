/** Colours and fonts must match design/README.md (Wendi). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#132360", light: "#24398a" },
        gold: { DEFAULT: "#d99a00", soft: "#fff3d1" },
      },
    },
  },
  plugins: [],
};
