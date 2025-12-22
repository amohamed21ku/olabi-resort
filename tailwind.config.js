/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Luxury Ocean & Nature Theme
        'resort': {
          // Deep Ocean Blues - Primary brand color
          'ocean': {
            50: '#e6f4f8',
            100: '#b3dde8',
            200: '#80c6d8',
            300: '#4dafc8',
            400: '#2699b8',
            500: '#1E5F74', // Primary - Deep teal
            600: '#194f60',
            700: '#143f4c',
            800: '#0f2f38',
            900: '#0a1f24',
          },
          // Luxury Gold Accents
          'gold': {
            50: '#fefbeb',
            100: '#fdf3c7',
            200: '#fbe68f',
            300: '#f8d24d',
            400: '#f5c116',
            500: '#D4AF37', // Primary gold
            600: '#b8962e',
            700: '#9a7c26',
            800: '#7c631e',
            900: '#5e4a16',
          },
          // Natural Greens - Nature connection
          'nature': {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#2D6A4F', // Primary nature green
            600: '#276245',
            700: '#215a3c',
            800: '#1b4f33',
            900: '#15452a',
          },
          // Warm Neutrals
          'cream': {
            50: '#FEFCF8',
            100: '#FDF6E3',
            200: '#F5F0DC',
            300: '#EDE4C8',
            400: '#E5D8B4',
            500: '#DCC9A0',
          },
          // Rich Charcoal for text
          'charcoal': {
            50: '#f4f6f7',
            100: '#e3e8eb',
            200: '#c9d2d8',
            300: '#a3b3bd',
            400: '#758d9b',
            500: '#5a7280',
            600: '#4d616d',
            700: '#42515b',
            800: '#3a454d',
            900: '#36454F', // Primary charcoal
          },
        },
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'luxury': ['Cormorant Garamond', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #1E5F74 0%, #5D9CAD 35%, #D4AF37 65%, #B8860B 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0F4C5C 0%, #1E5F74 50%, #2D8A9D 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F5C116 0%, #D4AF37 50%, #B8860B 100%)',
        'gradient-nature': 'linear-gradient(135deg, #40916C 0%, #2D6A4F 50%, #1B4332 100%)',
        'gradient-teal': 'linear-gradient(135deg, #1E5F74 0%, #2D8A9D 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #FEFCF8 0%, rgba(30, 95, 116, 0.05) 50%, #FEFCF8 100%)',
      },
      boxShadow: {
        'luxury': '0 25px 80px rgba(30, 95, 116, 0.15), 0 10px 30px rgba(212, 175, 55, 0.1)',
        'gold': '0 10px 40px rgba(212, 175, 55, 0.3)',
        'ocean': '0 10px 40px rgba(30, 95, 116, 0.3)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
