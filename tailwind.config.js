module.exports = {
    content: ['./index.html', './**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',
                highlight: 'var(--color-highlight)',
                'text-main': 'var(--color-text-main)',
                'text-secondary': 'var(--color-text-secondary)',
                'border-color': 'var(--color-border-color)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
                serif: ['var(--font-serif)', 'Georgia', 'serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'fade-out': 'fadeOut 0.2s ease-in forwards',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-highlight': 'pulse-highlight 2s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'pulse-highlight': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' },
                    '50%': { boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.4)' },
                },
            },
        },
    },
    plugins: [],
};
