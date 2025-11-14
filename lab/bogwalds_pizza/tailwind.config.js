/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#f425f4",
                "background-light": "#f8f5f8",
                "background-dark": "#0A020A",
            },
            fontFamily: {
                display: ["Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "2rem",
                xl: "3rem",
                full: "9999px",
            },
            animation: {
                "color-shift": "color-shift 5s linear infinite",
            },
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false, // Disable preflight to avoid conflicts with Digdir's design system.
    }
};