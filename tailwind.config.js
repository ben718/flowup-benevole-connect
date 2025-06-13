/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vs-blue-primary': '#3B82F6',
        'vs-blue-light': '#93C5FD',
        'vs-blue-dark': '#1E40AF',
        'vs-green-secondary': '#10B981',
        'vs-green-light': '#A7F3D0',
        'vs-green-dark': '#047857',
        'vs-orange-accent': '#F59E0B',
        'vs-orange-light': '#FCD34D',
        'vs-orange-dark': '#D97706',
        'vs-gray-100': '#F3F4F6',
        'vs-gray-200': '#E5E7EB',
        'vs-gray-300': '#D1D5DB',
        'vs-gray-400': '#9CA3AF',
        'vs-gray-500': '#6B7280',
        'vs-gray-600': '#4B5563',
        'vs-gray-700': '#374151',
        'vs-gray-800': '#1F2937',
        'vs-gray-900': '#111827',
        'vs-error': '#EF4444',
      },
      // Ajout de personnalisations supplémentaires
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  // Ajout de plugins utiles
  plugins: [],
  // Désactiver les préfixes de compatibilité qui pourraient causer des problèmes
  corePlugins: {
    preflight: true,
  }
}
