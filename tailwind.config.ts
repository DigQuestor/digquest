import type { Config } from 'tailwindcss';

const config: Config = {
  // These are all the paths Tailwind should scan for class names
  content: [
    './client/src/**/*.{html,js,ts,jsx,tsx}', // your main source files
    './client/index.html',                    // your root HTML file
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(45,25%,95%)',
        foreground: 'hsl(33,45%,15%)',
        muted: 'hsl(45,20%,90%)',
        'muted-foreground': 'hsl(33,30%,40%)',
        popover: 'hsl(45,25%,95%)',
        'popover-foreground': 'hsl(33,45%,15%)',
        card: 'hsl(45,25%,95%)',
        'card-foreground': 'hsl(33,45%,15%)',
        border: 'hsl(45,15%,85%)',
        input: 'hsl(45,15%,85%)',
        primary: 'hsl(142,69%,23%)',
        'primary-foreground': 'hsl(45,25%,95%)',
        secondary: 'hsl(43,84%,55%)',
        'secondary-foreground': 'hsl(33,45%,15%)',
        accent: 'hsl(25,60%,45%)',
        'accent-foreground': 'hsl(45,25%,95%)',
        destructive: 'hsl(18,90%,58%)',
        'destructive-foreground': 'hsl(45,25%,95%)',
        ring: 'hsl(142,69%,23%)',
        'earth-brown': 'hsl(33,45%,28%)',
        'forest-green': 'hsl(142,69%,23%)',
        'metallic-gold': 'hsl(43,84%,55%)',
        'sand-beige': 'hsl(45,25%,95%)',
        'rust-orange': 'hsl(18,90%,58%)',
        'copper-bronze': 'hsl(25,60%,45%)',
        success: 'hsl(122,39%,49%)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      // Add any custom gradients or keyframes if needed
      backgroundImage: {
        'treasure-gradient': 'linear-gradient(135deg, hsl(43,84%,55%) 0%, hsl(25,60%,45%) 100%)',
        'earth-gradient': 'linear-gradient(135deg, hsl(33,45%,28%) 0%, hsl(142,69%,23%) 100%)',
        'sand-gradient': 'linear-gradient(135deg, hsl(45,25%,95%) 0%, hsl(45,30%,92%) 100%)',
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        cursive: ['Cabin Sketch', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
