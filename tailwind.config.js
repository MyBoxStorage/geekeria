/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Kimi design tokens (aditivos) */
        void: 'var(--void)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        overlay: 'var(--overlay)',
        rim: 'var(--rim)',
        fire: {
          DEFAULT: 'var(--fire)',
          bright: 'var(--fire-bright)',
          glow: 'var(--fire-glow)',
        },
        cosmos: {
          DEFAULT: 'var(--cosmos)',
          bright: 'var(--cosmos-bright)',
          glow: 'var(--cosmos-glow)',
        },
        plasma: 'var(--plasma)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        heading: ['Rajdhani', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        ui: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        none: '0px',
        full: '9999px',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        fire: 'var(--shadow-fire)',
        cosmos: 'var(--shadow-cosmos)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      fontSize: {
        hero: 'clamp(3.5rem, 8vw, 6rem)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px var(--fire-glow)' },
          '50%': { boxShadow: '0 0 20px var(--fire-glow), 0 0 40px var(--fire-glow)' },
        },
        glitch: {
          '0%': { clipPath: 'inset(0 0 98% 0)', transform: 'translate(-2px, 0)' },
          '10%': { clipPath: 'inset(50% 0 30% 0)', transform: 'translate(2px, 0)' },
          '20%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(-1px, 0)' },
          '30%, 100%': { clipPath: 'inset(0 0 0 0)', transform: 'translate(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        glitch: 'glitch 4s step-end infinite',
        scanline: 'scanline 8s linear infinite',
        marquee: 'marquee 20s linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
