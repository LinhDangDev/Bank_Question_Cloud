import { forwardRef } from 'react'
import { cx } from '../../utils/theme'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'text' | 'default' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    startIcon,
    endIcon,
    ...props
  }, ref) => {
    const sizeClasses = {
      xs: 'text-xs px-2 py-1 rounded',
      sm: 'text-sm px-3 py-1.5 rounded',
      md: 'text-base px-4 py-2 rounded-lg',
      lg: 'text-lg px-5 py-2.5 rounded-lg',
    }

    const baseStyles = 'font-medium inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'

    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      destructive: 'bg-red-600 hover:bg-red-700 text-white',
      text: 'text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300',
      default: 'bg-blue-600 hover:bg-blue-700 text-white', // Same as primary for compatibility
      ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-200',
      link: 'text-blue-600 hover:underline dark:text-blue-400 hover:text-blue-700'
    }

    const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none'

    return (
      <button
        className={cx(
          baseStyles,
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          (disabled || loading) && disabledClasses,
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!loading && startIcon && <span className="mr-2">{startIcon}</span>}
        {children}
        {endIcon && <span className="ml-2">{endIcon}</span>}
      </button>
    )
  }
)
