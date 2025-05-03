import { useTheme } from '../context/ThemeContext';

export const useThemeStyles = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return {
        isDark,
        // Text styles
        text: isDark ? 'text-gray-100' : 'text-gray-900',
        textMuted: isDark ? 'text-gray-300' : 'text-gray-600',
        textHeading: isDark ? 'text-white' : 'text-gray-800',

        // Background styles
        bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
        bgCard: isDark ? 'bg-gray-800' : 'bg-white',
        bgInput: isDark ? 'bg-gray-700' : 'bg-white',
        bgHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',

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
        primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondaryButton: isDark ?
            'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' :
            'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
        outlineButton: isDark ?
            'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700' :
            'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
        dangerButton: 'bg-red-600 hover:bg-red-700 text-white',
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
        card: isDark ?
            'rounded-lg shadow p-6 bg-gray-800 text-gray-100 border border-gray-700' :
            'rounded-lg shadow p-6 bg-white text-gray-900 border border-gray-200',
        pageContainer: isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',

        // Modal/dialog styles
        modal: {
            overlay: isDark ? 'bg-black/60' : 'bg-black/40',
            container: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            header: isDark ? 'border-gray-700' : 'border-gray-200',
        },

        // Tab styles
        tabs: {
            inactive: isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900',
            active: isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600',
        },
    };
};

// Helper for conditionally joining classes
export const cx = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
};
