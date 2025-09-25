/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: {
            1: '#7156A5',
            2: '#663191',
          },
          orange: {
            1: '#FBAD1B',
            2: '#F26826',
          }
        }
      }
    },
  },
  plugins: [],
};


