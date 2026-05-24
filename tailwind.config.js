/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        // Subtle elevation for resting cards — keeps the visual lightness of
        // the original flat design but adds depth so the page no longer
        // reads as "wireframe".
        card: '0 1px 2px rgba(120,113,108,0.06), 0 2px 6px rgba(120,113,108,0.05)',
        // Lift on hover/active for interactive cards.
        'card-hover': '0 2px 4px rgba(120,113,108,0.08), 0 8px 20px rgba(120,113,108,0.10)',
        // Dropped only on the modal sheet over the backdrop.
        modal: '0 -8px 24px rgba(0,0,0,0.10), 0 20px 60px rgba(0,0,0,0.22)',
      },
      animation: {
        'fade-in': 'fadein 120ms ease-out',
      },
      keyframes: {
        fadein: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
};
