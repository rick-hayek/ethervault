/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./feature/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                surface: "rgb(var(--surface) / <alpha-value>)",
                "surface-card": "rgb(var(--surface-card) / <alpha-value>)",
                primary: {
                    50: "rgb(var(--primary-50) / <alpha-value>)",
                    100: "rgb(var(--primary-100) / <alpha-value>)",
                    200: "rgb(var(--primary-200) / <alpha-value>)",
                    300: "rgb(var(--primary-300) / <alpha-value>)",
                    400: "rgb(var(--primary-400) / <alpha-value>)",
                    500: "rgb(var(--primary-500) / <alpha-value>)",
                    600: "rgb(var(--primary-600) / <alpha-value>)",
                    700: "rgb(var(--primary-700) / <alpha-value>)",
                    800: "rgb(var(--primary-800) / <alpha-value>)",
                    900: "rgb(var(--primary-900) / <alpha-value>)",
                }
            },
            borderRadius: {
                'theme': 'var(--radius-base)',
                'theme-lg': 'var(--radius-lg)',
                'theme-full': 'var(--radius-full)',
            },
            fontFamily: {
                'theme': 'var(--font-family)',
            },
            boxShadow: {
                'theme': '0 4px 24px var(--shadow-color)',
                'theme-lg': '0 12px 40px var(--shadow-color)',
            },
        },
    },
    plugins: [],
}
