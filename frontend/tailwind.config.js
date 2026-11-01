/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                whatsapp: {
                    teal: '#008069',
                    lightTeal: '#25D366', // The classic vibrant green
                    bg: '#f0f2f5', // App background
                    darkBg: '#ffffff', // Instead of dark, it's white for panels
                    panel: '#ffffff', // Headers
                    chatBg: '#efeae2', // Chat wallpaper background
                    messageIn: '#ffffff',
                    messageOut: '#d9fdd3',
                    border: '#e9edef', // Light gray borders
                    searchBg: '#f0f2f5',
                    textPrimary: '#111b21', // Dark text
                    textSecondary: '#667781', // Gray text
                    voiceActive: '#25D366',
                    leftRail: '#f0f2f5', // Leftmost icon bar
                }
            }
        },
    },
    darkMode: 'class', // enable manual dark mode 
    plugins: [],
}
