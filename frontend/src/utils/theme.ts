import { useTheme } from '../context/ThemeContext';

export function useThemeStyles() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return {
        isDark,
        // Text styles
        text: {
            primary: isDark ? 'text-white' : 'text-gray-900',
            secondary: isDark ? 'text-gray-300' : 'text-gray-600',
            muted: isDark ? 'text-gray-400' : 'text-gray-500',
        },
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        textHeading: isDark ? 'text-white' : 'text-gray-800',

        // Background styles
        bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
        bgCard: isDark ? 'bg-gray-800' : 'bg-white',
        bgInput: isDark ? 'bg-gray-700' : 'bg-white',
        bgHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
        bgSecondary: isDark ? 'bg-gray-800' : 'bg-gray-50',

        // Table styles
        table: {
            header: isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700',
            row: isDark ? 'border-gray-700' : 'border-gray-200',
            rowHover: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
            cell: isDark ? 'text-gray-300' : 'text-gray-600',
        },

        // Border styles
        border: isDark ? 'border-gray-700' : 'border-gray-200',
        borderInput: isDark ? 'border-gray-600' : 'border-gray-300',
        borderCard: isDark ? 'border-gray-700' : 'border-gray-200',

        // Hover effects
        hoverBg: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',

        // Form elements
        input: `${isDark ?
            'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' :
            'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600'
            }`,
        select: isDark ?
            'bg-gray-700 border-gray-600 text-gray-100' :
            'bg-white border-gray-300 text-gray-900',
        checkbox: isDark ?
            'bg-gray-700 border-gray-600 text-blue-500' :
            'bg-white border-gray-300 text-blue-600',

        // Status badges
        statusActive: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800',
        statusInactive: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800',

        // Role badges
        roleAdmin: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-800',
        roleTeacher: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800',

        // Button variants
        button: {
            primary: isDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700',
            secondary: isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300',
            danger: isDark ? 'bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700',
        },
        outlineButton: isDark ?
            'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700' :
            'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
        primaryButton: isDark ?
            'bg-blue-600 hover:bg-blue-700 text-white' :
            'bg-blue-500 hover:bg-blue-600 text-white',
        dangerOutlineButton: isDark ?
            'border border-gray-600 text-red-400 hover:bg-gray-700 hover:text-red-300' :
            'border border-gray-300 text-red-600 hover:bg-red-50',

        // Search field
        searchInput: isDark ?
            'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 pl-10' :
            'bg-white border-gray-300 text-gray-900 placeholder-gray-500 pl-10',

        // Filter/dropdown
        filterBg: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',

        // Combines multiple styles for common elements
        card: {
            base: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        },
        pageContainer: isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',

        // Modal/dialog styles
        modal: {
            overlay: isDark ? 'bg-black/60' : 'bg-black/40',
            container: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            header: isDark ? 'border-gray-700' : 'border-gray-200',
        },

        // Tab styles
        tab: {
            default: isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500',
            active: isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600',
        },

        // Editor styles
        reactQuillDark: isDark ? 'react-quill-dark' : '',
        reactQuillDarkSm: isDark ? 'react-quill-dark-sm' : '',

        // Content styling
        prose: isDark ? 'prose-invert' : '',

        bgColor: isDark ? 'bg-gray-800' : 'bg-white',
        textColor: isDark ? 'text-white' : 'text-gray-900',
        borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
    };
}

// Helper for conditionally joining classes
export function cx(...classes: Array<string | boolean | undefined | null>): string {
    return classes.filter(Boolean).join(' ');
}
