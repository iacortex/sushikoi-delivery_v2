/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        koi: { red:"#C00000", black:"#0A0A0A", white:"#FFFFFF", gray:"#E0E0E0" },
      },
      backgroundImage: {
        // Base elegante: negro -> glow rojo abajo (una sola capa)
        "koi-hero":
          "radial-gradient(90% 60% at 50% 100%, rgba(192,0,0,0.42) 0%, rgba(192,0,0,0.10) 55%, rgba(192,0,0,0) 70%), linear-gradient(180deg, #121212 0%, #0E0E0E 45%, #0A0A0A 100%)",
      },
      keyframes: {
        "koi-float": {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%":     { transform: "translateY(-14px) rotate(2deg)" },
        },
        "petal-drift": {
          "0%":   { transform: "translateY(-10%) translateX(0) rotate(0deg)", opacity: 0 },
          "10%":  { opacity: .25 },
          "50%":  { transform: "translateY(55vh) translateX(12px) rotate(12deg)", opacity: .25 },
          "100%": { transform: "translateY(110vh) translateX(0) rotate(22deg)", opacity: 0 },
        },
      },
      animation: {
        "koi-float-slow": "koi-float 8s ease-in-out infinite",
        "petal-drift": "petal-drift 18s linear infinite",
      },
      boxShadow: {
        "koi-1": "0 8px 24px -12px rgba(0,0,0,.45)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
