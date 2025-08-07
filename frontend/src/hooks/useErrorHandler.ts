import { useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface ErrorHandlerOptions {
  preventNavigation?: boolean;
  showToast?: boolean;
  logError?: boolean;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    preventNavigation = true,
    showToast = true,
    logError = true
  } = options;

  const errorRef = useRef<Error | null>(null);

  const handleError = useCallback((error: any, context?: string) => {
    // Store error reference
    errorRef.current = error;

    // Log error if enabled
    if (logError) {
      console.error(`Error in ${context || 'unknown context'}:`, error);
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = error?.message || 'Đã xảy ra lỗi không mong muốn';
      toast.error(message);
    }

    // Prevent navigation if enabled
    if (preventNavigation) {
      // Stop any pending navigation
      if (window.history.state) {
        window.history.replaceState(window.history.state, '', window.location.href);
      }
    }

    return error;
  }, [logError, showToast, preventNavigation]);

  const clearError = useCallback(() => {
    errorRef.current = null;
  }, []);

  const hasError = useCallback(() => {
    return errorRef.current !== null;
  }, []);

  return {
    handleError,
    clearError,
    hasError,
    currentError: errorRef.current
  };
};

export default useErrorHandler;
