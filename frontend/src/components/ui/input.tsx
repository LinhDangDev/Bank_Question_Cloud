import React, { InputHTMLAttributes } from 'react';
import { useThemeStyles, cx } from '../../utils/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  fullWidth = false,
  id,
  ...props
}) => {
  const styles = useThemeStyles();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={id}
          className={cx(
            "block text-sm font-medium mb-1",
            styles.isDark ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cx(
          "px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors",
          fullWidth ? 'w-full' : '',
          styles.input,
          error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
