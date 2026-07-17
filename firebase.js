@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
}

body {
  background-color: #0b0f19;
  background-image: radial-gradient(circle at 20% 10%, rgba(168, 85, 247, 0.1), transparent 40%),
    radial-gradient(circle at 80% 0%, rgba(57, 255, 136, 0.08), transparent 35%);
  background-attachment: fixed;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #232b45;
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2f3a5e;
}

/* Focus visibility for accessibility */
:focus-visible {
  outline: 2px solid #39ff88;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Range input theming (device zone sliders, master volume) */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 999px;
  background: #232b45;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #39ff88;
  box-shadow: 0 0 8px rgba(57, 255, 136, 0.7);
  cursor: pointer;
  border: 2px solid #0b0f19;
}
input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #39ff88;
  box-shadow: 0 0 8px rgba(57, 255, 136, 0.7);
  cursor: pointer;
  border: 2px solid #0b0f19;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
