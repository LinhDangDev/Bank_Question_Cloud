import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  title = 'Đã xảy ra lỗi',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 w-full bg-red-50 rounded-lg border border-red-200">
      <AlertTriangle className="text-red-500 w-10 h-10 mb-3" />
      <h3 className="text-lg font-semibold text-red-700 mb-1">
        {title}
      </h3>
      <p className="text-red-600 text-sm mb-4 text-center">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
