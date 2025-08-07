import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text = 'Đang tải...' }) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="animate-spin rounded-full border-2 border-gray-200 border-t-blue-500 mb-2 ease-linear
        duration-150 transition-all"
        style={{ width: size === 'sm' ? '1rem' : size === 'md' ? '2rem' : '3rem',
                 height: size === 'sm' ? '1rem' : size === 'md' ? '2rem' : '3rem' }}>
      </div>
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
