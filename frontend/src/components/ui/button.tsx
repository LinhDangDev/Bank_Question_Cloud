import React, { ButtonHTMLAttributes } from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const styles = useThemeStyles();

  // Base styles
  const baseStyles = "flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  // Variant styles
  const variantStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    outline: styles.isDark
      ? "bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800"
      : "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  // Disabled styles
  const disabledStyles = "opacity-50 cursor-not-allowed";

  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={cx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        widthStyles,
        (disabled || isLoading) && disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
