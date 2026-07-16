/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0B0F19",
          panel: "#12172A",
          raised: "#171D33",
          line: "#232B45",
        },
        neon: {
          green: "#39FF88",
          greendim: "#1E7A4B",
        },
        electric: {
          purple: "#A855F7",
          violet: "#7C3AED",
        },
        pulse: {
          pink: "#FF3DA1",
          amber: "#FFB84C",
        },
        ink: {
          hi: "#EDF1FB",
          mid: "#9AA3BF",
          low: "#5B6284",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-green": "0 0 12px rgba(57, 255, 136, 0.55), 0 0 40px rgba(57, 255, 136, 0.15)",
        "glow-purple": "0 0 12px rgba(168, 85, 247, 0.55), 0 0 40px rgba(168, 85, 247, 0.18)",
        "glow-pink": "0 0 10px rgba(255, 61, 161, 0.5), 0 0 30px rgba(255, 61, 161, 0.15)",
        "glow-soft": "0 8px 30px rgba(0, 0, 0, 0.45)",
        "inset-line": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 20% 10%, rgba(168,85,247,0.10), transparent 40%), radial-gradient(circle at 80% 0%, rgba(57,255,136,0.08), transparent 35%)",
        "panel-gradient": "linear-gradient(180deg, #151B33 0%, #0F1424 100%)",
      },
      animation: {
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-up": "float-up 2.6s ease-out forwards",
        "waveform-scan": "waveform-scan 6s linear infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "70%": { transform: "scale(1.7)", opacity: "0" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { transform: "translateY(-70px)", opacity: "0" },
        },
        "waveform-scan": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
