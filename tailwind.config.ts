import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ============================================
        // UUI Semantic Colors (mapped to CSS variables)
        // ============================================
        
        // Background semantic tokens
        bg: {
          primary: 'var(--bg-primary)',
          'primary-alt': 'var(--bg-primary_alt)',
          'primary-hover': 'var(--bg-primary_hover)',
          secondary: 'var(--bg-secondary)',
          'secondary-alt': 'var(--bg-secondary_alt)',
          'secondary-hover': 'var(--bg-secondary_hover)',
          tertiary: 'var(--bg-tertiary)',
          quaternary: 'var(--bg-quaternary)',
          active: 'var(--bg-active)',
          disabled: 'var(--bg-disabled)',
          overlay: 'var(--bg-overlay)',
        },
        
        // Foreground/text semantic tokens
        fg: {
          primary: 'var(--fg-primary)',
          secondary: 'var(--fg-secondary)',
          'secondary-hover': 'var(--fg-secondary_hover)',
          tertiary: 'var(--fg-tertiary)',
          quaternary: 'var(--fg-quaternary)',
          quinary: 'var(--fg-quinary)',
          disabled: 'var(--fg-disabled)',
          placeholder: 'var(--fg-placeholder)',
          white: 'var(--fg-white)',
          'brand-primary': 'var(--fg-brand-primary)',
          'brand-secondary': 'var(--fg-brand-secondary)',
          'error-primary': 'var(--fg-error-primary)',
          'warning-primary': 'var(--fg-warning-primary)',
          'success-primary': 'var(--fg-success-primary)',
        },
        
        // Border semantic tokens
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          tertiary: 'var(--border-tertiary)',
          disabled: 'var(--border-disabled)',
          brand: 'var(--border-brand)',
          'brand-solid': 'var(--border-brand-solid)',
          error: 'var(--border-error)',
          warning: 'var(--border-warning)',
          success: 'var(--border-success)',
        },
        
        // Button semantic tokens
        button: {
          'primary-fg': 'var(--button-primary-fg)',
          'primary-bg': 'var(--button-primary-bg)',
          'primary-bg-hover': 'var(--button-primary-bg_hover)',
          'primary-icon': 'var(--button-primary-icon)',
          'primary-icon_hover': 'var(--button-primary-icon_hover)',
          'secondary-fg': 'var(--button-secondary-fg)',
          'secondary-bg': 'var(--button-secondary-bg)',
          'secondary-border': 'var(--button-secondary-border)',
          'tertiary-fg': 'var(--button-tertiary-fg)',
          'destructive-primary-icon': 'var(--button-destructive-primary-icon)',
          'destructive-primary-icon_hover': 'var(--button-destructive-primary-icon_hover)',
        },
        
        // UUI Component utility colors
        'brand-solid': 'var(--bg-brand-solid)',
        'brand-solid_hover': 'var(--bg-brand-solid_hover)',
        'error-solid': 'var(--bg-error-solid)',
        'error-solid_hover': 'var(--bg-error-solid_hover)',
        'disabled': 'var(--bg-disabled)',
        'disabled_subtle': 'var(--bg-disabled_subtle)',
        'primary': 'var(--bg-primary)',
        'primary_hover': 'var(--bg-primary_hover)',
        'secondary': 'var(--fg-secondary)',
        'secondary_hover': 'var(--fg-secondary_hover)',
        'bg-secondary-hover': 'var(--bg-secondary_hover)',
        'tertiary': 'var(--fg-tertiary)',
        'tertiary_hover': 'var(--fg-tertiary_hover)',
        'quaternary': 'var(--fg-quaternary)',
        'quaternary_hover': 'var(--fg-quaternary_hover)',
        'brand-secondary': 'var(--fg-brand-secondary)',
        'brand-secondary_hover': 'var(--fg-brand-primary)',
        'error-primary': 'var(--bg-error-primary)',
        'error-primary_hover': 'var(--fg-error-primary)',
        
        // Brand background variants
        'bg-brand': {
          primary: 'var(--bg-brand-primary)',
          'primary-alt': 'var(--bg-brand-primary_alt)',
          secondary: 'var(--bg-brand-secondary)',
          solid: 'var(--bg-brand-solid)',
          'solid-hover': 'var(--bg-brand-solid_hover)',
        },
        
        // Error/Warning/Success backgrounds
        'bg-error': {
          primary: 'var(--bg-error-primary)',
          secondary: 'var(--bg-error-secondary)',
          solid: 'var(--bg-error-solid)',
        },
        'bg-warning': {
          primary: 'var(--bg-warning-primary)',
          secondary: 'var(--bg-warning-secondary)',
          solid: 'var(--bg-warning-solid)',
        },
        'bg-success': {
          primary: 'var(--bg-success-primary)',
          secondary: 'var(--bg-success-secondary)',
          solid: 'var(--bg-success-solid)',
        },
        
        // ============================================
        // Primitive Color Scales (direct values)
        // ============================================
        brand: {
          25: 'var(--color-brand-25)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
          // Named aliases
          charcoal: '#191919',
          vanilla: '#FFFAEE',
          aperol: '#FE5102',
        },
        
        gray: {
          25: 'var(--color-gray-25)',
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
          950: 'var(--color-gray-950)',
        },
        
        error: {
          25: 'var(--color-error-25)',
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          950: 'var(--color-error-950)',
        },
        
        warning: {
          25: 'var(--color-warning-25)',
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          950: 'var(--color-warning-950)',
        },
        
        success: {
          25: 'var(--color-success-25)',
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          950: 'var(--color-success-950)',
        },
        
        // ============================================
        // Legacy OS tokens (keep during migration)
        // ============================================
        os: {
          'bg-darker': '#0C0C0C',
          'bg-dark': '#141414',
          'surface-dark': '#1C1C1C',
          'border-dark': '#2C2C2C',
          'text-primary-dark': '#E8E8E8',
          'text-secondary-dark': '#9CA3AF',
        },
      },
      
      // Box shadow semantic tokens
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        '3xl': 'var(--shadow-3xl)',
        // Legacy
        'brand': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'brand-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      
      // Ring colors for focus states
      ringColor: {
        brand: 'var(--focus-ring)',
        error: 'var(--focus-ring-error)',
        primary: 'var(--ring-primary)',
        'disabled_subtle': 'var(--ring-disabled_subtle)',
        'error_subtle': 'var(--ring-error_subtle)',
      },
      
      /**
       * Typography - Custom Font Override for Untitled UI
       */
      fontFamily: {
        sans: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        display: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
        accent: ['Offbit', 'ui-monospace', 'monospace'],
      },
      
      borderRadius: {
        'brand': '12px',
        'brand-lg': '16px',
      },
      
      animation: {
        blob: 'blob 10s infinite',
        cursor: 'cursor .75s step-end infinite',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
        'dot-wave': 'dot-wave 0.6s ease-in-out infinite',
      },
      
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        cursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(0.8)', opacity: '0.4' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        'dot-wave': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-4px) scale(1.1)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-react-aria-components'),
    require('tailwindcss-animate'),
  ],
} satisfies Config;
